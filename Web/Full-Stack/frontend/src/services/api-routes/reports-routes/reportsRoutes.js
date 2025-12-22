/**
 * ================================================================================
 * REPORTS PAGE API ROUTES
 * ================================================================================
 * This file contains all API route definitions for the Reports Page.
 * Routes are organized by feature/component.
 * 
 * Status:
 * ✅ EXISTING - API endpoint already exists in backend
 * 🔜 PENDING  - API endpoint needs to be created in backend
 * ================================================================================
 */

// Base finance API path
const FINANCE_BASE = '/finance';
const REPORTS_BASE = `${FINANCE_BASE}/reports`;

/**
 * ================================================================================
 * EXISTING API ROUTES (Ready to use)
 * ================================================================================
 */

// ✅ GET: Unpaid report - Detailed report of students with outstanding dues
// Used for: Student Level Report (unpaid students section)
// Returns: { report_date, total_students, total_outstanding, students_by_status, detailed_report }
export const UNPAID_REPORT_ROUTE = `${FINANCE_BASE}/unpaid-report`;

// ✅ GET: Status report - Pass/Fail status based on student dues
// Used for: Student Level Report (pass/fail status)
// Returns: { report_date, total_students, pass_count, fail_count, pass_students[], fail_students[] }
export const STATUS_REPORT_ROUTE = `${REPORTS_BASE}/status`;

// ✅ GET: Outstanding dues - List of students with dues
// Used for: Student Level Report (dues summary)
// Returns: { total_students_with_dues, total_outstanding_amount, students[] }
export const DUES_ROUTE = `${FINANCE_BASE}/dues`;


/**
 * ================================================================================
 * ✅ NEW API ROUTES (Just implemented in backend)
 * ================================================================================
 */

// ✅ GET: Report types - Available report types and configuration
// Used for: Predefined Reports Grid, Report Type Dropdown
// Returns: { report_types[], faculties[] }
export const REPORT_TYPES_ROUTE = `${REPORTS_BASE}/types`;

// ✅ POST: Generate report - Create custom report based on parameters
// Used for: Generate Report Button, Download PDF/Excel Buttons
// Body: { report_type, faculty, start_date, end_date, format, save_to_history }
// Returns: { report_id, report_name, summary, data } or { report_id, download_url }
export const GENERATE_REPORT_ROUTE = `${REPORTS_BASE}/generate`;

// ✅ GET: Download report - Download generated report in PDF/Excel format
// Used for: Download PDF Button, Download Excel Button
// Query: ?format=pdf|excel
// Returns: Binary file download
export const DOWNLOAD_REPORT_ROUTE = (reportId) => `${REPORTS_BASE}/download/${reportId}`;

// ✅ GET: Report history - List of recently generated reports
// Used for: Recent Reports List
// Query: ?limit=10&offset=0&report_type=student_level
// Returns: { reports[], total_count, has_more }
export const REPORT_HISTORY_ROUTE = `${REPORTS_BASE}/history`;

// ✅ GET: Faculty summary - Aggregated data by faculty
// Used for: Faculty Level Report Card
// Query: ?start_date=2025-01-01&end_date=2025-12-31
// Returns: { faculties[], totals }
export const FACULTY_SUMMARY_ROUTE = `${REPORTS_BASE}/faculty-summary`;

// ✅ GET: University summary - University-wide overview data
// Used for: University Level Report Card
// Query: ?start_date=2025-01-01&end_date=2025-12-31
// Returns: { overview, by_status, monthly_trends, by_payment_method, by_faculty }
export const UNIVERSITY_SUMMARY_ROUTE = `${REPORTS_BASE}/university-summary`;

// ✅ DELETE: Delete report - Remove saved report from history
// Used for: (Future feature - delete button)
// Returns: { msg, report_id }
export const DELETE_REPORT_ROUTE = (reportId) => `${REPORTS_BASE}/${reportId}`;


/**
 * ================================================================================
 * ROUTE GROUPS (For easy importing)
 * ================================================================================
 */

// All existing routes that are ready to use
export const EXISTING_ROUTES = {
  unpaidReport: UNPAID_REPORT_ROUTE,
  statusReport: STATUS_REPORT_ROUTE,
  dues: DUES_ROUTE,
};

// All new routes that are now implemented
export const NEW_ROUTES = {
  reportTypes: REPORT_TYPES_ROUTE,
  generateReport: GENERATE_REPORT_ROUTE,
  downloadReport: DOWNLOAD_REPORT_ROUTE,
  reportHistory: REPORT_HISTORY_ROUTE,
  facultySummary: FACULTY_SUMMARY_ROUTE,
  universitySummary: UNIVERSITY_SUMMARY_ROUTE,
  deleteReport: DELETE_REPORT_ROUTE,
};

// All routes combined
export const ALL_ROUTES = {
  ...EXISTING_ROUTES,
  ...NEW_ROUTES,
};

export default ALL_ROUTES;

