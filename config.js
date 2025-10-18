
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
