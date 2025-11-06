// twilio.js
const twilio = require('twilio');

class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
        this.authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER';
        this.client = twilio(this.accountSid, this.authToken);
    }

    async sendSMS(to, message) {
        try {
            const result = await this.client.messages.create({
                body: message,
                from: this.phoneNumber,
                to: to
            });
            
            console.log('SMS sent successfully:', result.sid);
            return {
                success: true,
                sid: result.sid,
                status: result.status
            };
        } catch (error) {
            console.error('Twilio SMS error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendFraudAlert(transactionData, phoneNumber) {
        const message = `🚨 FRAUD ALERT: Suspicious transaction detected\n
Account: ${transactionData.accNo}
Amount: $${transactionData.amount}
Location: ${transactionData.location}
Risk Score: ${transactionData.riskScore}%
Time: ${transactionData.timestamp}

Please review immediately.`;

        return await this.sendSMS(phoneNumber, message);
    }

    async sendTransactionConfirmation(transactionData, phoneNumber) {
        const message = `✅ TRANSACTION CONFIRMED: Your transaction was processed\n
Account: ${transactionData.accNo}
Amount: $${transactionData.amount}
Location: ${transactionData.location}
Status: ${transactionData.status}
Time: ${transactionData.timestamp}

Thank you for banking with us.`;

        return await this.sendSMS(phoneNumber, message);
    }
}

module.exports = TwilioService;
