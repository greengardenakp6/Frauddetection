

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

#define MAX_ACCOUNTS 10
#define MAX_TRANSACTIONS 100
#define MAX_ALERT_LENGTH 1024
#define HIGH_VALUE_THRESHOLD 50000.0
#define RAPID_TXN_THRESHOLD 3
#define RAPID_TXN_WINDOW 60 // seconds
#define IMPOSSIBLE_TRAVEL_TIME 600 // seconds

typedef struct {
    int accNo;
    char name[50];
    double balance;
    char lastLocation[30];
    time_t lastTxnTime;
    int isActive;
} Account;

typedef struct {
    int txnId;
    int accNo;
    double amount;
    char location[30];
    time_t timestamp;
    char status[20]; // "clean", "suspicious", "fraud"
} Transaction;

// Global variables
Account accounts[MAX_ACCOUNTS];
Transaction transactions[MAX_TRANSACTIONS];
int txnCount = 0;
int accountCount = 0;

/**
 * Initialize sample accounts
 */
void initializeAccounts() {
    const char *names[] = {"Alice Smith", "Bob Johnson", "Carol Davis", "David Wilson", "Eva Brown"};
    const char *locations[] = {"New York", "London", "Tokyo", "Paris", "Sydney"};
    
    for (int i = 0; i < MAX_ACCOUNTS && i < 5; i++) {
        accounts[i].accNo = 100 + i;
        strcpy(accounts[i].name, names[i]);
        accounts[i].balance = 100000.0 + (i * 5000); // Varying balances
        strcpy(accounts[i].lastLocation, locations[i]);
        accounts[i].lastTxnTime = time(NULL) - (i * 3600); // Staggered times
        accounts[i].isActive = 1;
        accountCount++;
    }
    
    printf("Initialized %d accounts\n", accountCount);
}

/**
 * Find account by account number
 */
Account* findAccount(int accNo) {
    for (int i = 0; i < accountCount; i++) {
        if (accounts[i].accNo == accNo && accounts[i].isActive) {
            return &accounts[i];
        }
    }
    return NULL;
}

/**
 * Check for high-value transactions
 */
int checkHighValueTransaction(double amount, char* alert) {
    if (amount > HIGH_VALUE_THRESHOLD) {
        strcpy(alert, "High-value transaction");
        return 1;
    }
    return 0;
}

/**
 * Check for rapid multiple transactions
 */
int checkRapidTransactions(int accNo, time_t currentTime, char* alert) {
    int recentCount = 0;
    
    for (int i = txnCount - 1; i >= 0; i--) {
        if (transactions[i].accNo == accNo) {
            double timeDiff = difftime(currentTime, transactions[i].timestamp);
            if (timeDiff <= RAPID_TXN_WINDOW) {
                recentCount++;
            } else {
                break; // Transactions are sorted by time
            }
        }
    }
    
    if (recentCount >= RAPID_TXN_THRESHOLD) {
        strcpy(alert, "Rapid multiple transactions");
        return 1;
    }
    return 0;
}

/**
 * Check for impossible travel
 */
int checkImpossibleTravel(Account* acc, const char* currentLocation, time_t currentTime, char* alert) {
    if (strlen(acc->lastLocation) == 0 || strcmp(acc->lastLocation, currentLocation) == 0) {
        return 0;
    }
    
    double timeDiff = difftime(currentTime, acc->lastTxnTime);
    if (timeDiff < IMPOSSIBLE_TRAVEL_TIME) {
        strcpy(alert, "Impossible travel detected");
        return 1;
    }
    return 0;
}

/**
 * Main fraud detection logic
 */
void detectFraud(Transaction* txn, char* alerts) {
    alerts[0] = '\0';
    int alertCount = 0;
    
    Account* acc = findAccount(txn->accNo);
    if (!acc) {
        strcpy(alerts, "Account not found");
        return;
    }
    
    char alertBuffer[256];
    
    // Check 1: High-value transaction
    if (checkHighValueTransaction(txn->amount, alertBuffer)) {
        if (alertCount > 0) strcat(alerts, ",");
        strcat(alerts, alertBuffer);
        alertCount++;
    }
    
    // Check 2: Rapid transactions
    if (checkRapidTransactions(txn->accNo, txn->timestamp, alertBuffer)) {
        if (alertCount > 0) strcat(alerts, ",");
        strcat(alerts, alertBuffer);
        alertCount++;
    }
    
    // Check 3: Impossible travel
    if (checkImpossibleTravel(acc, txn->location, txn->timestamp, alertBuffer)) {
        if (alertCount > 0) strcat(alerts, ",");
        strcat(alerts, alertBuffer);
        alertCount++;
    }
    
    // Check 4: Insufficient balance
    if (acc->balance < txn->amount) {
        if (alertCount > 0) strcat(alerts, ",");
        strcat(alerts, "Insufficient balance");
        alertCount++;
    }
    
    // Determine transaction status
    if (alertCount == 0) {
        strcpy(txn->status, "clean");
        strcpy(alerts, "Transaction clean");
    } else {
        strcpy(txn->status, "suspicious");
    }
    
    // Update account information
    strcpy(acc->lastLocation, txn->location);
    acc->lastTxnTime = txn->timestamp;
}

