from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load data files
def load_json_file(filename):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_json_file(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

# Routes
@app.route('/')
def home():
    return jsonify({"status": "connected", "message": "Transdetection Backend Running"})

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = load_json_file('transactions.json')
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    transaction = request.json
    transactions = load_json_file('transactions.json')
    
    # Add timestamp and ID
    transaction['id'] = len(transactions) + 1
    transaction['timestamp'] = datetime.now().isoformat()
    
    # Fraud detection logic
    transaction['fraud_score'] = detect_fraud(transaction)
    
    transactions.append(transaction)
    save_json_file('transactions.json', transactions)
    
    return jsonify({"status": "success", "transaction": transaction})

@app.route('/api/status')
def status():
    return jsonify({"status": "connected", "timestamp": datetime.now().isoformat()})

def detect_fraud(transaction):
    # Basic fraud detection logic
    fraud_patterns = load_json_file('fraud_patterns.json')
    blacklist = load_json_file('blacklist.json')
    
    score = 0
    
    # Check amount
    if transaction.get('amount', 0) > 10000:
        score += 30
    
    # Check if in blacklist
    if transaction.get('account_id') in blacklist.get('accounts', []):
        score += 50
    
    # Check frequency patterns (simplified)
    transactions = load_json_file('transactions.json')
    recent_tx = [tx for tx in transactions if tx.get('account_id') == transaction.get('account_id')]
    if len(recent_tx) > 5:  # More than 5 transactions recently
        score += 20
    
    return min(score, 100)

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
