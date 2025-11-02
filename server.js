const express = require('express');
const PDFDocument = require('pdfkit');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Twilio Configuration (Get these from twilio.com/console)
const TWILIO_ACCOUNT_SID = 'your_twilio_account_sid';
const TWILIO_AUTH_TOKEN = 'your_twilio_auth_token';
const TWILIO_PHONE_NUMBER = 'your_twilio_phone_number'; // Format: +1234567890

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Email Configuration (for email reports)
const emailTransporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_app_password' // Use app password, not regular password
    }
});

// REAL PDF Generation
app.get('/generate-pdf-report', (req, res) => {
    try {
        const { accNo, transactionId, amount, location, riskScore, alerts } = req.query;
        
        console.log('📄 Generating REAL PDF report...');
        
        const doc = new PDFDocument();
        
        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=fraud-report-${transactionId}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add professional PDF content
        // Header
        doc.fillColor('#2c3e50')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('FRAUD DETECTION SYSTEM', 50, 50, { align: 'center' });
        
        doc.fillColor('#666')
           .fontSize(12)
           .font('Helvetica')
           .text(`Official Report - Generated: ${new Date().toLocaleString()}`, 50, 80, { align: 'center' });
        
        // Add a line
        doc.moveTo(50, 110)
           .lineTo(550, 110)
           .strokeColor('#3498db')
           .lineWidth(2)
           .stroke();
        
        // Transaction Details Section
        doc.fillColor('#2c3e50')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('TRANSACTION DETAILS', 50, 130);
        
        doc.fillColor('#333')
           .fontSize(12)
           .font('Helvetica')
           .text(`Account Number: ${accNo || 'N/A'}`, 50, 160)
           .text(`Transaction ID: ${transactionId || 'N/A'}`, 50, 180)
           .text(`Amount: $${amount ? parseFloat(amount).toLocaleString() : 'N/A'}`, 50, 200)
           .text(`Location: ${location || 'N/A'}`, 50, 220)
           .text(`Timestamp: ${new Date().toLocaleString()}`, 50, 240);
        
        // Risk Assessment
        doc.fillColor('#2c3e50')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('RISK ASSESSMENT', 50, 270);
        
        const riskLevel = parseInt(riskScore) >= 60 ? 'HIGH' : 
                         parseInt(riskScore) >= 30 ? 'MEDIUM' : 'LOW';
        
        const riskColor = parseInt(riskScore) >= 60 ? '#e74c3c' : 
                         parseInt(riskScore) >= 30 ? '#f39c12' : '#27ae60';
        
        doc.fillColor(riskColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text(`Risk Score: ${riskScore}%`, 50, 300)
           .text(`Risk Level: ${riskLevel}`, 50, 320);
        
        // Security Analysis
        doc.fillColor('#2c3e50')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('SECURITY ANALYSIS', 50, 360);
        
        let yPosition = 390;
        if (alerts && alerts.length > 0) {
            const alertList = alerts.split(',');
            alertList.forEach(alert => {
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }
                doc.fillColor('#e74c3c')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text('• ', 70, yPosition)
                   .fillColor('#333')
                   .text(alert.trim(), 85, yPosition, { 
                       width: 450,
                       continued: false 
                   });
                yPosition += 20;
            });
        } else {
            doc.fillColor('#27ae60')
               .fontSize(11)
               .text('• No security threats detected', 70, yPosition);
            yPosition += 20;
        }
        
        // Recommendations
        doc.fillColor('#2c3e50')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('RECOMMENDATIONS', 50, yPosition + 20);
        
        yPosition += 50;
        
        if (parseInt(riskScore) >= 60) {
            doc.fillColor('#e74c3c')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('• Immediate account review required', 70, yPosition)
               .text('• Contact account holder immediately', 70, yPosition + 20)
               .text('• Consider temporary account freeze', 70, yPosition + 40)
               .text('• Notify security team', 70, yPosition + 60);
        } else if (parseInt(riskScore) >= 30) {
            doc.fillColor('#f39c12')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('• Monitor account activity closely', 70, yPosition)
               .text('• Verify recent transactions', 70, yPosition + 20)
               .text('• Enhanced monitoring recommended', 70, yPosition + 40);
        } else {
            doc.fillColor('#27ae60')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('• Continue normal monitoring', 70, yPosition)
               .text('• No immediate action required', 70, yPosition + 20);
        }
        
        // Footer
        doc.fillColor('#999')
           .fontSize(10)
           .font('Helvetica')
           .text('Confidential Report - Generated by Advanced Fraud Detection System', 
                 50, 750, { align: 'center' });
        
        doc.end();
        
        console.log('✅ REAL PDF generated successfully');
        
    } catch (error) {
        console.error('❌ PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// REAL SMS Sending with Twilio
app.post('/send-sms-alert', async (req, res) => {
    try {
        const { phoneNumber, message, transactionDetails } = req.body;
        
        console.log('📱 Sending REAL SMS...');
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Validate phone number format
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        if (cleanPhoneNumber.length < 10) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Format phone number for Twilio (ensure it starts with +)
        const formattedPhoneNumber = cleanPhoneNumber.startsWith('+') ? 
            cleanPhoneNumber : `+${cleanPhoneNumber}`;

        // Send REAL SMS using Twilio
        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: formattedPhoneNumber
        });

        console.log('✅ REAL SMS sent successfully:', twilioMessage.sid);
        
        res.json({
            success: true,
            message: `SMS alert sent to ${formattedPhoneNumber}`,
            messageId: twilioMessage.sid,
            timestamp: new Date().toISOString(),
            provider: 'Twilio'
        });
        
    } catch (error) {
        console.error('❌ SMS sending error:', error);
        
        // Fallback: Log the message that would have been sent
        console.log('SMS Fallback - Message would be:', {
            to: req.body.phoneNumber,
            message: req.body.message
        });
        
        res.status(500).json({ 
            success: false,
            error: 'Failed to send SMS. Please check Twilio configuration.',
            details: error.message
        });
    }
});

// REAL Email Sending
app.post('/send-email-report', async (req, res) => {
    try {
        const { email, subject, reportData } = req.body;
        
        console.log('📧 Sending REAL Email...');
        
        if (!email) {
            return res.status(400).json({ error: 'Email address is required' });
        }

        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { margin: 20px 0; }
                    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🚨 Fraud Detection Alert</h1>
                </div>
                <div class="content">
                    <h2>Transaction Report</h2>
                    <p><strong>Transaction ID:</strong> ${reportData.id}</p>
                    <p><strong>Account:</strong> ${reportData.accNo}</p>
                    <p><strong>Amount:</strong> $${reportData.amount}</p>
                    <p><strong>Location:</strong> ${reportData.location}</p>
                    <p><strong>Risk Score:</strong> ${reportData.riskScore}%</p>
                    
                    <div class="alert">
                        <h3>Security Alerts:</h3>
                        <ul>
                            ${reportData.alerts.map(alert => `<li>${alert}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated message from your Fraud Detection System.</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        // Send REAL email
        const mailOptions = {
            from: '"Fraud Detection System" <noreply@frauddetection.com>',
            to: email,
            subject: subject || 'Fraud Detection System Report',
            html: emailContent
        };

        const emailResult = await emailTransporter.sendMail(mailOptions);
        
        console.log('✅ REAL Email sent successfully:', emailResult.messageId);
        
        res.json({
            success: true,
            message: `Email report sent to ${email}`,
            messageId: emailResult.messageId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Email sending error:', error);
        
        // Fallback: Log the email that would have been sent
        console.log('Email Fallback - Would send to:', {
            to: req.body.email,
            subject: req.body.subject
        });
        
        res.status(500).json({ 
            success: false,
            error: 'Failed to send email. Please check email configuration.',
            details: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Fraud Detection System',
        features: {
            pdf: 'active',
            sms: TWILIO_ACCOUNT_SID ? 'active' : 'needs_configuration',
            email: 'active'
        },
        timestamp: new Date().toISOString()
    });
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Fraud Detection System running on http://localhost:${PORT}`);
    console.log(`📄 PDF Reports: http://localhost:${PORT}/generate-pdf-report`);
    console.log(`📱 SMS Alerts: http://localhost:${PORT}/send-sms-alert`);
    console.log(`📧 Email Reports: http://localhost:${PORT}/send-email-report`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    
    if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
        console.log('⚠️  SMS feature needs Twilio configuration');
    }
});
