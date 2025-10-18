// Configuration for Premium Fraud Detection System
const CONFIG = {
    // GitHub Pages base URL
    BASE_URL: window.location.origin,
    
    // Features
    FEATURES: {
        LOCAL_STORAGE: true,
        SIMULATION_MODE: true,
        DATA_EXPORT: true,
        PREMIUM_UI: true
    },
    
    // Premium account data
    DEFAULTS: {
        accounts: [
            { accNo: 100, name: "Alice Smith", balance: 150000, type: "Premium" },
            { accNo: 101, name: "Bob Johnson", balance: 75000, type: "Standard" },
            { accNo: 102, name: "Carol Davis", balance: 250000, type: "Business" },
            { accNo: 103, name: "David Wilson", balance: 50000, type: "Standard" },
            { accNo: 104, name: "Eva Brown", balance: 300000, type: "Premium" }
        ],
        locations: ["New York", "London", "Tokyo", "Paris", "Sydney", "Dubai"]
    }
};

/**
 * Premium Fraud Detection System
 * Enhanced with premium UI features
 */
class PremiumFraudDetectionSystem {
    constructor() {
        this.transactions = [];
        this.accounts = CONFIG.DEFAULTS.accounts;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTransactionHistory();
        this.updateAccountDropdown();
        this.updateStats();
        console.log('🎯 Premium Fraud Detection System Initialized');
    }

    setupEventListeners() {
        // Transaction form
        document.getElementById('transactionForm')
            .addEventListener('submit', (e) => this.handleTransaction(e));
        
        // Quick scan button
        document.getElementById('quickScan')
            .addEventListener('click', () => this.quickSecurityScan());
        
        // Action buttons
        document.getElementById('exportReport')
            .addEventListener('click', () => this.exportReport());
        document.getElementById('refreshStats')
            .addEventListener('click', () => this.refreshStats());
        document.getElementById('clearHistory')
            .addEventListener('click', () => this.clearHistory());
        document.getElementById('exportData')
            .addEventListener('click', () => this.exportData());
    }

