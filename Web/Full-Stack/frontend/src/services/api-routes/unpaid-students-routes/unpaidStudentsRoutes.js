/**
 * ================================================================================
 * UNPAID STUDENTS PAGE API ROUTES
 * ================================================================================
 * This file contains all API route definitions for the Unpaid Students Page.
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

// ✅ GET: Outstanding dues - Lists all students with outstanding dues
// Used for: Statistics Cards, Students Table
// Returns: { total_students_with_dues, total_outstanding_amount, students[] }
export const DUES_ROUTE = `${FINANCE_BASE}/dues`;

// ✅ GET: Unpaid report - Detailed report of students with outstanding dues
// Used for: Enhanced student data with categorization
// Returns: { report_date, total_students, total_outstanding, students_by_status, detailed_report }
export const UNPAID_REPORT_ROUTE = `${FINANCE_BASE}/unpaid-report`;

// ✅ PUT: Contact student - Logs contact action for a student
// Used for: Send Reminder button (individual)
// Body: { contact_method, notes }
// Returns: { msg, action_id, student_id, contact_date }
export const CONTACT_STUDENT_ROUTE = (studentId) => `${FINANCE_BASE}/action/contact/${studentId}`;

// ✅ POST: Record payment - Records external/manual payment
// Used for: Recording payments after contact
// Body: { student_id, amount, payment_method, reference_number, notes }
// Returns: { msg, payment_id, student_id, amount, remaining_dues }
export const RECORD_PAYMENT_ROUTE = `${FINANCE_BASE}/record-payment`;


/**
 * ================================================================================
 * ✅ CONNECTED API ROUTES (Backend implemented)
 * ================================================================================
 */

// ✅ GET: Enhanced unpaid students - All required fields for the page
// Used for: Students Table with full details (due dates, days overdue, status)
// Returns: { summary, students[] }
export const UNPAID_STUDENTS_ROUTE = `${FINANCE_BASE}/unpaid-students`;

// ✅ PUT: Apply penalty - Apply late fee penalty to a student
// Used for: Apply Penalty button (individual)
// Body: { penalty_amount, penalty_type, notes }
// Returns: { msg, student_id, penalty_amount, new_dues_balance }
export const APPLY_PENALTY_ROUTE = (studentId) => `${FINANCE_BASE}/action/penalty/${studentId}`;

// ✅ PUT: Block registration - Block student registration
// Used for: Block Registration button (individual)
// Body: { block_type, reason, notes }
// Returns: { msg, student_id, blocked_at, block_type }
export const BLOCK_STUDENT_ROUTE = (studentId) => `${FINANCE_BASE}/action/block/${studentId}`;

// ✅ POST: Bulk reminder - Send reminders to multiple students
// Used for: Send Bulk Reminder button
// Body: { student_ids[], message_template, contact_method }
// Returns: { msg, sent_count, failed_count, notifications_created }
export const BULK_REMINDER_ROUTE = `${FINANCE_BASE}/action/bulk-reminder`;

// ✅ POST: Bulk penalty - Apply penalties to multiple students
// Used for: Apply Late Penalties button
// Body: { student_ids[], penalty_amount, penalty_type }
// Returns: { msg, applied_count, total_penalties }
export const BULK_PENALTY_ROUTE = `${FINANCE_BASE}/action/bulk-penalty`;

// ✅ POST: Bulk block - Block registrations for multiple students
// Used for: Block Registrations button
// Body: { student_ids[], block_type, reason }
// Returns: { msg, blocked_count }
export const BULK_BLOCK_ROUTE = `${FINANCE_BASE}/action/bulk-block`;


/**
 * ================================================================================
 * ROUTE GROUPS (For easy importing)
 * ================================================================================
 */

// All existing routes that are ready to use
export const EXISTING_ROUTES = {
  dues: DUES_ROUTE,
  unpaidReport: UNPAID_REPORT_ROUTE,
  contactStudent: CONTACT_STUDENT_ROUTE,
  recordPayment: RECORD_PAYMENT_ROUTE,
};

// All connected routes (backend implemented)
export const CONNECTED_ROUTES = {
  unpaidStudents: UNPAID_STUDENTS_ROUTE,
  applyPenalty: APPLY_PENALTY_ROUTE,
  blockStudent: BLOCK_STUDENT_ROUTE,
  bulkReminder: BULK_REMINDER_ROUTE,
  bulkPenalty: BULK_PENALTY_ROUTE,
  bulkBlock: BULK_BLOCK_ROUTE,
};

// All routes combined
export const ALL_ROUTES = {
  ...EXISTING_ROUTES,
  ...CONNECTED_ROUTES,
};

export default ALL_ROUTES;

