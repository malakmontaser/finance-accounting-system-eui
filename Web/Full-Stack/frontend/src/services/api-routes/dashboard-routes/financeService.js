/**
 * ================================================================================
 * FINANCE DASHBOARD SERVICE
 * ================================================================================
 * Service layer for making API calls to finance endpoints.
 * Uses the route definitions from financeRoutes.js
 * 
 * Status:
 * ✅ CONNECTED - Function connected to existing backend API
 * 🔜 PENDING   - Waiting for backend API to be implemented
 * ================================================================================
 */

import api from '../../api';
import {
  DUES_ROUTE,
  UNPAID_REPORT_ROUTE,
  STATUS_REPORT_ROUTE,
  CONTACT_STUDENT_ROUTE,
  RECORD_PAYMENT_ROUTE,
  SUMMARY_ROUTE,
  RECENT_PAYMENTS_ROUTE,
  PAYMENTS_BY_FACULTY_ROUTE,
  BANK_RECONCILIATION_ROUTE,
} from './financeRoutes';


const financeService = {

  // ============================================================================
  // ✅ EXISTING API FUNCTIONS (Ready to use)
  // ============================================================================

  /**
   * ✅ Get Outstanding Dues
   * Fetches list of students with outstanding dues
   * @param {Object} params - Query parameters { min_amount, max_amount, sort_by }
   * @returns {Promise<Object>} { total_students_with_dues, total_outstanding_amount, students[] }
   */
  getDues: async (params = {}) => {
    const response = await api.get(DUES_ROUTE, { params });
    return response.data;
  },

  /**
   * ✅ Get Unpaid Report
   * Generates detailed report of students with outstanding dues
   * @returns {Promise<Object>} { report_date, total_students, total_outstanding, students_by_status, detailed_report }
   */
  getUnpaidReport: async () => {
    const response = await api.get(UNPAID_REPORT_ROUTE);
    return response.data;
  },

  /**
   * ✅ Get Status Report
   * Generates Pass/Fail status report based on student dues
   * @param {number} threshold - Dues threshold for fail status (default: 0)
   * @returns {Promise<Object>} { report_date, total_students, pass_count, fail_count, pass_students[], fail_students[] }
   */
  getStatusReport: async (threshold = 0) => {
    const response = await api.get(STATUS_REPORT_ROUTE, { params: { threshold } });
    return response.data;
  },

  /**
   * ✅ Contact Student
   * Logs a contact action for a student regarding their dues
   * @param {number} studentId - The student ID to contact
   * @param {Object} data - { contact_method: 'EMAIL'|'PHONE'|'SMS', notes: string }
   * @returns {Promise<Object>} { msg, action_id, student_id, contact_date }
   */
  contactStudent: async (studentId, data) => {
    const response = await api.put(CONTACT_STUDENT_ROUTE(studentId), data);
    return response.data;
  },

  /**
   * ✅ Record External Payment
   * Records a payment made externally (bank transfer, cash, etc.)
   * @param {Object} paymentData - { student_id, amount, payment_method, reference_number, notes }
   * @returns {Promise<Object>} { msg, payment_id, student_id, amount, remaining_dues }
   */
  recordPayment: async (paymentData) => {
    const response = await api.post(RECORD_PAYMENT_ROUTE, paymentData);
    return response.data;
  },


  // ============================================================================
  // ✅ NEW API FUNCTIONS (Just implemented in backend)
  // ============================================================================

  /**
   * ✅ Get Finance Summary
   * Fetches overall financial statistics for dashboard cards
   * @returns {Promise<Object>} { total_collected, pending_payments, total_students, unpaid_students, changes }
   */
  getSummary: async () => {
    const response = await api.get(SUMMARY_ROUTE);
    return response.data;
  },

  /**
   * ✅ Get Recent Payments
   * Fetches list of recent payment transactions
   * @param {Object} params - { limit: number, offset: number }
   * @returns {Promise<Object>} { payments[], total_count }
   */
  getRecentPayments: async (params = { limit: 10, offset: 0 }) => {
    const response = await api.get(RECENT_PAYMENTS_ROUTE, { params });
    return response.data;
  },

  /**
   * ✅ Get Payments by Faculty
   * Fetches payment progress grouped by faculty
   * @returns {Promise<Object>} { faculties[] }
   */
  getPaymentsByFaculty: async () => {
    const response = await api.get(PAYMENTS_BY_FACULTY_ROUTE);
    return response.data;
  },


  // ============================================================================
  // ✅ BANK RECONCILIATION API FUNCTIONS
  // ============================================================================

  /**
   * ✅ Get Bank Reconciliation
   * Fetches bank transactions with reconciliation status
   * @param {Object} params - { limit: number, offset: number, status: 'matched'|'unmatched' }
   * @returns {Promise<Object>} { transactions[], summary{} }
   */
  getBankReconciliation: async (params = { limit: 10 }) => {
    const response = await api.get(BANK_RECONCILIATION_ROUTE, { params });
    return response.data;
  },


  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get partial dashboard data using existing APIs
   * This combines data from existing endpoints to populate some dashboard cards
   * @returns {Promise<Object>} Partial stats that can be fetched from existing APIs
   */
  getPartialDashboardStats: async () => {
    try {
      const duesData = await financeService.getDues();
      return {
        unpaidStudents: duesData.total_students_with_dues,
        pendingPayments: duesData.total_outstanding_amount,
        studentsList: duesData.students,
      };
    } catch (error) {
      console.error('Error fetching partial dashboard stats:', error);
      throw error;
    }
  },

};

export default financeService;