    updateAccountDropdown() {
        const accNoSelect = document.getElementById('accNo');
        accNoSelect.innerHTML = '<option value="">Select Account</option>';
        
        this.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.accNo;
            option.textContent = `${account.accNo} - ${account.name} (${account.type}) - $${account.balance.toLocaleString()}`;
            accNoSelect.appendChild(option);
        });
    }

    async handleTransaction(e) {
        e.preventDefault();
        
        const accNo = document.getElementById('accNo').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const location = document.getElementById('location').value;
        
        if (!accNo || !amount || !location) {
            this.showNotification('Please fill all fields', 'warning');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Analyzing...';
        
        try {
            const result = await this.processTransaction({
                accNo: parseInt(accNo),
                amount: amount,
                location: location
            });
            
            this.displayPremiumResults(result);
            this.loadTransactionHistory();
            this.updateStats();
            
        } catch (error) {
            this.displayError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async quickSecurityScan() {
        this.showNotification('🔍 Running comprehensive security scan...', 'info');
        
        // Simulate security scan
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const threats = Math.random() > 0.7 ? ['Unusual pattern detected'] : [];
        
        if (threats.length > 0) {
            this.showNotification('🚨 Security threats detected!', 'danger');
        } else {
            this.showNotification('✅ System secure - No threats found', 'success');
        }
    }

    async processTransaction(transactionData) {
        // Simulate API call delay with premium animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Advanced fraud detection
        const alerts = this.premiumFraudDetection(transactionData);
        
        // Update account balance
        const account = this.accounts.find(acc => acc.accNo === transactionData.accNo);
        if (account) {
            account.balance -= transactionData.amount;
        }
        
        // Save transaction
        const txn = this.saveTransaction(transactionData, alerts);
        
        return { 
            success: true, 
            transactionId: txn.id,
            alerts: alerts,
            remainingBalance: account?.balance || 0,
            riskScore: this.calculateRiskScore(alerts)
        };
    }

    premiumFraudDetection(transaction) {
        const alerts = [];
        let riskLevel = 'low';
        
        // High-value check
        if (transaction.amount > 50000) {
            alerts.push("High-value transaction");
            riskLevel = 'medium';
        }
        
        if (transaction.amount > 100000) {
            alerts.push("Very high-value transaction");
            riskLevel = 'high';
        }
        
        // Rapid transactions check
        const recentTxns = this.transactions.filter(t => 
            t.accNo === transaction.accNo && 
            Date.now() - new Date(t.timestamp).getTime() < 60000
        );
        
        if (recentTxns.length >= 2) {
            alerts.push("Rapid multiple transactions");
            riskLevel = 'high';
        }
        
        // Location change check
        const lastTxn = this.transactions.find(t => t.accNo === transaction.accNo);
        if (lastTxn && lastTxn.location !== transaction.location) {
            alerts.push("Geographic anomaly detected");
            riskLevel = 'medium';
        }
        
        // Time-based detection (unusual hours)
        const currentHour = new Date().getHours();
        if (currentHour < 6 || currentHour > 22) {
            alerts.push("Unusual transaction time");
            riskLevel = 'medium';
        }
        
        // Round amount detection
        if (transaction.amount % 1000 === 0) {
            alerts.push("Round amount transaction");
            riskLevel = 'low';
        }

        return {
            alerts: alerts.length > 0 ? alerts : ["No fraud detected"],
            riskLevel: riskLevel,
            score: alerts.length * 25
        };
    }

    calculateRiskScore(alerts) {
        return Math.min(alerts.score, 100);
    }

    saveTransaction(transaction, fraudResult) {
        const txn = {
            id: Date.now(),
            ...transaction,
            timestamp: new Date().toISOString(),
            alerts: fraudResult.alerts,
            riskLevel: fraudResult.riskLevel,
            riskScore: fraudResult.score,
            status: fraudResult.alerts.includes("No fraud detected") ? 'clean' : 'suspicious'
        };
        
        this.transactions.unshift(txn);
        
        // Save to localStorage
        if (CONFIG.FEATURES.LOCAL_STORAGE) {
            localStorage.setItem('premiumFraudTransactions', JSON.stringify(this.transactions));
            localStorage.setItem('premiumFraudAccounts', JSON.stringify(this.accounts));
        }
        
        this.updateAccountDropdown();
        return txn;
    }

    loadTransactionHistory() {
        if (CONFIG.FEATURES.LOCAL_STORAGE) {
            const savedTxns = localStorage.getItem('premiumFraudTransactions');
            const savedAccounts = localStorage.getItem('premiumFraudAccounts');
            
            this.transactions = savedTxns ? JSON.parse(savedTxns) : [];
            this.accounts = savedAccounts ? JSON.parse(savedAccounts) : CONFIG.DEFAULTS.accounts;
        }
        
        this.displayTransactionHistory();
    }

    displayTransactionHistory() {
        const historyList = document.getElementById('historyList');
        const recentTxns = this.transactions.slice(0, 10);
        
        if (recentTxns.length === 0) {
            historyList.innerHTML = `
                <div class="no-data">
                    <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                    <h3>No transactions yet</h3>
                    <p>Process a transaction to see analytics</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = recentTxns.map(txn => `
            <div class="transaction-item ${txn.status} ${txn.riskLevel}">
                <div class="txn-header">
                    <div class="txn-account">Account: ${txn.accNo}</div>
                    <div class="txn-amount">$${txn.amount.toLocaleString()}</div>
                </div>
                <div class="txn-details">
                    <div class="txn-detail">
                        <span>📍</span> ${txn.location}
                    </div>
                    <div class="txn-detail">
                        <span>🕒</span> ${new Date(txn.timestamp).toLocaleString()}
                    </div>
                </div>
                <div class="alert-badge ${txn.status}">
                    ${txn.status === 'suspicious' ? '🚨 Suspicious' : '✅ Clean'}
                    <small>(${txn.riskScore}% risk)</small>
                </div>
                ${txn.alerts.length > 0 ? `
                    <div class="alerts">
                        ${txn.alerts.map(alert => `<span class="alert-tag">${alert}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    displayPremiumResults(result) {
        const resultsDiv = document.getElementById('results');
        
        const riskColor = result.riskScore > 50 ? 'danger' : result.riskScore > 25 ? 'warning' : 'success';
        const riskIcon = result.riskScore > 50 ? '🚨' : result.riskScore > 25 ? '⚠️' : '✅';
        
        let html = `
            <div class="result-header pulse">
                <h3>${riskIcon} Transaction Analysis Complete</h3>
                <div class="txn-id">ID: ${result.transactionId}</div>
            </div>
            <div class="risk-score alert alert-${riskColor}">
                <div class="alert-icon">${riskIcon}</div>
                <div class="alert-content">
                    <div class="alert-title">Risk Assessment</div>
                    <div>Overall Risk Score: <strong>${result.riskScore}%</strong></div>
                </div>
            </div>
            <div class="balance-info alert alert-info">
                <div class="alert-icon">💰</div>
                <div class="alert-content">
                    <div class="alert-title">Account Update</div>
                    <div>Remaining Balance: <strong>$${result.remainingBalance.toLocaleString()}</strong></div>
                </div>
            </div>
        `;
        
        result.alerts.alerts.forEach(alert => {
            let alertClass = 'alert-warning';
            let icon = '⚠️';
            
            if (alert.includes('No fraud')) {
                alertClass = 'alert-success';
                icon = '✅';
            } else if (alert.includes('High-value')) {
                alertClass = 'alert-danger';
                icon = '🚨';
            } else if (alert.includes('Unusual')) {
                alertClass = 'alert-info';
                icon = '🔍';
            }
            
            html += `
                <div class="alert ${alertClass}">
                    <div class="alert-icon">${icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">Security Alert</div>
                        <div>${alert}</div>
                    </div>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Show notification
        if (result.riskScore > 50) {
            this.showNotification('🚨 High-risk transaction detected!', 'danger');
        } else {
            this.showNotification('✅ Transaction processed successfully', 'success');
        }
    }

    updateStats() {
        const total = this.transactions.length;
        const clean = this.transactions.filter(t => t.status === 'clean').length;
        const suspicious = this.transactions.filter(t => t.status === 'suspicious').length;
        const fraudRate = total > 0 ? ((suspicious / total) * 100).toFixed(1) : 0;

        document.getElementById('totalTransactions').textContent = total;
        document.getElementById('cleanTransactions').textContent = clean;
        document.getElementById('suspiciousTransactions').textContent = suspicious;
        document.getElementById('fraudRate').textContent = `${fraudRate}%`;
    }

    refreshStats() {
        this.updateStats();
        this.showNotification('📊 Dashboard updated', 'info');
    }

    exportReport() {
        const report = {
            system: "Premium Fraud Detection System",
            exportDate: new Date().toISOString(),
            statistics: {
                totalTransactions: this.transactions.length,
                cleanTransactions: this.transactions.filter(t => t.status === 'clean').length,
                suspiciousTransactions: this.transactions.filter(t => t.status === 'suspicious').length,
                fraudRate: this.transactions.length > 0 ? 
                    ((this.transactions.filter(t => t.status === 'suspicious').length / this.transactions.length) * 100).toFixed(1) : 0
            },
            recentTransactions: this.transactions.slice(0, 10)
        };
        
        this.downloadJSON(report, `fraud-report-${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification('📈 Report exported successfully', 'success');
    }

    exportData() {
        const data = {
            transactions: this.transactions,
            accounts: this.accounts,
            exportDate: new Date().toISOString(),
            system: "Premium Fraud Detection System"
        };
        
        this.downloadJSON(data, `fraud-data-${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification('💾 Data exported successfully', 'success');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) {
            this.transactions = [];
            if (CONFIG.FEATURES.LOCAL_STORAGE) {
                localStorage.removeItem('premiumFraudTransactions');
            }
            this.loadTransactionHistory();
            this.updateStats();
            this.showNotification('🗑️ History cleared successfully', 'success');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.innerHTML = `
            <div class="alert-icon">${this.getNotificationIcon(type)}</div>
            <div class="alert-content">${message}</div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            danger: '🚨',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    displayError(message) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <div class="alert-icon">❌</div>
                <div class="alert-content">
                    <div class="alert-title">Error</div>
                    <div>${message}</div>
                </div>
            </div>
        `;
    }
}

// Initialize premium system
document.addEventListener('DOMContentLoaded', () => {
    window.fraudSystem = new PremiumFraudDetectionSystem();
});
