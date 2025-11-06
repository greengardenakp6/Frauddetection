const express = require('express');
const router = express.Router();
const { sendSMS, validatePhoneNumber, isTwilioConfigured } = require('../config/twilio');

// Send SMS endpoint
router.post('/send', async (req, res) => {
    try {
        const { to, message, transactionId } = req.body;

        // Validation
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to and message'
            });
        }

        if (!validatePhoneNumber(to)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format. Use international format: +1234567890'
            });
        }

        if (!isTwilioConfigured()) {
            return res.status(500).json({
                success: false,
                error: 'SMS service is not configured. Please check Twilio settings.'
            });
        }

        // Send SMS
        const result = await sendSMS(to, message);

        // Log the transaction
        console.log('SMS Sent:', {
            transactionId,
            to: result.to,
            messageId: result.messageId,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            messageId: result.messageId,
            status: result.status,
            to: result.to,
            transactionId: transactionId
        });

    } catch (error) {
        console.error('SMS Send Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// SMS status check
router.get('/status/:messageId', async (req, res) => {
    try {
        // This would require additional Twilio setup for webhooks
        // For now, return basic status
        res.json({
            success: true,
            messageId: req.params.messageId,
            status: 'delivered', // This would be fetched from Twilio in production
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
