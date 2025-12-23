import api from './api';

const studentService = {
  /**
   * Get student dashboard status
   * @returns {Promise<Object>} Student status data
   */
  getDashboardStatus: async () => {
    try {
      const response = await api.get('/students/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard status:', error);
      throw error;
    }
  },

  /**
   * Get all available courses
   * @param {number} [facultyId] - Optional faculty ID to filter courses
   * @returns {Promise<Object>} Object containing courses array
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
      
      // Make the API request with proper error handling
      const response = await api.get('/courses', { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Courses API Response - Full Response:', response);
      
      // Handle different response formats
      if (!response?.data) {
        console.error('No data in API response');
        return { courses: [] };
      }
      
      // Check if the data has a courses array or if it's the array itself
      let courses = [];
      
      if (Array.isArray(response.data)) {
        // If response.data is already an array
        courses = response.data;
      } else if (response.data.courses && Array.isArray(response.data.courses)) {
        // If response.data has a 'courses' array
        courses = response.data.courses;
      } else if (response.data.data) {
        // If response.data has a 'data' field
        courses = response.data.data.courses || response.data.data || [];
      }
      
      console.log('Processed courses data:', courses);
      return { courses: Array.isArray(courses) ? courses : [] };
      
    } catch (error) {
      console.error('Error in getCourses:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      return { courses: [], error: error.message || 'Failed to fetch courses' };
    }
  },

  /**
   * Enroll in a course
   * @param {number} courseId - ID of the course to enroll in
   * @returns {Promise<Object>} Enrollment confirmation
   */
  enrollCourse: async (courseId) => {
    try {
      const response = await api.post('/students/enroll', { course_id: courseId });
      return response.data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  },

  /**
   * Drop a course
   * @param {number} courseId - ID of the course to drop
   * @returns {Promise<Object>} Drop confirmation
   */
  dropCourse: async (courseId) => {
    try {
      const response = await api.delete(`/students/enroll/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error dropping course:', error);
      throw error;
    }
  },

  /**
   * Make a payment
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method (ONLINE, MANUAL, etc.)
   * @param {string} referenceNumber - Optional reference number
   * @param {string} [paymentDate] - Explicit ISO timestamp of payment initiation
   * @returns {Promise<Object>} Payment confirmation
   */
  makePayment: async (amount, paymentMethod = 'ONLINE', referenceNumber = '', proofFile = null, paymentDate = null) => {
    try {
      let data;
      
      if (proofFile) {
        data = new FormData();
        data.append('amount', amount);
        data.append('payment_method', paymentMethod);
        data.append('reference_number', referenceNumber);
        data.append('proof_document', proofFile);
        if (paymentDate) data.append('payment_date', paymentDate);
        // Axios automatically sets Content-Type to multipart/form-data when data is FormData
      } else {
        data = {
          amount,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          payment_date: paymentDate
        };
      }
      
      const response = await api.post('/students/pay', data);
      return response.data;
    } catch (error) {
      console.error('Error making payment:', error);
      throw error;
    }
  },

  /**
   * Get payment history
   * @returns {Promise<Object>} List of payments
   */
  getPaymentHistory: async () => {
    try {
      const response = await api.get('/students/payments');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
};

export default studentService;
