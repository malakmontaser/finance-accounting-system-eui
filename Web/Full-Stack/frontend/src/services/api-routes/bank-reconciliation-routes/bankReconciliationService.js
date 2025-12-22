/**
 * ================================================================================
 * BANK RECONCILIATION SERVICE
 * ================================================================================
 * Service layer for making API calls to bank reconciliation endpoints.
 * Uses the route definitions from bankReconciliationRoutes.js
 * 
 * Status:
 * ✅ CONNECTED - Function connected to existing backend API
 * 🔜 PENDING   - Waiting for backend API to be implemented
 * ================================================================================
 */

import api from '../../api';
import {
  GET_BANK_RECONCILIATION_ROUTE,
  SYNC_BANK_DATA_ROUTE,
  GET_TRANSACTION_DETAILS_ROUTE,
  MATCH_TRANSACTION_ROUTE,
  GET_MATCHING_SUGGESTIONS_ROUTE,
} from './bankReconciliationRoutes';


const bankReconciliationService = {

  // ============================================================================
  // ✅ Get Bank Reconciliation
  // ============================================================================
  /**
   * Fetches bank transactions with reconciliation status and summary
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by 'matched' or 'unmatched'
   * @param {number} params.limit - Number of records (default: 50)
   * @param {number} params.offset - Pagination offset (default: 0)
   * @returns {Promise<Object>} { summary{}, transactions[] }
   */
  getBankReconciliation: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${GET_BANK_RECONCILIATION_ROUTE}?${queryString}` : GET_BANK_RECONCILIATION_ROUTE;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank reconciliation:', error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Sync Bank Data
  // ============================================================================
  /**
   * Syncs/imports bank transactions from file or manual entries
   * @param {Object} syncData - Sync data
   * @param {string} syncData.source - 'file' or 'manual'
   * @param {Array} syncData.transactions - Array of transaction objects (for manual)
   * @returns {Promise<Object>} { msg, imported_count, auto_matched, unmatched, duplicates_skipped }
   */
  syncBankData: async (syncData) => {
    try {
      const response = await api.post(SYNC_BANK_DATA_ROUTE, syncData);
      return response.data;
    } catch (error) {
      console.error('Error syncing bank data:', error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Get Transaction Details
  // ============================================================================
  /**
   * Fetches detailed information for a specific bank transaction
   * @param {number} transactionId - Transaction ID
   * @returns {Promise<Object>} { transaction{}, matched_payment{}, student{} }
   */
  getTransactionDetails: async (transactionId) => {
    try {
      const response = await api.get(GET_TRANSACTION_DETAILS_ROUTE(transactionId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction details for ID ${transactionId}:`, error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Match Transaction
  // ============================================================================
  /**
   * Manually matches a bank transaction to a student/payment
   * @param {number} transactionId - Transaction ID
   * @param {Object} matchData - Match data
   * @param {number} matchData.payment_id - Existing payment ID (Option 1)
   * @param {boolean} matchData.create_payment - Create new payment (Option 2)
   * @param {number} matchData.student_id - Student ID (if creating payment)
   * @param {string} matchData.payment_method - Payment method (if creating payment)
   * @param {string} matchData.notes - Notes
   * @returns {Promise<Object>} { msg, transaction_id, status, payment_id, student_id, student_name, remaining_dues }
   */
  matchTransaction: async (transactionId, matchData) => {
    try {
      const response = await api.put(MATCH_TRANSACTION_ROUTE(transactionId), matchData);
      return response.data;
    } catch (error) {
      console.error(`Error matching transaction ${transactionId}:`, error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Get Matching Suggestions
  // ============================================================================
  /**
   * Fetches matching suggestions for an unmatched transaction
   * @param {number} transactionId - Transaction ID
   * @returns {Promise<Object>} { transaction{}, suggestions[], unmatched_students[] }
   */
  getMatchingSuggestions: async (transactionId) => {
    try {
      const response = await api.get(GET_MATCHING_SUGGESTIONS_ROUTE(transactionId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching matching suggestions for transaction ${transactionId}:`, error);
      throw error;
    }
  },

};

export default bankReconciliationService;

