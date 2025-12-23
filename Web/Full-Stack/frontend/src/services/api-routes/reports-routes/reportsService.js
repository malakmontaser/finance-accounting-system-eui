/**
 * ================================================================================
 * REPORTS PAGE SERVICE
 * ================================================================================
 * Service layer for making API calls to reports endpoints.
 * Uses the route definitions from reportsRoutes.js
 * 
 * Status:
 * ✅ CONNECTED - Function connected to existing backend API
 * 🔜 PENDING   - Waiting for backend API to be implemented
 * ================================================================================
 */

import api from '../../api';
import {
  UNPAID_REPORT_ROUTE,
  STATUS_REPORT_ROUTE,
  DUES_ROUTE,
  REPORT_TYPES_ROUTE,
  GENERATE_REPORT_ROUTE,
  DOWNLOAD_REPORT_ROUTE,
  REPORT_HISTORY_ROUTE,
  FACULTY_SUMMARY_ROUTE,
  UNIVERSITY_SUMMARY_ROUTE,
  DELETE_REPORT_ROUTE,
} from './reportsRoutes';


const reportsService = {

  // ============================================================================
  // ✅ EXISTING API FUNCTIONS (Ready to use)
  // ============================================================================

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
   * ✅ Get Outstanding Dues
   * Fetches list of students with outstanding dues
   * @returns {Promise<Object>} { total_students_with_dues, total_outstanding_amount, students[] }
   */
  getDues: async () => {
    const response = await api.get(DUES_ROUTE);
    return response.data;
  },


  // ============================================================================
  // ✅ NEW API FUNCTIONS (Just implemented in backend)
  // ============================================================================

  /**
   * ✅ Get Report Types
   * Fetches available report types and configuration options
   * @returns {Promise<Object>} { report_types[], faculties[] }
   */
  getReportTypes: async () => {
    const response = await api.get(REPORT_TYPES_ROUTE);
    return response.data;
  },

  /**
   * ✅ Generate Report
   * Creates a custom report based on parameters
   * @param {Object} params - Report parameters
   * @param {string} params.report_type - 'student_level', 'faculty_level', 'university_level', 'finance_overview'
   * @param {string} params.faculty - Faculty name or 'All Faculties'
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   * @param {string} params.format - 'json', 'pdf', 'excel'
   * @param {boolean} params.save_to_history - Whether to save to report history
   * @returns {Promise<Object>} Report data or download URL
   */
  generateReport: async (params) => {
    const response = await api.post(GENERATE_REPORT_ROUTE, params);
    return response.data;
  },

  /**
   * ✅ Download Report
   * Downloads a generated report in specified format
   * @param {string} reportId - Report ID (e.g., 'RPT-2025-001')
   * @param {string} format - 'pdf', 'excel', or 'json' (default: 'json')
   * @returns {Promise<Blob>} Binary file blob
   */
  downloadReport: async (reportId, format = 'json') => {
    const response = await api.get(DOWNLOAD_REPORT_ROUTE(reportId), {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * ✅ Download Report and Trigger Browser Download
   * Helper function to download and save file
   * @param {string} reportId - Report ID
   * @param {string} format - 'pdf', 'excel', or 'json' (default: 'json')
   * @param {string} filename - Optional filename
   */
  downloadAndSaveReport: async (reportId, format = 'json', filename = null) => {
    try {
      const blob = await reportsService.downloadReport(reportId, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determine file extension based on format
      let extension = 'json';
      if (format === 'pdf') extension = 'pdf';
      else if (format === 'excel') extension = 'xlsx';
      
      link.download = filename || `report-${reportId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  },

  /**
   * ✅ Get Report History
   * Fetches list of recently generated reports
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of records (default: 10)
   * @param {number} params.offset - Pagination offset (default: 0)
   * @param {string} params.report_type - Filter by type (optional)
   * @returns {Promise<Object>} { reports[], total_count, has_more }
   */
  getReportHistory: async (params = { limit: 10, offset: 0 }) => {
    const response = await api.get(REPORT_HISTORY_ROUTE, { params });
    return response.data;
  },

  /**
   * ✅ Get Faculty Summary
   * Fetches faculty-level aggregated data
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (optional)
   * @param {string} params.end_date - End date (optional)
   * @returns {Promise<Object>} { faculties[], totals }
   */
  getFacultySummary: async (params = {}) => {
    const response = await api.get(FACULTY_SUMMARY_ROUTE, { params });
    return response.data;
  },

  /**
   * ✅ Get University Summary
   * Fetches university-wide overview data
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (optional)
   * @param {string} params.end_date - End date (optional)
   * @returns {Promise<Object>} { overview, by_status, monthly_trends, by_payment_method, by_faculty }
   */
  getUniversitySummary: async (params = {}) => {
    const response = await api.get(UNIVERSITY_SUMMARY_ROUTE, { params });
    return response.data;
  },

  /**
   * ✅ Delete Report
   * Removes a saved report from history
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} { msg, report_id }
   */
  deleteReport: async (reportId) => {
    const response = await api.delete(DELETE_REPORT_ROUTE(reportId));
    return response.data;
  },


  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get Student Level Report Data
   * Combines existing APIs to create student level report
   * @returns {Promise<Object>} Combined student report data
   */
  getStudentLevelReportData: async () => {
    try {
      const [unpaidReport, statusReport, duesData] = await Promise.all([
        reportsService.getUnpaidReport(),
        reportsService.getStatusReport(),
        reportsService.getDues(),
      ]);

      return {
        unpaid: unpaidReport,
        status: statusReport,
        dues: duesData,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching student level report:', error);
      throw error;
    }
  },

};

export default reportsService;

