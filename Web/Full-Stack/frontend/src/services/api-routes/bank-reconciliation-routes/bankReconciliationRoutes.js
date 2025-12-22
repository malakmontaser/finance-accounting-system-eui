/**
 * ================================================================================
 * BANK RECONCILIATION API ROUTES
 * ================================================================================
 * This file contains all API route definitions for the Bank Reconciliation page.
 * Routes are organized by feature/component.
 * 
 * Status:
 * ✅ EXISTING - API endpoint already exists in backend
 * 🔜 PENDING  - API endpoint needs to be created in backend
 * ================================================================================
 */

// Base finance API path
const FINANCE_BASE = '/finance';

/**
 * ================================================================================
 * EXISTING API ROUTES (Ready to use)
 * ================================================================================
 */

// ✅ GET: Get bank transactions with reconciliation status and summary
// Used for: Statistics Cards, Transactions Table
// Query Params: status, limit, offset
// Returns: { summary{}, transactions[] }
export const GET_BANK_RECONCILIATION_ROUTE = `${FINANCE_BASE}/bank-reconciliation`;

// ✅ POST: Sync/import bank transactions from file or external source
// Used for: Sync Bank Data Button
// Body: { source: 'file'|'manual', transactions[] }
// Returns: { msg, imported_count, auto_matched, unmatched, duplicates_skipped }
export const SYNC_BANK_DATA_ROUTE = `${FINANCE_BASE}/bank-reconciliation/sync`;

// ✅ GET: Get detailed information for a specific bank transaction
// Used for: View Button (for matched transactions)
// Returns: { transaction{}, matched_payment{}, student{} }
export const GET_TRANSACTION_DETAILS_ROUTE = (transactionId) => `${FINANCE_BASE}/bank-reconciliation/${transactionId}`;

// ✅ PUT: Manually match a bank transaction to a student/payment
// Used for: Match Manually Button (for unmatched transactions)
// Body: { payment_id } OR { create_payment: true, student_id, payment_method, notes }
// Returns: { msg, transaction_id, status, payment_id, student_id, student_name, remaining_dues }
export const MATCH_TRANSACTION_ROUTE = (transactionId) => `${FINANCE_BASE}/bank-reconciliation/${transactionId}/match`;

// ✅ GET: Get matching suggestions for an unmatched transaction
// Used for: Match Manually Modal (suggestions list)
// Returns: { transaction{}, suggestions[], unmatched_students[] }
export const GET_MATCHING_SUGGESTIONS_ROUTE = (transactionId) => `${FINANCE_BASE}/bank-reconciliation/suggestions/${transactionId}`;

/**
 * ================================================================================
 * ROUTE GROUPS (For organization)
 * ================================================================================
 */

// All bank reconciliation routes
export const BANK_RECONCILIATION_ROUTES = {
  GET_BANK_RECONCILIATION: GET_BANK_RECONCILIATION_ROUTE,
  SYNC_BANK_DATA: SYNC_BANK_DATA_ROUTE,
  GET_TRANSACTION_DETAILS: GET_TRANSACTION_DETAILS_ROUTE,
  MATCH_TRANSACTION: MATCH_TRANSACTION_ROUTE,
  GET_MATCHING_SUGGESTIONS: GET_MATCHING_SUGGESTIONS_ROUTE,
};

