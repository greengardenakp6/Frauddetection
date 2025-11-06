const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
async function ensureDataDirectory() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Load JSON data
async function loadJSON(filename) {
    try {
        const data = await fs.readFile(path.join(dataDir, filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Return default data if file doesn't exist
        if (filename === 'transactions.json') return [];
        if (filename === 'blacklist.json') return { accounts: [], ipAddresses: [] };
        if (filename === 'fraud_patterns.json') return { patterns: [] };
        return [];
    }
}

// Save JSON data
async function saveJSON(filename, data) {
    await ensureDataDirectory();
    await fs.writeFile(path.join(dataDir, filename), JSON.stringify(data, null, 2));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'connected', 
        message: 'Fraud Detection Backend is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// SMS endpoint
app.post('/api/send-sms', async (req, res) => {
    try {
        const { to, message, transactionId } = req.body;

        console.log('📱 SMS Request Received:');
        console.log('To:', to);
        console.log('Message:', message);
        console.log('Transaction ID:', transactionId);

        // Validate required fields
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to and message'
            });
        }

        // Validate phone number format
        const phoneRegex = /^\+\d{10,15}$/;
        if (!phoneRegex.test(to)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format. Use international format: +1234567890'
            });
        }

        // Simulate SMS sending (in real implementation, this would use Twilio)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Log the SMS attempt
        const smsLog = await loadJSON('sms_logs.json').catch(() => []);
        smsLog.push({
            to,
            message,
            transactionId,
            timestamp: new Date().toISOString(),
            status: 'sent'
        });
        await saveJSON('sms_logs.json', smsLog);

        res.json({
            success: true,
            message: 'SMS sent successfully!',
            messageId: 'sms-' + Date.now(),
            to: to,
            transactionId: transactionId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('SMS Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send SMS: ' + error.message
        });
    }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await loadJSON('transactions.json');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load transactions' });
    }
});

// Add new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = req.body;
        const transactions = await loadJSON('transactions.json');
        
        // Add metadata
        transaction.id = transactions.length + 1;
        transaction.timestamp = new Date().toISOString();
        transaction.fraud_score = await calculateFraudScore(transaction);
        
        transactions.push(transaction);
        await saveJSON('transactions.json', transactions);
        
        res.json({ 
            status: 'success', 
            transaction,
            fraud_score: transaction.fraud_score
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Fraud detection logic
async function calculateFraudScore(transaction) {
    const blacklist = await loadJSON('blacklist.json');
    let score = 0;
    
    // Amount-based scoring
    if (transaction.amount > 10000) score += 30;
    if (transaction.amount > 50000) score += 20;
    if (transaction.amount > 100000) score += 25;
    
    // Check if account is in blacklist
    if (blacklist.accounts.includes(transaction.account_id)) {
        score += 50;
    }
    
    // Location-based scoring
    const highRiskLocations = ['Dubai', 'Moscow', 'Beijing'];
    if (highRiskLocations.includes(transaction.location)) {
        score += 15;
    }
    
    return Math.min(score, 100);
}

// Get system stats
app.get('/api/stats', async (req, res) => {
    try {
        const transactions = await loadJSON('transactions.json');
        const total = transactions.length;
        const suspicious = transactions.filter(t => t.fraud_score > 50).length;
        const fraudRate = total > 0 ? (suspicious / total * 100).toFixed(1) : 0;
        
        res.json({
            total_transactions: total,
            suspicious_transactions: suspicious,
            fraud_rate: fraudRate,
            average_amount: total > 0 ? 
                transactions.reduce((sum, t) => sum + t.amount, 0) / total : 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Fraud Detection Backend running on http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`📱 SMS endpoint: http://localhost:${PORT}/api/send-sms`);
    console.log(`💳 Transactions: http://localhost:${PORT}/api/transactions`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down backend server...');
    process.exit(0);
});
