const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const twilio = require('twilio');
const axios = require('axios');
const app = express();
const port = 3000;

// Twilio Configuration
const twilioClient = twilio(
    'ACf60f450f29fabf5d4dd01680f2052f48',
    '84d51f29f32f4a9c8f653dc0966d6ba6'
);
const twilioPhoneNumber = '+14787395985';

// EmailJS Configuration - UPDATED
const EMAILJS_CONFIG = {
    serviceId: 'service_akash',
    templateId: 'template_akash', 
    userId: 'CaMVUkQYox6o96Q29'
};

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Check if C backend exists
if (!fs.existsSync('./fraudbackend')) {
    console.log('⚠️  C backend not found. Please compile fraudbackend.c first.');
    console.log('Run: gcc -o fraudbackend fraudbackend.c -lm');
}

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to call C backend
app.post('/api/process-transaction', async (req, res) => {
    const { accNo, amount, location, mobileNumber, emailAddress } = req.body;
    
    console.log(`📊 Processing transaction: Account ${accNo}, Amount $${amount}, Location ${location}`);
    
    try {
        // Execute the C program
        const command = `./fraudbackend ${accNo} ${amount} "${location}" "${mobileNumber}" "${emailAddress}"`;
        
        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error('❌ C backend error:', error);
                console.log('🔄 Falling back to JavaScript simulation...');
                
                // Fallback to JavaScript simulation
                const jsResult = simulateBackend(accNo, amount, location, mobileNumber, emailAddress);
                
                // Send alerts based on risk score
                if (jsResult.transaction.riskScore >= 20) {
                    await sendAlerts(jsResult.transaction);
                }
                
                return res.json(jsResult);
            }
            
            try {
                // Parse the JSON output from C program
                const result = JSON.parse(stdout);
                console.log('✅ C backend result - Risk Score:', result.transaction.riskScore);
                
                // Send alerts based on risk score
                if (result.transaction.riskScore >= 20) {
                    await sendAlerts(result.transaction);
                }
                
                res.json(result);
            } catch (parseError) {
                console.error('❌ Parse error:', parseError);
                // Fallback to JavaScript
                const jsResult = simulateBackend(accNo, amount, location, mobileNumber, emailAddress);
                res.json(jsResult);
            }
        });
    } catch (error) {
        console.error('❌ Transaction processing error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Transaction processing failed' 
        });
    }
});

// Send SMS Alert via Twilio
async function sendSMSAlert(transaction) {
    try {
        console.log('📱 Attempting to send SMS via Twilio to:', transaction.phone);
        
        // Validate phone number format
        if (!transaction.phone.startsWith('+')) {
            throw new Error('Phone number must include country code (e.g., +1234567890)');
        }

        const riskLevel = transaction.riskScore >= 60 ? 'HIGH RISK' : 
                         transaction.riskScore >= 30 ? 'MEDIUM RISK' : 'LOW RISK';
        
        const message = `🚨 FRAUD ALERT: Transaction $${transaction.amount} at ${transaction.location}. Risk: ${transaction.riskScore}% (${riskLevel}). Account: ${transaction.accNo}. Please verify immediately.`;

        const twilioResponse = await twilioClient.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: transaction.phone
        });

        console.log('✅ REAL SMS sent via Twilio. SID:', twilioResponse.sid);
        return { 
            success: true, 
            sid: twilioResponse.sid, 
            service: 'twilio', 
            realService: true,
            message: 'SMS sent successfully'
        };
    } catch (error) {
        console.error('❌ Twilio SMS error:', error.message);
        return { 
            success: false, 
            error: error.message, 
            service: 'twilio', 
            realService: false 
        };
    }
}

