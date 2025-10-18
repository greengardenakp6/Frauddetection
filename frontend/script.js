class FraudDetectionSystem {
    constructor() {
        this.transactions = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTransactionHistory();
    }

    setupEventListeners() {
        document.getElementById('transactionForm')
            .addEventListener('submit', (e) => this.handleTransaction(e));
    }

    async handleTransaction(e) {
        e.preventDefault();
        
        const accNo = document.getElementById('accNo').value;
        const amount = document.getElementById('amount').value;
        const location = document.getElementById('location').value;
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        try {
            const result = await this.processTransaction({
                accNo: parseInt(accNo),
                amount: parseFloat(amount),
                location: location
            });
            
            this.displayResults(result);
            this.loadTransactionHistory(); // Refresh history
            
        } catch (error) {
            this.displayError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Process Transaction';
        }
    }

    async processTransaction(transactionData) {
        // For GitHub-only solution, we'll use client-side processing
        // In a real scenario, you'd call a serverless function
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Client-side fraud detection (simplified)
        const alerts = this.checkFraudClientSide(transactionData);
        
        // Save transaction
        this.saveTransaction(transactionData, alerts);
        
        return { alerts };
    }

    checkFraudClientSide(transaction) {
        const alerts = [];
        
        // High-value check
        if (transaction.amount > 50000) {
            alerts.push("High-value transaction");
        }
        
        // Rapid transactions check (simplified)
        const recentTxns = this.transactions.filter(t => 
            t.accNo === transaction.accNo && 
            Date.now() - new Date(t.timestamp).getTime() < 60000
        );
        
        if (recentTxns.length >= 2) {
            alerts.push("Rapid multiple transactions");
        }
        
        return alerts.length > 0 ? alerts : ["No fraud detected"];
    }

    saveTransaction(transaction, alerts) {
        const txn = {
            id: Date.now(),
            ...transaction,
            timestamp: new Date().toISOString(),
            alerts: alerts,
            status: alerts.length > 0 ? 'suspicious' : 'clean'
        };
        
        this.transactions.unshift(txn);
        
        // Save to localStorage (simulating database)
        localStorage.setItem('fraudTransactions', JSON.stringify(this.transactions));
        
        return txn;
    }

    loadTransactionHistory() {
        const saved = localStorage.getItem('fraudTransactions');
        this.transactions = saved ? JSON.parse(saved) : [];
        
        this.displayTransactionHistory();
    }

    displayTransactionHistory() {
        const historyList = document.getElementById('historyList');
        const recentTxns = this.transactions.slice(0, 10);
        
        if (recentTxns.length === 0) {
            historyList.innerHTML = '<p class="loading">No transactions yet</p>';
            return;
        }
        
        historyList.innerHTML = recentTxns.map(txn => `
            <div class="transaction-item">
                <strong>Acc: ${txn.accNo}</strong> | 
                Amount: $${txn.amount} | 
                Location: ${txn.location}
                <br>
                <small>Time: ${new Date(txn.timestamp).toLocaleString()}</small>
                <div class="alert alert-${txn.status === 'suspicious' ? 'warning' : 'success'}">
                    ${txn.alerts.join(', ')}
                </div>
            </div>
        `).join('');
    }

    displayResults(result) {
        const resultsDiv = document.getElementById('results');
        
        let html = '<h3>Transaction Results:</h3>';
        
        result.alerts.forEach(alert => {
            let alertClass = 'alert-warning';
            if (alert.includes('No fraud')) alertClass = 'alert-success';
            if (alert.includes('Error')) alertClass = 'alert-danger';
            
            html += `<div class="alert ${alertClass}">${alert}</div>`;
        });
        
        resultsDiv.innerHTML = html;
    }

    displayError(message) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${message}</div>`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new FraudDetectionSystem();
});
