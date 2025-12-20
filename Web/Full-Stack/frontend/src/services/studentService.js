import api from './api';

const studentService = {
  /**
   * Get student dashboard status
   * @returns {Promise<Object>} Student status data
   */
  getDashboardStatus: async () => {
    const response = await api.get('/students/status');
    return response.data;
  },

  /**
   * Get all available courses
   * @returns {Promise<Object>} List of courses
   */
    getCourses: async (facultyId) => {
    try {
      console.log(`Fetching courses for faculty ID: ${facultyId}`);
      const params = {};
      if (facultyId) {
        params.faculty_id = facultyId;
      } else {
        console.warn('No faculty ID provided, fetching all available courses');
      }
      
      // Get token and verify it exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw { message: 'Authentication required', status: 401 };
      }
      
      // Add token to request headers
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params
      };
      
      // Make the API request with proper error handling
      const response = await api.get('/courses', { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Courses API Response:', response);
      return response.data;
      
      // Handle different response formats
      if (!response.data) {
        console.error('No data in response');
        return [];
      }
      
      // If the response is an array, return it directly
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // If the response has a 'courses' field, return that
      if (response.data.courses && Array.isArray(response.data.courses)) {
        return response.data.courses;
      }
      
      // If the response has a 'data' field, return that
      if (response.data.data) {
        return response.data.data.courses || response.data.data || [];
      }
      
      // Default return empty array if no valid format
      return [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
      }
      throw error; // Re-throw to be caught by the component
    }
  },

  /**
   * Enroll in a course
   * @param {number} courseId - ID of the course to enroll in
   * @returns {Promise<Object>} Enrollment confirmation
   */
  enrollCourse: async (courseId) => {
    const response = await api.post('/students/enroll', { course_id: courseId });
    return response.data;
  },

  /**
   * Drop a course
   * @param {number} courseId - ID of the course to drop
   * @returns {Promise<Object>} Drop confirmation
   */
  dropCourse: async (courseId) => {
    const response = await api.delete(`/students/enroll/${courseId}`);
    return response.data;
  },

  /**
   * Make a payment
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method (ONLINE, MANUAL, etc.)
   * @param {string} referenceNumber - Optional reference number
   * @returns {Promise<Object>} Payment confirmation
   */
  makePayment: async (amount, paymentMethod = 'ONLINE', referenceNumber = '') => {
    const response = await api.post('/students/pay', {
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber
    });
    return response.data;
  },

  /**
   * Get payment history
   * @returns {Promise<Object>} List of payments
   */
  /**
   * Get payment history
   * @returns {Promise<Object>} List of payments
   */
  getPaymentHistory: async () => {
    const response = await api.get('/students/payments');
    return response.data;
  },


};

export default studentService;
