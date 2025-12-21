import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import studentService from '../../services/studentService';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardStatus();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="error-container">
          <p>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const enrollments = dashboardData?.enrollments || [];
  const duesBalance = dashboardData?.dues_balance || 0;
  const totalCourses = enrollments.length;
  const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits || 0), 0);

  return (
    <DashboardLayout>
      <div className="student-dashboard-content">
        
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Student Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user?.username}</p>
        </div>

        {/* === TWO-COLUMN LAYOUT: Main Content (70%) + Context Sidebar (30%) === */}
        <div className="dashboard-main-layout">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="dashboard-main-column">
            
            {/* Financial Overview - 2x2 Grid */}
            <div>
              <h2 className="section-label">Financial Overview</h2>
              <div className="stats-grid-2x2">
                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value">{totalCourses}</div>
                    <div className="stat-label">Registered Courses</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value">{totalCredits}</div>
                    <div className="stat-label">Total Credits</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper">
                    <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value">${duesBalance.toLocaleString()}</div>
                    <div className="stat-label">Outstanding Balance</div>
                  </div>
                </div>
                
                {/* Next Due Date */}
                <div className="stat-card">
                   <div className="stat-icon-wrapper">
                    <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-value">-</div>
                    <div className="stat-label">Next Due Date</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Details: Registered Courses (Full Width) */}
        <div>
          <h2 className="section-label">Academic Details</h2>
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-title-group">
                <svg className="card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <h2 className="card-title">Academic Details</h2>
              </div>
              <button className="manage-courses-btn" onClick={() => navigate('/student/courses')}>
                Manage Courses
              </button>
            </div>

            <div className="card-content">
              {enrollments.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3>No Enrollments Found</h3>
                  <p>You are not currently enrolled in any courses for this term.</p>
                  <button className="action-btn-primary" onClick={() => navigate('/student/courses')}>
                    View Course Catalog
                  </button>
                </div>
              ) : (
                <div className="courses-container">
                  <div className="course-list-header">
                    <div>Course Name</div>
                    <div>Credits</div>
                    <div>Tuition Fee</div>
                    <div>Status</div>
                  </div>
                  {enrollments.map((enrollment, index) => (
                    <div key={index} className="course-item">
                      <div className="course-name">{enrollment.course_name}</div>
                      <div className="course-meta-item">
                        {enrollment.credits || 'N/A'} Credits
                      </div>
                      <div className="course-meta-item">
                        ${enrollment.course_fee?.toLocaleString()}
                      </div>
                      <div>
                        <span className="status-badge">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Actions: Quick Actions Grid */}
        <div>
          <h2 className="section-label">Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/student/courses')}>
              <svg className="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="action-label">Register Courses</span>
            </div>

            <div className="action-card" onClick={() => navigate('/student/fees')}>
              <svg className="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="action-label">View Fee Statement</span>
            </div>

            <div className="action-card" onClick={() => navigate('/student/payment')}>
              <svg className="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="action-label">Make Payment</span>
            </div>

            <div className="action-card" onClick={() => navigate('/student/history')}>
              <svg className="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="action-label">Transaction History</span>
            </div>
          </div>
        </div>
          </div>
          {/* END: Main Column */}

          {/* RIGHT COLUMN: Context Sidebar (30%) */}
          <div className="dashboard-sidebar-column">
            
            {/* Notifications Widget (MOCK DATA) */}
            <div className="dashboard-widget">
              <div className="widget-header">
                <div className="widget-title-group">
                  <svg className="widget-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <h3 className="widget-title">Notifications</h3>
                </div>
                <span className="notification-badge">3</span>
              </div>
              <div className="widget-content">
                {/* MOCK NOTIFICATION DATA */}
                <div className="notification-item unread">
                  <div className="notification-icon success">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Payment Approved</div>
                    <div className="notification-text">Your payment of $500 has been processed successfully.</div>
                    <div className="notification-time">2 hours ago</div>
                  </div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-icon info">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Course Registration Open</div>
                    <div className="notification-text">Spring 2024 course registration is now available.</div>
                    <div className="notification-time">1 day ago</div>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon warning">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">Payment Reminder</div>
                    <div className="notification-text">Your next payment is due on Jan 15, 2024.</div>
                    <div className="notification-time">3 days ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Widget (MOCK DATA) */}
            <div className="dashboard-widget">
              <div className="widget-header">
                <div className="widget-title-group">
                  <svg className="widget-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="widget-title">Recent Activity</h3>
                </div>
              </div>
              <div className="widget-content">
                {/* MOCK ACTIVITY DATA */}
                <div className="activity-timeline">
                  <div className="activity-item">
                    <div className="activity-dot payment"></div>
                    <div className="activity-content">
                      <div className="activity-title">Payment Received</div>
                      <div className="activity-description">Paid $500 via Credit Card</div>
                      <div className="activity-time">Dec 20, 2024 - 2:30 PM</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot enrollment"></div>
                    <div className="activity-content">
                      <div className="activity-title">Course Enrolled</div>
                      <div className="activity-description">Registered for Advanced Mathematics</div>
                      <div className="activity-time">Dec 18, 2024 - 10:15 AM</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot payment"></div>
                    <div className="activity-content">
                      <div className="activity-title">Payment Received</div>
                      <div className="activity-description">Paid $1,000 via Bank Transfer</div>
                      <div className="activity-time">Dec 15, 2024 - 4:45 PM</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot enrollment"></div>
                    <div className="activity-content">
                      <div className="activity-title">Course Enrolled</div>
                      <div className="activity-description">Registered for Computer Science 101</div>
                      <div className="activity-time">Dec 10, 2024 - 9:00 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* END: Sidebar Column */}

        </div>
        {/* END: Two-Column Layout */}

      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
