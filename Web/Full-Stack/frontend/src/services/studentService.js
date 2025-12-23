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
  getCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
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
