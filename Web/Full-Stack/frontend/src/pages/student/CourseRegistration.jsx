import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import DashboardLayout from '../../layouts/DashboardLayout';
import studentService from '../../services/studentService';
import './CourseRegistration.css';

const CourseRegistration = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dropLoading, setDropLoading] = useState(null); // ID of course being dropped
  const [hasPayments, setHasPayments] = useState(false); // Track if student has made any payments
  const [creditLimit, setCreditLimit] = useState(18); // Default credit limit

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for authentication token
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      if (!token) {
        throw { message: 'Please log in to view courses', status: 401 };
      }

      try {
        // Get dashboard status to fetch faculty and enrolled courses
        console.log('Fetching dashboard status...');
        const statusData = await studentService.getDashboardStatus().catch(err => {
          console.warn('Error fetching dashboard status:', err);
          return { enrollments: [] };
        });
        console.log('Dashboard status data:', statusData);

        // Get faculty ID from status data
        const facultyId = statusData?.faculty?.id ||
          statusData?.user?.faculty_id ||
          (statusData?.user?.faculty ? statusData.user.faculty.id : null);

        console.log('Extracted faculty ID:', facultyId);

        // Fetch courses - handle both with and without faculty ID
        console.log('Fetching courses...');
        let coursesData = [];

        try {
          // First try with faculty ID if available
          if (facultyId) {
            try {
              coursesData = await studentService.getCourses(facultyId);
            } catch (facultyError) {
              console.warn('Error fetching courses with faculty filter, trying without filter...', facultyError);
              // Fall back to fetching all courses if faculty-specific fetch fails
              coursesData = await studentService.getCourses(null);
            }
          } else {
            // If no faculty ID, try fetching all courses
            coursesData = await studentService.getCourses(null);
          }
        } catch (error) {
          console.error('Error fetching courses:', error);
          // If we get here, both attempts failed
          setError('Failed to load courses. Please try again later.');
          setCourses([]);
          return;
        }
        console.log('Courses data received:', coursesData);

        // Update courses state with validation
        const coursesArray = Array.isArray(coursesData?.courses) ? coursesData.courses : [];
        console.log(`Setting ${coursesArray.length} courses`, coursesArray);

        // Ensure all required fields have default values
        const validatedCourses = coursesArray.map(course => ({
          id: course.id || 0,
          course_id: course.course_id || `COURSE-${course.id || '0'}`,
          name: course.name || 'Unnamed Course',
          description: course.description || '',
          credits: Number(course.credits) || 3,
          total_fee: Number(course.total_fee) || 0,
          faculty_id: course.faculty_id || null,
          faculty: course.faculty || { id: null, name: 'Unknown Faculty' }
        }));

        console.log('Validated courses:', validatedCourses);
        setCourses(validatedCourses);

        // Update enrolled courses
        if (statusData.enrollments) {
          const enrolledIds = statusData.enrollments.map(e => e.course_id);
          console.log('Enrolled Course IDs:', enrolledIds);
          setEnrolledCourseIds(enrolledIds);

          // Clear any selected courses that are now enrolled
          setSelectedCourses(prev => prev.filter(c => !enrolledIds.includes(c.id)));
        }

        // Check for payments
        console.log('Fetching payment history...');
        const paymentData = await studentService.getPaymentHistory().catch(err => {
          console.warn('Error fetching payment history:', err);
          return { payments: [] };
        });
        console.log('Payment data:', paymentData);
        setHasPayments(paymentData.payments?.length > 0);

      } catch (err) {
        console.error('Error in fetchData:', err);

        if (err.status === 401 || err.response?.status === 401) {
          localStorage.removeItem('token');
          throw {
            message: 'Your session has expired. Please log in again.',
            status: 401
          };
        }

        // For server errors, try to continue with empty data
        if (err.response?.status === 500) {
          console.warn('Server error, continuing with empty course list');
          setCourses([]);
          setEnrolledCourseIds([]);
          return;
        }

        throw err; // Re-throw other errors
      }

    } catch (err) {
      console.error('Error in fetchData:', err);
      if (err.response?.status === 500) {
        setError('Authentication error. Please try logging in again.');
        // Optionally clear the token and redirect to login
        localStorage.removeItem('token');
        // navigate('/login');
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to the server. Please check your connection.');
      } else {
        setError('Failed to load courses. Please try again later.');
      }
      setCourses([]); // Clear courses to show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (course) => {
    try {
      if (!course || !course.id) {
        console.error('Invalid course data:', course);
        return;
      }

      setSelectedCourses(prev => {
        try {
          // Create a copy of the previous state to work with
          const newSelection = [...prev];
          const existingIndex = newSelection.findIndex(c => c && c.id === course.id);

          if (existingIndex >= 0) {
            // If course is already selected, remove it
            newSelection.splice(existingIndex, 1);
            return newSelection;
          } else {
            // Check if already enrolled
            if (enrolledCourseIds.includes(course.id)) {
              message.warning('You are already enrolled in this course');
              return prev;
            }

            // Check credit limit
            const currentCredits = newSelection.reduce((sum, c) => sum + (Number(c?.credits) || 0), 0);
            if (currentCredits + (Number(course.credits) || 0) > creditLimit) {
              message.error(`Cannot exceed credit limit of ${creditLimit} credits`);
              return prev;
            }

            // Add the new course to selection
            return [
              ...newSelection,
              {
                id: course.id,
                course_id: course.course_id,
                name: course.name,
                credits: Number(course.credits) || 0,
                total_fee: Number(course.total_fee) || 0
              }
            ];
          }
        } catch (err) {
          console.error('Error in handleCourseToggle:', err);
          return prev; // Return previous state if error occurs
        }
      });
    } catch (err) {
      console.error('Error in handleCourseToggle:', err);
    }
  };

  const handleDropCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;

    setDropLoading(courseId);
    try {
      await studentService.dropCourse(courseId);
      // Remove from enrolled list and refresh data
      setEnrolledCourseIds(prev => prev.filter(id => id !== courseId));
      message.success('Course dropped successfully');

      // Refresh data to ensure consistency
      await fetchData();
    } catch (err) {
      console.error('Drop course error:', err);
      message.error(err.response?.data?.error || 'Failed to drop course');
    } finally {
      setDropLoading(false);
    }
  };

  const calculateTotalCredits = () => {
    return selectedCourses.reduce((sum, course) => {
      const credits = Number(course.credits) || 0;
      return sum + credits;
    }, 0);
  };

  // Update credit limit based on user's status or other criteria
  useEffect(() => {
    // You can fetch this from an API or user profile if needed
    // For now, we'll use the default 18 credits
    setCreditLimit(18);
  }, []);

  const calculateTotalFees = () => {
    return selectedCourses.reduce((sum, course) => {
      const fee = Number(course.total_fee) || 0;
      return sum + fee;
    }, 0);
  };

  const handleSubmitRegistration = async () => {
    if (selectedCourses.length === 0) {
      message.warning('Please select at least one course to register');
      return;
    }

    const totalCredits = calculateTotalCredits();
    if (totalCredits > creditLimit) {
      message.error(`Maximum ${creditLimit} credits per semester allowed`);
      return;
    }

    if (!hasPayments) {
      message.warning('Please complete your payment before registering for courses');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Enroll in each selected course
      const enrollPromises = selectedCourses.map(course =>
        studentService.enrollCourse(course.id)
      );

      await Promise.all(enrollPromises);

      message.success('Registration successful!');
      setSelectedCourses([]);

      // Refresh data to sync with server
      await fetchData();
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to complete registration';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isCourseSelected = (courseId) => {
    return selectedCourses.some(c => c.id === courseId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="course-registration-container">
        {/* Main Content */}
        <div className="course-list-section">
          <div className="page-header">
            <h1 className="page-title">Course Registration</h1>
            <p className="page-subtitle">Select courses for the upcoming semester</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              ✓ {success}
            </div>
          )}

          <div className="courses-grid">
            {courses.length === 0 ? (
              <div className="no-courses">
                <p>No courses available for your faculty at this time.</p>
                <p>Please check back later or contact your academic advisor.</p>
              </div>
            ) : (
              courses.map((course) => {
                if (!course || !course.id) return null; // Skip invalid courses

                const courseId = course.id;
                const isSelected = isCourseSelected(courseId);
                const isEnrolled = enrolledCourseIds.includes(courseId);

                return (
                  <div
                    key={courseId}
                    className={`course-card ${isSelected ? 'selected' : ''} ${isEnrolled ? 'enrolled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isEnrolled) {
                        handleCourseToggle(course);
                      }
                    }}
                  >
                    <div className="course-checkbox">
                      {isEnrolled ? (
                        <div className="course-checkbox" onClick={(e) => e.stopPropagation()}>
                          <div className="enrolled-badge">
                            <svg className="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCourseToggle(course)}
                            className="checkbox-input"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {isSelected && (
                            <svg className="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="course-info">
                      <div className="course-header">
                        <span className={`course-code ${isEnrolled ? 'enrolled-code' : ''}`}>{course.course_id}</span>
                        <h3 className="course-name">
                          {course.name}
                          {isEnrolled && <span className="enrolled-text"> (Enrolled)</span>}
                        </h3>
                      </div>

                      <div className="course-details">
                        <div className="detail-item">
                          <svg className="detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{course.credits} Credits</span>
                        </div>

                        <div className="detail-item">
                          <svg className="detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>${(course.total_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {isEnrolled && (
                      <button
                        className="btn-drop"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropCourse(course.id);
                        }}
                        disabled={dropLoading === course.id || hasPayments}
                        title={hasPayments ? "Cannot drop courses after making payments" : "Drop this course"}
                      >
                        {dropLoading === course.id ? 'Dropping...' : 'Drop'}
                      </button>
                    )}
                  </div>
                );
              }))}
          </div>
        </div>

        {/* Registration Summary Sidebar */}
        <div className="summary-sidebar">
          <div className="summary-card">
            <div className="summary-header">
              <svg className="summary-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2>Registration Summary</h2>
            </div>

            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Selected Courses</span>
                <span className="summary-value">{selectedCourses.length}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Total Credits</span>
                <span className="summary-value">{calculateTotalCredits()}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span className="summary-label">Estimated Fees</span>
                <span className="summary-value">${calculateTotalFees().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <button
                className="submit-btn"
                onClick={handleSubmitRegistration}
                disabled={submitting || selectedCourses.length === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>

              <p className="summary-note">Maximum 18 credits per semester</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseRegistration;
