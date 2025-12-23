import React, { useState, useEffect, useCallback } from 'react';
import { studentListService } from '../../services/api-routes/student-list-routes';
import './StudentList.css';

const StudentList = () => {
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Data states
    const [students, setStudents] = useState([]);
    const [faculties, setFaculties] = useState(['All Faculties']);
    const [totalCount, setTotalCount] = useState(0);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewLoading, setViewLoading] = useState(null); // For individual view button loading

    // Debounce search query
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch students from API
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                limit: 100, // Get more records for client-side filtering if needed
                offset: 0
            };

            // Add search parameter
            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim();
            }

            // Add faculty filter
            if (selectedFaculty && selectedFaculty !== 'all' && selectedFaculty !== 'All Faculties') {
                params.faculty = selectedFaculty;
            }

            // Add status filter
            if (selectedStatus && selectedStatus !== 'all') {
                params.status = selectedStatus;
            }

            const data = await studentListService.getStudents(params);
            
            setStudents(data.students || []);
            setTotalCount(data.total_count || 0);
            
            // Update faculties list from API
            if (data.faculties && data.faculties.length > 0) {
                setFaculties(['All Faculties', ...data.faculties]);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students. Please try again.');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedFaculty, selectedStatus]);

    // Fetch students when filters change
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'status-paid';
            case 'pending':
                return 'status-pending';
            case 'unpaid':
                return 'status-unpaid';
            default:
                return '';
        }
    };

    const handleViewStudent = async (student) => {
        // Use user_id from student object, or extract from id string
        const userId = student.user_id || parseInt(student.id.replace('STD-', ''));
        
        if (!userId || isNaN(userId)) {
            console.error('Invalid student ID:', student);
            alert('Invalid student ID. Please try again.');
            return;
        }

        setViewLoading(student.id);
        try {
            const data = await studentListService.getStudentDetails(userId);
            
            // For now, show alert with details. Later you can open a modal or navigate to details page
            console.log('Student Details:', data);
            
            // Format details for display
            const details = `Student: ${data.student.name}\n` +
                          `Email: ${data.student.email || 'N/A'}\n` +
                          `Faculty: ${data.student.faculty}\n` +
                          `Status: ${data.student.status}\n` +
                          `Total Fees: $${data.student.totalFees.toLocaleString()}\n` +
                          `Paid: $${data.student.paid.toLocaleString()}\n` +
                          `Dues: $${data.student.dues.toLocaleString()}\n\n` +
                          `Enrollments: ${data.enrollments.length}\n` +
                          `Payments: ${data.payments.length}\n` +
                          `Notifications: ${data.notifications.length}`;
            
            alert(details);
        } catch (err) {
            console.error('Error fetching student details:', err);
            alert('Failed to load student details. Please try again.');
        } finally {
            setViewLoading(null);
        }
    };

    const handleMoreActions = (studentId) => {
        console.log('More actions for:', studentId);
        // Show dropdown menu with more options
        // TODO: Implement dropdown menu with actions like:
        // - Record Payment
        // - Contact Student
        // - View Full History
        // - Block/Unblock Registration
    };

    return (
        <div className="student-list-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Student List</h1>
                    <p className="page-subtitle">View and manage student payment information</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
                <div className="search-box">
                    <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                    className="faculty-filter"
                >
                    {faculties.map((faculty, index) => (
                        <option key={index} value={faculty === 'All Faculties' ? 'all' : faculty}>
                            {faculty}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="status-filter"
                >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                </select>
            </div>

            {/* Students Table */}
            <div className="students-section">
                <div className="section-header">
                    <div className="section-title-with-icon">
                        <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h2 className="section-title">Students ({totalCount})</h2>
                    </div>
                </div>

                <div className="table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Faculty</th>
                                <th>Total Fees</th>
                                <th>Paid</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="loading-cell">
                                        <div className="loading-container">
                                            <div className="loading-spinner"></div>
                                            <p>Loading students...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="error-cell">
                                        <div className="error-container">
                                            <p className="error-message">{error}</p>
                                            <button onClick={fetchStudents} className="retry-btn">
                                                Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id || student.user_id}>
                                        <td className="student-id">{student.id}</td>
                                        <td className="student-name-cell">
                                            <div className="student-name">{student.name}</div>
                                            <div className="student-email">{student.email || 'No email'}</div>
                                        </td>
                                        <td className="faculty">{student.faculty || 'Unknown'}</td>
                                        <td className="amount">${(student.totalFees || 0).toLocaleString()}</td>
                                        <td className="amount">${(student.paid || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(student.status)}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="action-btn view-btn"
                                                onClick={() => handleViewStudent(student)}
                                                disabled={viewLoading === student.id}
                                                title="View Details"
                                            >
                                                {viewLoading === student.id ? (
                                                    <>
                                                        <div className="btn-spinner"></div>
                                                        <span>Loading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <span>View</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="action-btn more-btn"
                                                onClick={() => handleMoreActions(student.id)}
                                                title="More Actions"
                                            >
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                                <span>Actions</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-cell">
                                        <div className="no-results">
                                            <svg className="no-results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="no-results-text">No students found</p>
                                            <p className="no-results-subtext">Try adjusting your search or filter criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentList;
