from flask import Flask, request, jsonify
from flask_cors import CORS
from twilio.rest import Client
import os
from dotenv import load_dotenv
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Initialize Twilio client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def is_twilio_configured():
    return all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER])

def validate_phone_number(phone):
    pattern = r'^\+\d{10,15}$'
    return re.match(pattern, phone) is not None

@app.route('/api/sms/send', methods=['POST'])
def send_sms():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        to = data.get('to')
        message = data.get('message')
        transaction_id = data.get('transactionId')
        
        # Validation
        if not to or not message:
            return jsonify({'success': False, 'error': 'Missing required fields: to and message'}), 400
        
        if not validate_phone_number(to):
            return jsonify({'success': False, 'error': 'Invalid phone number format'}), 400
        
        if not is_twilio_configured():
            return jsonify({'success': False, 'error': 'SMS service not configured'}), 500
        
        # Send SMS
        result = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to
        )
        
        # Log transaction
        print(f"SMS Sent - Transaction: {transaction_id}, To: {to}, Message ID: {result.sid}")
        
        return jsonify({
            'success': True,
            'messageId': result.sid,
            'status': result.status,
            'to': to,
            'transactionId': transaction_id
        })
        
    except Exception as e:
        print(f"SMS Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': 'Fraud Detection API is running',
        'sms_enabled': is_twilio_configured()
    })

if __name__ == '__main__':
    app.run(debug=True, port=3000)
