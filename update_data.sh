#!/bin/bash

echo "📊 Fraud Detection Data Manager"
echo "================================"

case $1 in
    "backup")
        echo "Creating data backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        cp data/accounts.json data/backups/accounts_$timestamp.json
        cp data/transactions.json data/backups/transactions_$timestamp.json
        echo "✅ Backup created: backups/accounts_$timestamp.json"
        ;;
    "reset")
        echo "Resetting to sample data..."
        cp data/sample_accounts.json data/accounts.json
        cp data/sample_transactions.json data/transactions.json
        echo "✅ Data reset complete"
        ;;
    "stats")
        echo "📈 System Statistics:"
        echo "Accounts: $(jq '.accounts | length' data/accounts.json)"
        echo "Transactions: $(jq '.transactions | length' data/transactions.json)"
        ;;
    *)
        echo "Usage: ./update_data.sh [backup|reset|stats]"
        echo "  backup - Create data backup"
        echo "  reset  - Reset to sample data"
        echo "  stats  - Show data statistics"
        ;;
esac
