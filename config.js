
const CONFIG = {
    
    VERSION: "1.0.0",
    DEBUG: true,
    
   
    FEATURES: {
        LOCAL_STORAGE: true,
        FRAUD_DETECTION: true,
        EXPORT_REPORTS: true
    },
        THRESHOLDS: {
        HIGH_VALUE: 50000,
        VERY_HIGH_VALUE: 100000,
        RAPID_TRANSACTIONS: 2
    }
};

console.log('Fraud Detection System Config Loaded');
const config = {
    backend: {
        url: window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://your-backend-domain.com',
        endpoints: {
            status: '/api/status',
            transactions: '/api/transactions'
        }
    },
    twilio: {
        enabled: true,
        fromNumber: '+1234567890'
    },
    fraud: {
        highRiskThreshold: 70,
        alertEnabled: true
    }
};

export default config;
