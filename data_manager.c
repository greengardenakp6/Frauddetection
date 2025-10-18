/**
 * Data Manager for Fraud Detection System
 * Handles JSON file operations and data persistence
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <json-c/json.h>

#define MAX_ACCOUNTS 100
#define MAX_TRANSACTIONS 1000
#define DATA_FILE_ACCOUNTS "data/accounts.json"
#define DATA_FILE_TRANSACTIONS "data/transactions.json"
#define DATA_FILE_FRAUD_RULES "data/fraud_patterns.json"

typedef struct {
    int accNo;
    char name[50];
    double balance;
    char lastLocation[30];
    time_t lastTxnTime;
    int isActive;
    char accountType[20];
    double dailyLimit;
    double monthlyLimit;
    double dailySpent;
    double monthlySpent;
} Account;

typedef struct {
    int txnId;
    int accNo;
    double amount;
    char location[30];
    time_t timestamp;
    char status[20];
    char alerts[256];
    char type[20];
} Transaction;

// Global data
Account accounts[MAX_ACCOUNTS];
Transaction transactions[MAX_TRANSACTIONS];
int accountCount = 0;
int txnCount = 0;

// Fraud detection rules
double highValueThreshold = 50000.0;
int rapidTransactionCount = 3;
int rapidTransactionWindow = 60;
int impossibleTravelTime = 600;

/**
 * Load accounts from JSON file
 */
int loadAccountsFromFile() {
    FILE *file = fopen(DATA_FILE_ACCOUNTS, "r");
    if (!file) {
        printf("Warning: Could not open accounts file. Using default accounts.\n");
        return 0;
    }

    fseek(file, 0, SEEK_END);
    long fileSize = ftell(file);
    fseek(file, 0, SEEK_SET);

    char *jsonData = malloc(fileSize + 1);
    fread(jsonData, 1, fileSize, file);
    jsonData[fileSize] = '\0';
    fclose(file);

    struct json_object *parsedJson;
    struct json_object *accountsArray;
    
    parsedJson = json_tokener_parse(jsonData);
    if (json_object_object_get_ex(parsedJson, "accounts", &accountsArray)) {
        int arrayLen = json_object_array_length(accountsArray);
        
        for (int i = 0; i < arrayLen && i < MAX_ACCOUNTS; i++) {
            struct json_object *accountObj = json_object_array_get_idx(accountsArray, i);
            
            accounts[accountCount].accNo = json_object_get_int(json_object_object_get(accountObj, "accNo"));
            strcpy(accounts[accountCount].name, json_object_get_string(json_object_object_get(accountObj, "name")));
            accounts[accountCount].balance = json_object_get_double(json_object_object_get(accountObj, "balance"));
            strcpy(accounts[accountCount].lastLocation, json_object_get_string(json_object_object_get(accountObj, "lastLocation")));
            
            // Parse timestamp
            const char *timeStr = json_object_get_string(json_object_object_get(accountObj, "lastTxnTime"));
            struct tm tm;
            strptime(timeStr, "%Y-%m-%dT%H:%M:%SZ", &tm);
            accounts[accountCount].lastTxnTime = mktime(&tm);
            
            accounts[accountCount].isActive = json_object_get_boolean(json_object_object_get(accountObj, "isActive"));
            strcpy(accounts[accountCount].accountType, json_object_get_string(json_object_object_get(accountObj, "accountType")));
            accounts[accountCount].dailyLimit = json_object_get_double(json_object_object_get(accountObj, "dailyLimit"));
            accounts[accountCount].monthlyLimit = json_object_get_double(json_object_object_get(accountObj, "monthlyLimit"));
            accounts[accountCount].dailySpent = 0.0;
            accounts[accountCount].monthlySpent = 0.0;
            
            accountCount++;
        }
    }

    free(jsonData);
    json_object_put(parsedJson);
    
    printf("Loaded %d accounts from file\n", accountCount);
    return 1;
}

/**
 * Load transactions from JSON file
 */