// Send Email Alert via EmailJS
async function sendEmailAlert(transaction) {
    try {
        console.log('📧 Attempting to send Email via EmailJS to:', transaction.email);
        
        const riskLevel = transaction.riskScore >= 60 ? 'HIGH RISK' : 
                         transaction.riskScore >= 30 ? 'MEDIUM RISK' : 'LOW RISK';
        
        const templateParams = {
            to_email: transaction.email,
            to_name: 'Security Team',
            from_name: 'Fraud Detection System',
            subject: `🚨 Fraud Alert - ${riskLevel} - $${transaction.amount}`,
            message: `
TRANSACTION ALERT:
• Account: ${transaction.accNo}
• Amount: $${transaction.amount}
• Location: ${transaction.location}
• Risk Score: ${transaction.riskScore}% (${riskLevel})
• Time: ${new Date().toLocaleString()}

ALERTS:
${transaction.alerts.join('\n• ')}

ACTION REQUIRED: ${transaction.riskScore >= 60 ? 'IMMEDIATE VERIFICATION' : 'REVIEW NEEDED'}
            `.trim()
        };

        const emailjsResponse = await axios.post(
            'https://api.emailjs.com/api/v1.0/email/send',
            {
                service_id: EMAILJS_CONFIG.serviceId,
                template_id: EMAILJS_CONFIG.templateId,
                user_id: EMAILJS_CONFIG.userId,
                template_params: templateParams,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            }
        );

        console.log('✅ REAL Email sent via EmailJS. Status:', emailjsResponse.status);
        return { 
            success: true, 
            messageId: emailjsResponse.data, 
            service: 'emailjs', 
            realService: true,
            message: 'Email sent successfully'
        };
    } catch (error) {
        console.error('❌ EmailJS error:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            service: 'emailjs', 
            realService: false 
        };
    }
}

// Send both SMS and Email alerts based on risk score
async function sendAlerts(transaction) {
    console.log(`🚨 Sending alerts for transaction with risk score: ${transaction.riskScore}%`);
    
    const results = {
        sms: { success: false, realService: false },
        email: { success: false, realService: false }
    };
    
    try {
        // Send SMS for risk >= 30%
        if (transaction.riskScore >= 30) {
            results.sms = await sendSMSAlert(transaction);
        }
        
        // Send Email for risk >= 20%
        if (transaction.riskScore >= 20) {
            results.email = await sendEmailAlert(transaction);
        }
    } catch (error) {
        console.error('Alert sending error:', error);
    }
    
    console.log('📊 Alert Results:', JSON.stringify(results, null, 2));
    return results;
}

// Manual alert endpoints
app.post('/api/send-sms', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number and message are required' 
            });
        }

        console.log('📱 Manual SMS request to:', phoneNumber);
        
        const result = await sendSMSAlert({
            phone: phoneNumber,
            amount: 0,
            location: 'Manual',
            riskScore: 100,
            accNo: 'Manual',
            alerts: ['Manual alert'],
            email: ''
        });

        res.json(result);

    } catch (error) {
        console.error('SMS endpoint error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            service: 'twilio',
            realService: false
        });
    }
});

app.post('/api/send-email', async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        
        if (!email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email, subject, and message are required' 
            });
        }

        console.log('📧 Manual Email request to:', email);
        
        const result = await sendEmailAlert({
            email: email,
            amount: 0,
            location: 'Manual',
            riskScore: 100,
            accNo: 'Manual',
            alerts: ['Manual alert']
        });

        res.json(result);

    } catch (error) {
        console.error('Email endpoint error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            service: 'emailjs',
            realService: false
        });
    }
});

// Test endpoints for service status
app.get('/api/test-backend', (req, res) => {
    const backendExists = fs.existsSync('./fraudbackend');
    res.json({ 
        success: true, 
        service: 'backend', 
        status: backendExists ? 'active' : 'fallback',
        realService: backendExists
    });
});

app.get('/api/test-sms', async (req, res) => {
    try {
        // Test Twilio by checking account balance
        const account = await twilioClient.accounts(twilioClient.accountSid).fetch();
        
        res.json({ 
            success: true, 
            service: 'sms', 
            status: 'active',
            provider: 'twilio',
            account: account.friendlyName,
            realService: true
        });
    } catch (error) {
        console.error('Twilio test error:', error.message);
        res.json({ 
            success: false, 
            service: 'sms', 
            status: 'inactive',
            error: error.message,
            provider: 'twilio',
            realService: false
        });
    }
});

