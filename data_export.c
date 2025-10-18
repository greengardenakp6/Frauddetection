/**
 * Data Export Functions for Web Integration
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Export accounts to JSON
void exportAccountsToJSON() {
    printf("{\"accounts\": [");
    for (int i = 0; i < accountCount; i++) {
        char timeStr[30];
        strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%SZ", 
                gmtime(&accounts[i].lastTxnTime));
        
        printf("%s{\n", (i > 0 ? "," : ""));
        printf("  \"accNo\": %d,\n", accounts[i].accNo);
        printf("  \"name\": \"%s\",\n", accounts[i].name);
        printf("  \"balance\": %.2f,\n", accounts[i].balance);
        printf("  \"lastLocation\": \"%s\",\n", accounts[i].lastLocation);
        printf("  \"lastTxnTime\": \"%s\",\n", timeStr);
        printf("  \"isActive\": %s,\n", accounts[i].isActive ? "true" : "false");
        printf("  \"accountType\": \"%s\",\n", accounts[i].accountType);
        printf("  \"dailyLimit\": %.2f,\n", accounts[i].dailyLimit);
        printf("  \"monthlyLimit\": %.2f\n", accounts[i].monthlyLimit);
        printf("}");
    }
    printf("]}");
}

// Export transactions to JSON
void exportTransactionsToJSON(int limit) {
    if (limit <= 0 || limit > txnCount) limit = txnCount;
    
    printf("{\"transactions\": [");
    for (int i = 0; i < limit; i++) {
        int index = txnCount - 1 - i; // Most recent first
        char timeStr[30];
        strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%SZ", 
                gmtime(&transactions[index].timestamp));
        
        printf("%s{\n", (i > 0 ? "," : ""));
        printf("  \"txnId\": %d,\n", transactions[index].txnId);
        printf("  \"accNo\": %d,\n", transactions[index].accNo);
        printf("  \"amount\": %.2f,\n", transactions[index].amount);
        printf("  \"location\": \"%s\",\n", transactions[index].location);
        printf("  \"timestamp\": \"%s\",\n", timeStr);
        printf("  \"status\": \"%s\",\n", transactions[index].status);
        printf("  \"type\": \"%s\",\n", transactions[index].type);
        printf("  \"alerts\": \"%s\"\n", transactions[index].alerts);
        printf("}");
    }
    printf("]}");
}

// Export statistics
void exportStatistics() {
    int suspiciousCount = 0;
    double totalAmount = 0.0;
    double suspiciousAmount = 0.0;
    
    for (int i = 0; i < txnCount; i++) {
        totalAmount += transactions[i].amount;
        if (strcmp(transactions[i].status, "suspicious") == 0) {
            suspiciousCount++;
            suspiciousAmount += transactions[i].amount;
        }
    }
    
    printf("{\n");
    printf("  \"statistics\": {\n");
    printf("    \"totalTransactions\": %d,\n", txnCount);
    printf("    \"suspiciousTransactions\": %d,\n", suspiciousCount);
    printf("    \"totalAmount\": %.2f,\n", totalAmount);
    printf("    \"suspiciousAmount\": %.2f,\n", suspiciousAmount);
    printf("    \"fraudRate\": %.2f,\n", (txnCount > 0 ? (suspiciousCount * 100.0 / txnCount) : 0));
    printf("    \"averageTransaction\": %.2f\n", (txnCount > 0 ? totalAmount / txnCount : 0));
    printf("  },\n");
    printf("  \"accounts\": {\n");
    printf("    \"totalAccounts\": %d,\n", accountCount);
    printf("    \"activeAccounts\": %d\n", accountCount); // Simplified
    printf("  }\n");
    printf("}");
}