int loadTransactionsFromFile() {
    FILE *file = fopen(DATA_FILE_TRANSACTIONS, "r");
    if (!file) {
        printf("Warning: Could not open transactions file.\n");
        return 0;
    }

    fseek(file, 0, SEEK_END);
    long fileSize = ftell(file);
    fseek(file, 0, SEEK_SET);

    char *jsonData = malloc(fileSize + 1);
    fread(jsonData, 1, fileSize, file);
    jsonData[fileSize] = '\0';
    fclose(file);

    struct json_object *parsedJson;
    struct json_object *txnsArray;
    
    parsedJson = json_tokener_parse(jsonData);
    if (json_object_object_get_ex(parsedJson, "transactions", &txnsArray)) {
        int arrayLen = json_object_array_length(txnsArray);
        
        for (int i = 0; i < arrayLen && i < MAX_TRANSACTIONS; i++) {
            struct json_object *txnObj = json_object_array_get_idx(txnsArray, i);
            
            transactions[txnCount].txnId = json_object_get_int(json_object_object_get(txnObj, "txnId"));
            transactions[txnCount].accNo = json_object_get_int(json_object_object_get(txnObj, "accNo"));
            transactions[txnCount].amount = json_object_get_double(json_object_object_get(txnObj, "amount"));
            strcpy(transactions[txnCount].location, json_object_get_string(json_object_object_get(txnObj, "location")));
            strcpy(transactions[txnCount].status, json_object_get_string(json_object_object_get(txnObj, "status")));
            strcpy(transactions[txnCount].type, json_object_get_string(json_object_object_get(txnObj, "type")));
            
            // Parse alerts array
            struct json_object *alertsArray;
            if (json_object_object_get_ex(txnObj, "alerts", &alertsArray)) {
                strcpy(transactions[txnCount].alerts, "");
                int alertCount = json_object_array_length(alertsArray);
                for (int j = 0; j < alertCount; j++) {
                    if (j > 0) strcat(transactions[txnCount].alerts, ",");
                    strcat(transactions[txnCount].alerts, 
                          json_object_get_string(json_object_array_get_idx(alertsArray, j)));
                }
            }
            
            // Parse timestamp
            const char *timeStr = json_object_get_string(json_object_object_get(txnObj, "timestamp"));
            struct tm tm;
            strptime(timeStr, "%Y-%m-%dT%H:%M:%SZ", &tm);
            transactions[txnCount].timestamp = mktime(&tm);
            
            txnCount++;
        }
    }

    free(jsonData);
    json_object_put(parsedJson);
    
    printf("Loaded %d transactions from file\n", txnCount);
    return 1;
}

/**
 * Save transactions to JSON file
 */
void saveTransactionsToFile() {
    FILE *file = fopen(DATA_FILE_TRANSACTIONS, "w");
    if (!file) {
        printf("Error: Could not save transactions to file\n");
        return;
    }

    fprintf(file, "{\n  \"transactions\": [\n");
    
    for (int i = 0; i < txnCount; i++) {
        char timeStr[30];
        strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%SZ", 
                gmtime(&transactions[i].timestamp));
        
        fprintf(file, "    {\n");
        fprintf(file, "      \"txnId\": %d,\n", transactions[i].txnId);
        fprintf(file, "      \"accNo\": %d,\n", transactions[i].accNo);
        fprintf(file, "      \"amount\": %.2f,\n", transactions[i].amount);
        fprintf(file, "      \"location\": \"%s\",\n", transactions[i].location);
        fprintf(file, "      \"timestamp\": \"%s\",\n", timeStr);
        fprintf(file, "      \"status\": \"%s\",\n", transactions[i].status);
        fprintf(file, "      \"type\": \"%s\",\n", transactions[i].type);
        
        // Format alerts as array
        fprintf(file, "      \"alerts\": [");
        if (strlen(transactions[i].alerts) > 0) {
            char *alertCopy = strdup(transactions[i].alerts);
            char *token = strtok(alertCopy, ",");
            int first = 1;
            
            while (token != NULL) {
                fprintf(file, "%s\"%s\"", (first ? "" : ","), token);
                first = 0;
                token = strtok(NULL, ",");
            }
            free(alertCopy);
        }
        fprintf(file, "]\n");
        
        fprintf(file, "    }%s\n", (i < txnCount - 1 ? "," : ""));
    }
    
    fprintf(file, "  ]\n}");
    fclose(file);
    
    printf("Saved %d transactions to file\n", txnCount);
}

/**
 * Load fraud detection rules
 */
void loadFraudRules() {
    FILE *file = fopen(DATA_FILE_FRAUD_RULES, "r");
    if (!file) {
        printf("Warning: Using default fraud rules\n");
        return;
    }

    fseek(file, 0, SEEK_END);
    long fileSize = ftell(file);
    fseek(file, 0, SEEK_SET);

    char *jsonData = malloc(fileSize + 1);
    fread(jsonData, 1, fileSize, file);
    jsonData[fileSize] = '\0';
    fclose(file);

    struct json_object *parsedJson;
    struct json_object *fraudRules;
    
    parsedJson = json_tokener_parse(jsonData);
    if (json_object_object_get_ex(parsedJson, "fraudRules", &fraudRules)) {
        highValueThreshold = json_object_get_double(json_object_object_get(fraudRules, "highValueThreshold"));
        rapidTransactionCount = json_object_get_int(json_object_object_get(fraudRules, "rapidTransactionCount"));
        rapidTransactionWindow = json_object_get_int(json_object_object_get(fraudRules, "rapidTransactionWindow"));
        impossibleTravelTime = json_object_get_int(json_object_object_get(fraudRules, "impossibleTravelTime"));
    }

    free(jsonData);
    json_object_put(parsedJson);
    
    printf("Fraud rules loaded: HighValue=%.2f, RapidCount=%d\n", 
           highValueThreshold, rapidTransactionCount);
}

/**
 * Initialize data system
 */
void initializeDataSystem() {
    printf("Initializing Data System...\n");
    loadFraudRules();
    loadAccountsFromFile();
    loadTransactionsFromFile();
    printf("Data system ready. Accounts: %d, Transactions: %d\n", accountCount, txnCount);
}