app.get('/api/test-email', async (req, res) => {
    try {
        // Simple test to check if EmailJS credentials are valid
        const testResponse = await axios.get(`https://api.emailjs.com/api/v1.0/domain/check?user_id=${EMAILJS_CONFIG.userId}`);
        
        res.json({ 
            success: true, 
            service: 'email', 
            status: 'active',
            provider: 'emailjs',
            realService: true
        });
    } catch (error) {
        console.error('EmailJS test error:', error.message);
        res.json({ 
            success: false, 
            service: 'email', 
            status: 'inactive',
            error: error.message,
            provider: 'emailjs',
            realService: false
        });
    }
});

// Service configuration endpoint
app.get('/api/services/config', (req, res) => {
    res.json({
        twilio: {
            accountSid: twilioClient.accountSid,
            phoneNumber: twilioPhoneNumber,
            status: 'configured',
            realService: true
        },
        emailjs: {
            serviceId: EMAILJS_CONFIG.serviceId,
            templateId: EMAILJS_CONFIG.templateId,
            userId: EMAILJS_CONFIG.userId,
            status: 'configured',
            realService: true
        },
        alertThresholds: {
            sms: 30,
            email: 20,
            highRisk: 60
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            backend: fs.existsSync('./fraudbackend'),
            twilio: 'configured',
            emailjs: 'configured'
        }
    });
});

// JavaScript simulation fallback
function simulateBackend(accNo, amount, location, mobileNumber, emailAddress) {
    const alerts = [];
    let riskScore = 0;
    
    // High-value transaction checks
    if (amount > 100000) {
        alerts.push("Very high-value transaction");
        riskScore += 50;
    } else if (amount > 50000) {
        alerts.push("High-value transaction");
        riskScore += 25;
    }
    
    // Location-based checks
    const locations = ["New York", "London", "Tokyo", "Paris", "Sydney", "Dubai"];
    if (!locations.includes(location)) {
        alerts.push("Unusual location");
        riskScore += 15;
    }
    
    // Round amount check
    if (amount % 1000 === 0 && amount > 1000) {
        alerts.push("Round amount transaction");
        riskScore += 5;
    }
    
    // Determine status
    const status = riskScore > 20 ? "suspicious" : "clean";
    
    if (alerts.length === 0) {
        alerts.push("No fraud detected");
    }
    
    return {
        success: true,
        transaction: {
            id: Date.now(),
            accNo: parseInt(accNo),
            amount: parseFloat(amount),
            location: location,
            timestamp: Math.floor(Date.now() / 1000),
            riskScore: Math.min(riskScore, 100),
            status: status,
            remainingBalance: 100000 - amount,
            phone: mobileNumber,
            email: emailAddress,
            alerts: alerts
        }
    };
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.listen(port, () => {
    console.log(`🚀 Fraud Detection System Server running at http://localhost:${port}`);
    console.log('📊 Frontend: http://localhost:3000');
    console.log('🔧 Testing Services...');
    
    // Test services on startup
    setTimeout(async () => {
        console.log('\n🔍 Service Status:');
        try {
            const account = await twilioClient.accounts(twilioClient.accountSid).fetch();
            console.log('✅ Twilio SMS: ACTIVE - REAL SERVICE');
        } catch (error) {
            console.log('❌ Twilio SMS: INACTIVE -', error.message);
        }
        
        try {
            const testResponse = await axios.get(`https://api.emailjs.com/api/v1.0/domain/check?user_id=${EMAILJS_CONFIG.userId}`);
            console.log('✅ EmailJS: ACTIVE - REAL SERVICE');
        } catch (error) {
            console.log('❌ EmailJS: INACTIVE -', error.message);
        }
        
        console.log('\n💡 Usage:');
        console.log('   - Use amount ≥ $50,000 to trigger alerts');
        console.log('   - Phone format: +1234567890 (with country code)');
        console.log('   - Use real email for testing');
    }, 1000);
});
