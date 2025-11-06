const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Validate Twilio configuration
const isTwilioConfigured = () => {
    return process.env.TWILIO_ACCOUNT_SID && 
           process.env.TWILIO_AUTH_TOKEN && 
           process.env.TWILIO_PHONE_NUMBER;
};

// Send SMS function
const sendSMS = async (to, message) => {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not properly configured');
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        return {
            success: true,
            messageId: result.sid,
            status: result.status,
            to: result.to
        };
    } catch (error) {
        console.error('Twilio Error:', error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};

// Validate phone number
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
};

module.exports = {
    sendSMS,
    validatePhoneNumber,
    isTwilioConfigured
};
