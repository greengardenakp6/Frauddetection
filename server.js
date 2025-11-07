const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Check if C backend exists
if (!fs.existsSync('./fraudbackend')) {
    console.log('⚠️  C backend not found. Please compile fraudbackend.c first.');
    console.log('Run: gcc -o fraudbackend fraudbackend.c');
    console.log('Falling back to JavaScript simulation...');
}

// API endpoint to call C backend
app.post('/api/process-transaction', (req, res) => {
    const { accNo, amount, location } = req.body;
    
    console.log(`Processing transaction: Account ${accNo}, Amount $${amount}, Location ${location}`);
    
    // Execute the C program
    const command = `./fraudbackend ${accNo} ${amount} "${location}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('C backend error:', error);
            console.log('Falling back to JavaScript simulation...');
            
            // Fallback to JavaScript simulation
            const jsResult = simulateBackend(accNo, amount, location);
            return res.json(jsResult);
        }
        
        try {
            // Parse the JSON output from C program
            const result = JSON.parse(stdout);
            console.log('C backend result:', result);
            res.json(result);
        } catch (parseError) {
            console.error('Parse error:', parseError, 'Output:', stdout);
            res.status(500).json({ 
                success: false, 
                error: 'Invalid response from backend' 
            });
        }
    });
});

// Get transaction history
app.get('/api/transactions', (req, res) => {
    // In a real implementation, this would read from a database
    res.json({
        success: true,
        transactions: []
    });
});

// Get system statistics
app.get('/api/statistics', (req, res) => {
    res.json({
        success: true,
        statistics: {
            totalTransactions: 0,
            cleanTransactions: 0,
            suspiciousTransactions: 0,
            fraudRate: 0
        }
    });
});

// JavaScript simulation fallback
function simulateBackend(accNo, amount, location) {
    const alerts = [];
    let riskScore = 0;
    
    // High-value transaction checks
    if (amount > 100000) {
        alerts.push("Very high-value transaction");
        riskScore += 50;
    } else if (amount > 50000) {
        alerts.push("High-value transaction");
        riskScore += 25;
    }
    
    // Location-based checks
    const locations = ["New York", "London", "Tokyo", "Paris", "Sydney", "Dubai"];
    if (!locations.includes(location)) {
        alerts.push("Unusual location");
        riskScore += 15;
    }
    
    // Round amount check
    if (amount % 1000 === 0 && amount > 1000) {
        alerts.push("Round amount transaction");
        riskScore += 5;
    }
    
    // Determine status
    const status = riskScore > 20 ? "suspicious" : "clean";
    
    if (alerts.length === 0) {
        alerts.push("No fraud detected");
    }
    
    return {
        success: true,
        transaction: {
            id: Date.now(),
            accNo: parseInt(accNo),
            amount: parseFloat(amount),
            location: location,
            timestamp: Math.floor(Date.now() / 1000),
            riskScore: Math.min(riskScore, 100),
            status: status,
            remainingBalance: 100000 - amount,
            alerts: alerts
        }
    };
}

app.listen(port, () => {
    console.log(`🚀 Fraud Detection System Server running at http://localhost:${port}`);
    console.log('📊 Frontend: http://localhost:3000');
    console.log('🔧 API: http://localhost:3000/api/process-transaction');
});
