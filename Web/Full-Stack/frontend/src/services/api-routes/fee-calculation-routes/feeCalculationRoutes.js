/**
 * ================================================================================
 * FEE CALCULATION API ROUTES
 * ================================================================================
 * This file contains all API route definitions for the Fee Calculation page.
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

// ✅ GET: Get all fee categories with their items
// Used for: Tuition Fees Card, Bus Fees Card, Fee Calculator
// Returns: { categories[], faculties[] }
export const GET_FEE_STRUCTURE_ROUTE = `${FINANCE_BASE}/fee-structure`;

// ✅ PUT: Save/update all fee structure changes
// Used for: Save Changes Button
// Body: { tuition: [], bus: [], ... }
// Returns: { msg, updated_count }
export const UPDATE_FEE_STRUCTURE_ROUTE = `${FINANCE_BASE}/fee-structure`;

// ✅ POST: Add a new fee item to a category
// Used for: Add Fee Button
// Body: { category, name, amount, is_per_credit }
// Returns: { msg, fee{} }
export const ADD_FEE_ITEM_ROUTE = `${FINANCE_BASE}/fee-structure/item`;

// ✅ DELETE: Remove a fee item
// Used for: Remove Fee Button (trash icon)
// Returns: { msg, id }
export const DELETE_FEE_ITEM_ROUTE = (itemId) => `${FINANCE_BASE}/fee-structure/item/${itemId}`;

// ✅ POST: Calculate total fees based on parameters (Optional)
// Used for: Fee Calculator (real-time calculation)
// Body: { credit_hours, faculty, include_bus }
// Returns: { breakdown{}, total, calculation_details{} }
export const CALCULATE_FEES_ROUTE = `${FINANCE_BASE}/calculate-fees`;

/**
 * ================================================================================
 * ROUTE GROUPS (For organization)
 * ================================================================================
 */

// All fee calculation routes
export const FEE_CALCULATION_ROUTES = {
  GET_FEE_STRUCTURE: GET_FEE_STRUCTURE_ROUTE,
  UPDATE_FEE_STRUCTURE: UPDATE_FEE_STRUCTURE_ROUTE,
  ADD_FEE_ITEM: ADD_FEE_ITEM_ROUTE,
  DELETE_FEE_ITEM: DELETE_FEE_ITEM_ROUTE,
  CALCULATE_FEES: CALCULATE_FEES_ROUTE,
};

