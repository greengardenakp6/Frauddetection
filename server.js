const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load JSON data
async function loadJSON(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save JSON data
async function saveJSON(filename, data) {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
}

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'connected', 
        server: 'server.js Backend',
        timestamp: new Date().toISOString()
    });
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await loadJSON('transactions.json');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load transactions' });
    }
});

// Add transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = req.body;
        const transactions = await loadJSON('transactions.json');
        
        // Add metadata
        transaction.id = transactions.length + 1;
        transaction.timestamp = new Date().toISOString();
        transaction.fraud_score = await calculateFraudScore(transaction);
        
        transactions.push(transaction);
        await saveJSON('transactions.json', transactions);
        
        res.json({ status: 'success', transaction });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Fraud detection
async function calculateFraudScore(transaction) {
    const blacklist = await loadJSON('blacklist.json');
    const patterns = await loadJSON('fraud_patterns.json');
    
    let score = 0;
    
    if (transaction.amount > 10000) score += 30;
    if (blacklist.accounts?.includes(transaction.account_id)) score += 50;
    if (transaction.location === 'high_risk_country') score += 25;
    
    return Math.min(score, 100);
}

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`✅ Status: Connected`);
});
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'connected', 
        server: 'Fraud Detection Backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// SMS endpoint (mock for testing)
app.post('/api/send-sms', async (req, res) => {
    try {
        const { to, message, transactionId } = req.body;
        
        console.log('📱 SMS Request:', { to, message, transactionId });
        
        // Simulate SMS sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful response
        res.json({
            success: true,
            message: 'SMS sent successfully (mock)',
            messageId: 'mock-' + Date.now(),
            to: to,
            transactionId: transactionId
        });
        
    } catch (error) {
        console.error('SMS Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await loadJSON('transactions.json');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load transactions' });
    }
});

// Add transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = req.body;
        const transactions = await loadJSON('transactions.json');
        
        transaction.id = transactions.length + 1;
        transaction.timestamp = new Date().toISOString();
        transaction.fraud_score = await calculateFraudScore(transaction);
        
        transactions.push(transaction);
        await saveJSON('transactions.json', transactions);
        
        res.json({ status: 'success', transaction });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Helper functions
async function loadJSON(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveJSON(filename, data) {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
}

async function calculateFraudScore(transaction) {
    let score = 0;
    if (transaction.amount > 10000) score += 30;
    if (transaction.amount > 50000) score += 20;
    return Math.min(score, 100);
}

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`📱 SMS endpoint: http://localhost:${PORT}/api/send-sms`);
});
