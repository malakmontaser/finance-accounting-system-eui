/**
 * ================================================================================
 * STUDENT LIST API ROUTES
 * ================================================================================
 * This file contains all API route definitions for the Student List page.
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

// ✅ GET: Get all students with payment information
// Used for: Student List Table, Search, Faculty Filter, Status Filter
// Query Params: search, faculty, status, limit, offset
// Returns: { students[], total_count, faculties[] }
export const GET_STUDENTS_ROUTE = `${FINANCE_BASE}/students`;

// ✅ GET: Get detailed student information
// Used for: View Student Details (View button action)
// Returns: { student{}, enrollments[], payments[], notifications[] }
export const GET_STUDENT_DETAILS_ROUTE = (studentId) => `${FINANCE_BASE}/students/${studentId}`;

/**
 * ================================================================================
 * ROUTE GROUPS (For organization)
 * ================================================================================
 */

// All student list routes
export const STUDENT_LIST_ROUTES = {
  GET_STUDENTS: GET_STUDENTS_ROUTE,
  GET_STUDENT_DETAILS: GET_STUDENT_DETAILS_ROUTE,
};

