// Simple configuration
const CONFIG = {
    accounts: [
        { accNo: 100, name: "Alice Smith", balance: 150000, type: "Premium" },
        { accNo: 101, name: "Bob Johnson", balance: 75000, type: "Standard" },
        { accNo: 102, name: "Carol Davis", balance: 250000, type: "Business" },
        { accNo: 103, name: "David Wilson", balance: 50000, type: "Standard" },
        { accNo: 104, name: "Eva Brown", balance: 300000, type: "Premium" }
    ]
};

// Simple Fraud Detection System
class FraudDetectionSystem {
    constructor() {
        this.transactions = [];
        this.accounts = CONFIG.accounts;
        this.init();
    }

    init() {
        console.log('Fraud Detection System Started');
        this.setupEventListeners();
        this.loadTransactionHistory();
        this.updateStats();
    }

    setupEventListeners() {
        // Transaction form
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleTransaction(e));
        }

        // Quick scan button
        const quickScanBtn = document.getElementById('quickScan');
        if (quickScanBtn) {
            quickScanBtn.addEventListener('click', () => this.quickSecurityScan());
        }

        // Refresh stats button
        const refreshBtn = document.getElementById('refreshStats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshStats());
        }

        // Export button
        const exportBtn = document.getElementById('exportReport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    handleTransaction(e) {
        e.preventDefault();
        
        // Get form values
        const accNo = document.getElementById('accNo').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const location = document.getElementById('location').value;

        // Basic validation
        if (!accNo || !amount || amount <= 0 || !location) {
            this.showAlert('Please fill all fields correctly', 'error');
            return;
        }

        // Disable button and show loading
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Processing...';

        // Process transaction after short delay
        setTimeout(() => {
            try {
                const result = this.processTransaction({
                    accNo: parseInt(accNo),
                    amount: amount,
                    location: location
                });
                
                this.displayResults(result);
                this.loadTransactionHistory();
                this.updateStats();
                
            } catch (error) {
                this.showAlert('Error: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }, 1000);
    }

    processTransaction(transactionData) {
        // Find account
        const account = this.accounts.find(acc => acc.accNo === transactionData.accNo);
        if (!account) {
            throw new Error('Account not found');
        }

        // Check balance
        if (account.balance < transactionData.amount) {
            throw new Error('Insufficient balance');
        }

        // Fraud detection
        const fraudAlerts = this.detectFraud(transactionData);
        
        // Update account balance
        account.balance -= transactionData.amount;

        // Save transaction
        const transaction = {
            id: Date.now(),
            ...transactionData,
            timestamp: new Date().toLocaleString(),
            alerts: fraudAlerts,
            status: fraudAlerts.length > 0 ? 'suspicious' : 'clean',
            riskScore: this.calculateRiskScore(fraudAlerts)
        };

        this.transactions.unshift(transaction);
        this.saveToLocalStorage();

        return {
            success: true,
            transaction: transaction,
            remainingBalance: account.balance
        };
    }

    detectFraud(transaction) {
        const alerts = [];

        // High value check
        if (transaction.amount > 50000) {
            alerts.push("High-value transaction detected");
        }

        if (transaction.amount > 100000) {
            alerts.push("Very high-value transaction");
        }

        // Rapid transactions check
        const recentTransactions = this.transactions.filter(t => 
            t.accNo === transaction.accNo
        ).slice(0, 3);

        if (recentTransactions.length >= 2) {
            alerts.push("Multiple rapid transactions");
        }

        // Location change check
        const lastTransaction = this.transactions.find(t => t.accNo === transaction.accNo);
        if (lastTransaction && lastTransaction.location !== transaction.location) {
            alerts.push("Geographic anomaly detected");
        }

        // Round amount check
        if (transaction.amount % 1000 === 0) {
            alerts.push("Round amount transaction");
        }

        return alerts.length > 0 ? alerts : ["No fraud detected"];
    }

    calculateRiskScore(alerts) {
        if (alerts.includes("No fraud detected")) return 0;
        return Math.min(alerts.length * 25, 100);
    }

    displayResults(result) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;

        const riskScore = result.transaction.riskScore;
        const riskLevel = riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low';
        
        let html = `
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #155724; margin-bottom: 10px;">✅ Transaction Successful</h3>
                <p><strong>Transaction ID:</strong> ${result.transaction.id}</p>
                <p><strong>Remaining Balance:</strong> $${result.remainingBalance.toLocaleString()}</p>
                <p><strong>Risk Score:</strong> ${riskScore}% (${riskLevel} risk)</p>
            </div>
        `;

        result.transaction.alerts.forEach(alert => {
            const isWarning = !alert.includes("No fraud detected");
            const alertStyle = isWarning ? 
                "background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ffc107;" :
                "background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #28a745;";
            
            const icon = isWarning ? '⚠️' : '✅';
            
            html += `<div style="${alertStyle}">${icon} ${alert}</div>`;
        });

        resultsDiv.innerHTML = html;
        resultsDiv.scrollIntoView({ behavior: 'smooth' });

        // Show notification
        if (riskScore > 50) {
            this.showAlert('🚨 High-risk transaction detected!', 'warning');
        } else {
            this.showAlert('✅ Transaction processed successfully', 'success');
        }
    }

    loadTransactionHistory() {
        // Load from localStorage
        const saved = localStorage.getItem('fraudTransactions');
        this.transactions = saved ? JSON.parse(saved) : [];
        
        this.displayTransactionHistory();
    }

    displayTransactionHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const recentTransactions = this.transactions.slice(0, 10);

        if (recentTransactions.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <div style="font-size: 3em; margin-bottom: 10px;">📊</div>
                    <h3>No transactions yet</h3>
                    <p>Process a transaction to see history</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = recentTransactions.map(txn => `
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid ${txn.status === 'suspicious' ? '#ffc107' : '#28a745'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>Account: ${txn.accNo}</strong>
                    <span style="font-weight: bold; color: ${txn.status === 'suspicious' ? '#dc3545' : '#28a745'};">$${txn.amount.toLocaleString()}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; color: #666; font-size: 0.9em;">
                    <div>📍 ${txn.location}</div>
                    <div>🕒 ${txn.timestamp}</div>
                </div>
                <div style="display: inline-block; padding: 5px 15px; background: ${txn.status === 'suspicious' ? '#fff3cd' : '#d4edda'}; color: ${txn.status === 'suspicious' ? '#856404' : '#155724'}; border-radius: 20px; font-size: 0.8em; font-weight: bold;">
                    ${txn.status === 'suspicious' ? '🚨 Suspicious' : '✅ Clean'} (${txn.riskScore}% risk)
                </div>
                ${txn.alerts.length > 0 ? `
                    <div style="margin-top: 10px;">
                        ${txn.alerts.map(alert => `
                            <span style="display: inline-block; background: #e9ecef; padding: 4px 8px; margin: 2px; border-radius: 12px; font-size: 0.8em;">${alert}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.transactions.length;
        const clean = this.transactions.filter(t => t.status === 'clean').length;
        const suspicious = this.transactions.filter(t => t.status === 'suspicious').length;
        const fraudRate = total > 0 ? ((suspicious / total) * 100).toFixed(1) : 0;

        // Update stat cards
        this.updateStatCard('totalTransactions', total);
        this.updateStatCard('cleanTransactions', clean);
        this.updateStatCard('suspiciousTransactions', suspicious);
        this.updateStatCard('fraudRate', fraudRate + '%');
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    quickSecurityScan() {
        this.showAlert('🔍 Running security scan...', 'info');
        
        setTimeout(() => {
            const threats = Math.random() > 0.7 ? ['Unusual pattern detected'] : [];
            
            if (threats.length > 0) {
                this.showAlert('🚨 Security threats detected!', 'warning');
            } else {
                this.showAlert('✅ System secure - No threats found', 'success');
            }
        }, 2000);
    }

    refreshStats() {
        this.updateStats();
        this.showAlert('📊 Stats updated', 'info');
    }

    exportReport() {
        const report = {
            system: "Fraud Detection System",
            exportDate: new Date().toISOString(),
            statistics: {
                totalTransactions: this.transactions.length,
                cleanTransactions: this.transactions.filter(t => t.status === 'clean').length,
                suspiciousTransactions: this.transactions.filter(t => t.status === 'suspicious').length
            },
            recentTransactions: this.transactions.slice(0, 5)
        };
        
        this.downloadJSON(report, `fraud-report-${new Date().toISOString().split('T')[0]}.json`);
        this.showAlert('📈 Report exported successfully', 'success');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    saveToLocalStorage() {
        localStorage.setItem('fraudTransactions', JSON.stringify(this.transactions));
        localStorage.setItem('fraudAccounts', JSON.stringify(this.accounts));
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';
        
        const styles = {
            info: 'background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8;',
            success: 'background: #d4edda; color: #155724; border-left: 4px solid #28a745;',
            warning: 'background: #fff3cd; color: #856404; border-left: 4px solid #ffc107;',
            error: 'background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545;'
        };

        alertDiv.style = `
            ${styles[type] || styles.info}
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        alertDiv.innerHTML = message;
        document.body.appendChild(alertDiv);

        // Remove after 4 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 4000);
    }
}

// Add CSS for animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the system when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing system...');
    window.fraudSystem = new FraudDetectionSystem();
});
