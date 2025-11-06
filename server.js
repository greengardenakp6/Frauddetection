// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Import after dotenv config
const TwilioService = require('./twilio');
const smsService = new TwilioService();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Test endpoint to check Twilio config
app.get('/api/config-status', (req, res) => {
    const status = {
        twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID,
        accountSid: process.env.TWILIO_ACCOUNT_SID ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4) : 'Not set',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not set'
    };
    res.json(status);
});

// SMS endpoints
app.post('/api/send-sms', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and message are required'
            });
        }

        const result = await smsService.sendSMS(phoneNumber, message);
        res.json(result);
    } catch (error) {
        console.error('SMS API error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/send-fraud-alert', async (req, res) => {
    try {
        const { phoneNumber, transactionData } = req.body;
        
        if (!phoneNumber || !transactionData) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and transaction data are required'
            });
        }

        const result = await smsService.sendFraudAlert(transactionData, phoneNumber);
        res.json(result);
    } catch (error) {
        console.error('Fraud alert API error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Fraud Detection System running on port ${PORT}`);
    console.log(`📱 Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || 'Not configured'}`);
    console.log(`🔐 Twilio Status: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
});
