/**
 * ================================================================================
 * FINANCE DASHBOARD API ROUTES
 * ================================================================================
 * This file contains all API route definitions for the Finance Dashboard.
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

// GET: Outstanding dues - Lists all students with outstanding dues
// Used for: Unpaid Students count, Pending Payments amount
// Returns: { total_students_with_dues, total_outstanding_amount, students[] }
export const DUES_ROUTE = `${FINANCE_BASE}/dues`;

// GET: Unpaid report - Detailed report of students with outstanding dues
// Used for: Generate Report button
// Returns: { report_date, total_students, total_outstanding, students_by_status, detailed_report }
export const UNPAID_REPORT_ROUTE = `${FINANCE_BASE}/unpaid-report`;

// GET: Status report - Pass/Fail status based on student dues
// Used for: Generate Report button (alternative report)
// Returns: { report_date, total_students, pass_count, fail_count, pass_students[], fail_students[] }
export const STATUS_REPORT_ROUTE = `${FINANCE_BASE}/reports/status`;

// PUT: Contact student - Logs contact action for a student
// Used for: Contact student action in Unpaid Students page
// Body: { contact_method, notes }
// Returns: { msg, action_id, student_id, contact_date }
export const CONTACT_STUDENT_ROUTE = (studentId) => `${FINANCE_BASE}/action/contact/${studentId}`;

// POST: Record payment - Records external/manual payment
// Used for: Recording bank transfers or manual payments
// Body: { student_id, amount, payment_method, reference_number, notes }
// Returns: { msg, payment_id, student_id, amount, remaining_dues }
export const RECORD_PAYMENT_ROUTE = `${FINANCE_BASE}/record-payment`;

// ✅ GET: Finance summary - Overall financial statistics
// Used for: Statistics Cards (Total Collected, Total Students, etc.)
// Returns: { total_collected, pending_payments, total_students, unpaid_students, changes }
export const SUMMARY_ROUTE = `${FINANCE_BASE}/summary`;

// ✅ GET: Recent payments - List of recent payment transactions
// Used for: Recent Payments Table
// Query: ?limit=10&offset=0
// Returns: { payments[], total_count }
export const RECENT_PAYMENTS_ROUTE = `${FINANCE_BASE}/payments/recent`;

// ✅ GET: Payments by faculty - Payment progress grouped by faculty
// Used for: Payments by Faculty progress bars
// Returns: { faculties[] }
export const PAYMENTS_BY_FACULTY_ROUTE = `${FINANCE_BASE}/payments/by-faculty`;


/**
 * ================================================================================
 * PENDING API ROUTES (Need to be created in backend)
 * ================================================================================
 */

// 🔜 GET: Bank reconciliation - Bank transactions with match status
// Used for: Bank Reconciliation card
// Query: ?limit=10&status=Matched|Pending|Unmatched
// Returns: { transactions[], summary }
// Note: Endpoint exists but requires BankTransaction model
export const BANK_RECONCILIATION_ROUTE = `${FINANCE_BASE}/bank-reconciliation`;


/**
 * ================================================================================
 * ROUTE GROUPS (For easy importing)
 * ================================================================================
 */

// All existing routes that are ready to use
export const EXISTING_ROUTES = {
  dues: DUES_ROUTE,
  unpaidReport: UNPAID_REPORT_ROUTE,
  statusReport: STATUS_REPORT_ROUTE,
  contactStudent: CONTACT_STUDENT_ROUTE,
  recordPayment: RECORD_PAYMENT_ROUTE,
  summary: SUMMARY_ROUTE,
  recentPayments: RECENT_PAYMENTS_ROUTE,
  paymentsByFaculty: PAYMENTS_BY_FACULTY_ROUTE,
};

// All pending routes that need backend implementation
export const PENDING_ROUTES = {
  bankReconciliation: BANK_RECONCILIATION_ROUTE,
};

// All routes combined
export const ALL_ROUTES = {
  ...EXISTING_ROUTES,
  ...PENDING_ROUTES,
};

export default ALL_ROUTES;

