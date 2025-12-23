/**
 * ================================================================================
 * STUDENT LIST SERVICE
 * ================================================================================
 * Service layer for making API calls to student list endpoints.
 * Uses the route definitions from studentListRoutes.js
 * 
 * Status:
 * ✅ CONNECTED - Function connected to existing backend API
 * 🔜 PENDING   - Waiting for backend API to be implemented
 * ================================================================================
 */

import api from '../../api';
import {
  GET_STUDENTS_ROUTE,
  GET_STUDENT_DETAILS_ROUTE,
} from './studentListRoutes';


const studentListService = {

  // ============================================================================
  // ✅ Get All Students
  // ============================================================================
  /**
   * Fetches all students with their payment information
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search by name or student ID
   * @param {string} params.faculty - Filter by faculty
   * @param {string} params.status - Filter by status (Paid/Pending/Unpaid)
   * @param {number} params.limit - Number of records to return (default: 50)
   * @param {number} params.offset - Pagination offset (default: 0)
   * @returns {Promise<Object>} { students[], total_count, faculties[] }
   */
  getStudents: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.faculty) queryParams.append('faculty', params.faculty);
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${GET_STUDENTS_ROUTE}?${queryString}` : GET_STUDENTS_ROUTE;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // ============================================================================
  // ✅ Get Student Details
  // ============================================================================
  /**
   * Fetches detailed information for a specific student
   * @param {number} studentId - Student user ID
   * @returns {Promise<Object>} { student{}, enrollments[], payments[], notifications[] }
   */
  getStudentDetails: async (studentId) => {
    try {
      const response = await api.get(GET_STUDENT_DETAILS_ROUTE(studentId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching student details for ID ${studentId}:`, error);
      throw error;
    }
  },

};

export default studentListService;

