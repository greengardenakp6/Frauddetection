const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple SMS endpoint
app.post('/api/send-sms', async (req, res) => {
    try {
        const { to, message, transactionId } = req.body;

        console.log('📱 SMS Request Received:', { to, message, transactionId });

        // If Twilio credentials are provided, use real SMS
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );

            const result = await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });

            return res.json({
                success: true,
                messageId: result.sid,
                status: 'sent',
                message: 'SMS sent successfully via Twilio'
            });
        } else {
            // Simulate SMS sending (for testing)
            console.log('📲 SIMULATED SMS:', { to, message });
            
            return res.json({
                success: true,
                messageId: 'simulated-' + Date.now(),
                status: 'delivered',
                message: 'SMS simulated successfully (Twilio not configured)'
            });
        }
    } catch (error) {
        console.error('SMS Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Fraud Detection Backend is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📧 SMS endpoint: http://localhost:${PORT}/api/send-sms`);
});
