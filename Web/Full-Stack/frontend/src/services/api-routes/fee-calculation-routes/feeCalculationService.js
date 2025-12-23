/**
 * ================================================================================
 * FEE CALCULATION SERVICE
 * ================================================================================
 * Service layer for making API calls to fee calculation endpoints.
 * Uses the route definitions from feeCalculationRoutes.js
 * 
 * Status:
 * ✅ CONNECTED - Function connected to existing backend API
 * 🔜 PENDING   - Waiting for backend API to be implemented
 * ================================================================================
 */

import api from '../../api';
import {
  GET_FEE_STRUCTURE_ROUTE,
  UPDATE_FEE_STRUCTURE_ROUTE,
  ADD_FEE_ITEM_ROUTE,
  DELETE_FEE_ITEM_ROUTE,
  CALCULATE_FEES_ROUTE,
} from './feeCalculationRoutes';


const feeCalculationService = {

  // ============================================================================
  // ✅ Get Fee Structure
  // ============================================================================
  /**
   * Fetches all fee categories with their items
   * @returns {Promise<Object>} { categories[], faculties[] }
   */
  getFeeStructure: async () => {
    try {
      const response = await api.get(GET_FEE_STRUCTURE_ROUTE);
      return response.data;
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Update Fee Structure
  // ============================================================================
  /**
   * Updates multiple fee items at once
   * @param {Object} feeStructure - Fee structure grouped by category
   * @param {Array} feeStructure.tuition - Array of tuition fee items
   * @param {Array} feeStructure.bus - Array of bus fee items
   * @returns {Promise<Object>} { msg, updated_count }
   */
  updateFeeStructure: async (feeStructure) => {
    try {
      const response = await api.put(UPDATE_FEE_STRUCTURE_ROUTE, feeStructure);
      return response.data;
    } catch (error) {
      console.error('Error updating fee structure:', error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Add Fee Item
  // ============================================================================
  /**
   * Creates a new fee item in the specified category
   * @param {Object} feeItem - Fee item data
   * @param {string} feeItem.category - Category name (tuition, bus, etc.)
   * @param {string} feeItem.name - Fee item name
   * @param {number} feeItem.amount - Fee amount
   * @param {boolean} feeItem.is_per_credit - Whether fee is per credit hour
   * @returns {Promise<Object>} { msg, fee{} }
   */
  addFeeItem: async (feeItem) => {
    try {
      const response = await api.post(ADD_FEE_ITEM_ROUTE, feeItem);
      return response.data;
    } catch (error) {
      console.error('Error adding fee item:', error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Delete Fee Item
  // ============================================================================
  /**
   * Deletes a fee item by ID
   * @param {number} itemId - Fee item ID
   * @returns {Promise<Object>} { msg, id }
   */
  deleteFeeItem: async (itemId) => {
    try {
      const response = await api.delete(DELETE_FEE_ITEM_ROUTE(itemId));
      return response.data;
    } catch (error) {
      console.error(`Error deleting fee item ${itemId}:`, error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Calculate Fees
  // ============================================================================
  /**
   * Calculates total fees based on parameters
   * @param {Object} params - Calculation parameters
   * @param {number} params.credit_hours - Number of credit hours
   * @param {string} params.faculty - Faculty name (optional)
   * @param {boolean} params.include_bus - Whether to include bus fees
   * @returns {Promise<Object>} { breakdown{}, total, calculation_details{} }
   */
  calculateFees: async (params) => {
    try {
      const response = await api.post(CALCULATE_FEES_ROUTE, params);
      return response.data;
    } catch (error) {
      console.error('Error calculating fees:', error);
      throw error;
    }
  },

};

export default feeCalculationService;

