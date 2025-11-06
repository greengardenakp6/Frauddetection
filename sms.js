// sms.js
const TwilioService = require('./twilio');

class SMSService {
    constructor() {
        this.twilio = new TwilioService();
        this.smsLogs = [];
    }

    async sendAlert(transaction, phoneNumber, type = 'fraud') {
        let result;
        
        if (type === 'fraud') {
            result = await this.twilio.sendFraudAlert(transaction, phoneNumber);
        } else {
            result = await this.twilio.sendTransactionConfirmation(transaction, phoneNumber);
        }

        // Log the SMS
        this.logSMS({
            transactionId: transaction.id,
            phoneNumber: phoneNumber,
            message: type,
            timestamp: new Date().toISOString(),
            success: result.success,
            sid: result.sid,
            type: type
        });

        return result;
    }

    logSMS(smsData) {
        this.smsLogs.unshift(smsData);
        // Keep only last 100 logs
        if (this.smsLogs.length > 100) {
            this.smsLogs = this.smsLogs.slice(0, 100);
        }
        
        // In a real app, save to database
        console.log('SMS Log:', smsData);
    }

    getSMSHistory(limit = 10) {
        return this.smsLogs.slice(0, limit);
    }

    getSMSByTransaction(transactionId) {
        return this.smsLogs.filter(log => log.transactionId === transactionId);
    }
}

module.exports = SMSService;
