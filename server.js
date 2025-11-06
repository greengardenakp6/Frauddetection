// server.js
const express = require('express');
const cors = require('cors');
const SMSService = require('./sms');
const path = require('path');

const app = express();
const smsService = new SMSService();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// SMS endpoints
app.post('/api/send-sms', async (req, res) => {
    try {
        const { phoneNumber, message, transactionData } = req.body;
        
        const result = await smsService.twilio.sendSMS(phoneNumber, message);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/send-fraud-alert', async (req, res) => {
    try {
        const { phoneNumber, transactionData } = req.body;
        
        const result = await smsService.sendAlert(transactionData, phoneNumber, 'fraud');
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/send-transaction-confirmation', async (req, res) => {
    try {
        const { phoneNumber, transactionData } = req.body;
        
        const result = await smsService.sendAlert(transactionData, phoneNumber, 'confirmation');
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/sms-history', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const history = smsService.getSMSHistory(limit);
    res.json(history);
});

app.get('/api/sms-history/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;
    const smsLogs = smsService.getSMSByTransaction(transactionId);
    res.json(smsLogs);
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Fraud Detection System running on port ${PORT}`);
    console.log(`Twilio SMS Service: ${smsService.twilio.accountSid ? 'Configured' : 'Not Configured'}`);
});
