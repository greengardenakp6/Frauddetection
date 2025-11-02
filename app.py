from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from twilio.rest import Client

app = Flask(__name__)
CORS(app)  # allows cross-origin requests (for testing)

# Twilio credentials (replace with your own)
account_sid = "YOUR_TWILIO_SID"
auth_token = "YOUR_TWILIO_AUTH_TOKEN"
twilio_number = "1234567890"  # your Twilio phone number

client = Client(account_sid, auth_token)

@app.route('/')
def home():
    return render_template('404.html')

@app.route('/send-alert', methods=['POST'])
def send_alert():
    data = request.get_json()
    phone = data.get("phone")
    message = data.get("message")

    try:
        msg = client.messages.create(
            body=message,
            from_=twilio_number,
            to=phone
        )
        return jsonify({"status": "success", "sid": msg.sid})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