/**
 * Process a transaction
 */
void processTransaction(int accNo, double amount, const char* location) {
    if (txnCount >= MAX_TRANSACTIONS) {
        printf("{\"success\": false, \"error\": \"Transaction limit reached\", \"alerts\": []}");
        return;
    }
    
    // Create transaction
    Transaction txn;
    txn.txnId = txnCount + 1;
    txn.accNo = accNo;
    txn.amount = amount;
    strncpy(txn.location, location, sizeof(txn.location) - 1);
    txn.location[sizeof(txn.location) - 1] = '\0';
    txn.timestamp = time(NULL);
    strcpy(txn.status, "pending");
    
    // Find account and check balance
    Account* acc = findAccount(accNo);
    if (!acc) {
        printf("{\"success\": false, \"error\": \"Account not found\", \"alerts\": []}");
        return;
    }
    
    if (acc->balance < amount) {
        printf("{\"success\": false, \"error\": \"Insufficient balance\", \"alerts\": [\"Insufficient balance\"]}");
        return;
    }
    
    // Perform fraud detection
    char alerts[MAX_ALERT_LENGTH] = "";
    detectFraud(&txn, alerts);
    
    // Process transaction if no critical alerts
    if (strstr(alerts, "Insufficient balance") == NULL) {
        acc->balance -= amount;
        transactions[txnCount++] = txn;
        
        // Format response
        printf("{\"success\": true, \"transactionId\": %d, \"remainingBalance\": %.2f, \"alerts\": [%s], \"status\": \"%s\"}",
               txn.txnId, acc->balance, formatAlertsForJSON(alerts), txn.status);
    } else {
        printf("{\"success\": false, \"error\": \"Transaction blocked\", \"alerts\": [%s]}", 
               formatAlertsForJSON(alerts));
    }
}

/**
 * Format alerts for JSON output
 */
const char* formatAlertsForJSON(const char* alerts) {
    static char formatted[1024];
    formatted[0] = '\0';
    
    if (strlen(alerts) == 0) {
        return "\"No alerts\"";
    }
    
    char* alertCopy = strdup(alerts);
    char* token = strtok(alertCopy, ",");
    int first = 1;
    
    while (token != NULL) {
        // Trim whitespace
        while (*token == ' ') token++;
        
        if (!first) {
            strcat(formatted, ",");
        }
        strcat(formatted, "\"");
        strcat(formatted, token);
        strcat(formatted, "\"");
        
        first = 0;
        token = strtok(NULL, ",");
    }
    
    free(alertCopy);
    return formatted;
}

/**
 * Display account information
 */
void displayAccounts() {
    printf("{\"accounts\": [");
    for (int i = 0; i < accountCount; i++) {
        printf("%s{\"accNo\": %d, \"name\": \"%s\", \"balance\": %.2f, \"lastLocation\": \"%s\"}",
               (i > 0 ? "," : ""), 
               accounts[i].accNo, accounts[i].name, accounts[i].balance, accounts[i].lastLocation);
    }
    printf("]}");
}

/**
 * Display transaction history
 */
void displayTransactionHistory() {
    printf("{\"transactions\": [");
    for (int i = 0; i < txnCount; i++) {
        char timeStr[20];
        strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", 
                localtime(&transactions[i].timestamp));
        
        printf("%s{\"txnId\": %d, \"accNo\": %d, \"amount\": %.2f, \"location\": \"%s\", \"time\": \"%s\", \"status\": \"%s\"}",
               (i > 0 ? "," : ""),
               transactions[i].txnId, transactions[i].accNo, transactions[i].amount,
               transactions[i].location, timeStr, transactions[i].status);
    }
    printf("]}");
}

/**
 * Display usage information
 */
void displayUsage() {
    printf("{\"usage\": {\n");
    printf("  \"process\": \"./fraudbackend <accNo> <amount> <location>\",\n");
    printf("  \"accounts\": \"./fraudbackend --accounts\",\n");
    printf("  \"history\": \"./fraudbackend --history\",\n");
    printf("  \"help\": \"./fraudbackend --help\"\n");
    printf("}}");
}

/**
 * Main function
 */
int main(int argc, char* argv[]) {
    // Initialize the system
    initializeAccounts();
    
    // Handle different command modes
    if (argc == 1) {
        displayUsage();
        return 0;
    }
    
    if (argc == 2) {
        if (strcmp(argv[1], "--accounts") == 0) {
            displayAccounts();
        } else if (strcmp(argv[1], "--history") == 0) {
            displayTransactionHistory();
        } else if (strcmp(argv[1], "--help") == 0) {
            displayUsage();
        } else {
            printf("{\"error\": \"Invalid command. Use --help for usage information.\"}");
            return 1;
        }
        return 0;
    }
    
    if (argc == 4) {
        int accNo = atoi(argv[1]);
        double amount = atof(argv[2]);
        char* location = argv[3];
        
        if (accNo <= 0 || amount <= 0) {
            printf("{\"success\": false, \"error\": \"Invalid account number or amount\"}");
            return 1;
        }
        
        processTransaction(accNo, amount, location);
        return 0;
    }
    
    printf("{\"error\": \"Invalid arguments. Use --help for usage information.\"}");
    return 1;
}
