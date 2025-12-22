/**
 * ================================================================================
 * UNPAID STUDENTS PAGE SERVICE
 * ================================================================================
 * Service layer for making API calls to unpaid students endpoints.
 * Uses the route definitions from unpaidStudentsRoutes.js
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
  CONTACT_STUDENT_ROUTE,
  RECORD_PAYMENT_ROUTE,
  UNPAID_STUDENTS_ROUTE,
  APPLY_PENALTY_ROUTE,
  BLOCK_STUDENT_ROUTE,
  BULK_REMINDER_ROUTE,
  BULK_PENALTY_ROUTE,
  BULK_BLOCK_ROUTE,
} from './unpaidStudentsRoutes';


const unpaidStudentsService = {

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
  // ✅ CONNECTED API FUNCTIONS (Backend implemented)
  // ============================================================================

  /**
   * ✅ Get Unpaid Students (Enhanced)
   * Fetches unpaid students with all required fields for the page
   * @returns {Promise<Object>} { summary, students[] }
   */
  getUnpaidStudents: async () => {
    const response = await api.get(UNPAID_STUDENTS_ROUTE);
    return response.data;
  },

  /**
   * ✅ Apply Penalty
   * Applies late fee penalty to a student
   * @param {number} studentId - Student ID
   * @param {Object} data - { penalty_amount, penalty_type, notes }
   * @returns {Promise<Object>} { msg, student_id, penalty_amount, new_dues_balance }
   */
  applyPenalty: async (studentId, data) => {
    const response = await api.put(APPLY_PENALTY_ROUTE(studentId), data);
    return response.data;
  },

  /**
   * ✅ Block Student Registration
   * Blocks a student's registration due to unpaid dues
   * @param {number} studentId - Student ID
   * @param {Object} data - { block_type, reason, notes }
   * @returns {Promise<Object>} { msg, student_id, blocked_at, block_type }
   */
  blockStudent: async (studentId, data) => {
    const response = await api.put(BLOCK_STUDENT_ROUTE(studentId), data);
    return response.data;
  },

  /**
   * ✅ Send Bulk Reminders
   * Sends reminders to multiple students
   * @param {Object} data - { student_ids[], message_template, contact_method }
   * @returns {Promise<Object>} { msg, sent_count, failed_count, notifications_created }
   */
  sendBulkReminders: async (data) => {
    const response = await api.post(BULK_REMINDER_ROUTE, data);
    return response.data;
  },

  /**
   * ✅ Apply Bulk Penalties
   * Applies penalties to multiple students
   * @param {Object} data - { student_ids[], penalty_amount, penalty_type }
   * @returns {Promise<Object>} { msg, applied_count, total_penalties }
   */
  applyBulkPenalties: async (data) => {
    const response = await api.post(BULK_PENALTY_ROUTE, data);
    return response.data;
  },

  /**
   * ✅ Block Bulk Registrations
   * Blocks registrations for multiple students
   * @param {Object} data - { student_ids[], block_type, reason }
   * @returns {Promise<Object>} { msg, blocked_count }
   */
  blockBulkRegistrations: async (data) => {
    const response = await api.post(BULK_BLOCK_ROUTE, data);
    return response.data;
  },


  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get Unpaid Students Data (Using existing APIs)
   * Combines data from existing endpoints to populate the page
   * @returns {Promise<Object>} Combined unpaid students data
   */
  getUnpaidStudentsData: async () => {
    try {
      const [duesData, unpaidReport] = await Promise.all([
        unpaidStudentsService.getDues(),
        unpaidStudentsService.getUnpaidReport(),
      ]);

      // Calculate overdue count (students with dues > 7 days - approximate)
      // Note: This is a placeholder calculation until we have due dates
      const overdueCount = unpaidReport.students_by_status?.critical?.length || 0;

      return {
        summary: {
          unpaid_count: duesData.total_students_with_dues,
          total_outstanding: duesData.total_outstanding_amount,
          overdue_count: overdueCount,
        },
        students: duesData.students.map(student => ({
          id: student.user_id,
          user_id: student.user_id,
          name: student.username,
          student_id: `STD-${String(student.user_id).padStart(3, '0')}`,
          email: student.email,
          outstanding: student.dues_balance,
          total_enrollments: student.total_enrollments || 0,
          last_payment_date: student.last_payment_date,
          // Placeholder fields until enhanced API is available
          faculty: 'Unknown', // 🔜 Needs faculty field
          due_date: null, // 🔜 Needs due_date calculation
          days_overdue: 0, // 🔜 Needs calculation
          status: student.dues_balance > 5000 ? 'Critical' : student.dues_balance >= 1000 ? 'Moderate' : 'Low',
        })),
      };
    } catch (error) {
      console.error('Error fetching unpaid students data:', error);
      throw error;
    }
  },

};

export default unpaidStudentsService;

