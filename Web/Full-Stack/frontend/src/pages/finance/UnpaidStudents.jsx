import React, { useState, useEffect } from 'react';
import { unpaidStudentsService } from '../../services/api-routes/unpaid-students-routes';
import './UnpaidStudents.css';

const UnpaidStudents = () => {
    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Students data - will be populated from API
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        unpaidCount: 0,
        totalOutstanding: 0,
        overdueCount: 0
    });

    // ============================================================================
    // ✅ FETCH DATA FROM ENHANCED API
    // ============================================================================
    useEffect(() => {
        const fetchUnpaidStudents = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // ✅ Use enhanced API to get unpaid students data
                const data = await unpaidStudentsService.getUnpaidStudents();
                
                setStudents(data.students);
                setStats({
                    unpaidCount: data.summary.unpaid_count,
                    totalOutstanding: data.summary.total_outstanding,
                    overdueCount: data.summary.overdue_count,
                });
            } catch (err) {
                console.error('Error fetching unpaid students:', err);
                setError('Failed to load unpaid students. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUnpaidStudents();
    }, []);

    // ============================================================================
    // ✅ CONNECTED: Send Reminder (Individual)
    // ============================================================================
    const handleSendReminder = async (studentId) => {
        setActionLoading(`reminder-${studentId}`);
        
        try {
            // Find student to get user_id
            const student = students.find(s => s.student_id === studentId);
            if (!student) {
                alert('Student not found');
                return;
            }

            // ✅ Use existing API
            await unpaidStudentsService.contactStudent(student.user_id, {
                contact_method: 'EMAIL',
                notes: 'Payment reminder sent from Unpaid Students page'
            });
            
            alert(`Reminder sent to student ${studentId}`);
            
            // Refresh data
            const data = await unpaidStudentsService.getUnpaidStudents();
            setStudents(data.students);
        } catch (err) {
            console.error('Error sending reminder:', err);
            alert('Failed to send reminder. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    // ============================================================================
    // ✅ Apply Penalties (Individual) - Connected to API
    // ============================================================================
    const handleApplyPenalties = async (studentId) => {
        const student = students.find(s => s.student_id === studentId || s.id === parseInt(studentId.replace('STD-', '')));
        if (!student) {
            alert('Student not found');
            return;
        }

        const penaltyAmount = prompt(`Enter penalty amount for ${student.name}:`, '50');
        if (!penaltyAmount || isNaN(penaltyAmount) || parseFloat(penaltyAmount) <= 0) {
            return;
        }

        setActionLoading(`penalty-${studentId}`);
        
        try {
            await unpaidStudentsService.applyPenalty(student.user_id || student.id, {
                penalty_amount: parseFloat(penaltyAmount),
                penalty_type: 'LATE_FEE',
                notes: `Late payment penalty applied - ${student.days_overdue || 0} days overdue`
            });
            
            alert(`Penalty of $${penaltyAmount} applied successfully to ${student.name}`);
            
            // Refresh data
            const data = await unpaidStudentsService.getUnpaidStudents();
            setStudents(data.students);
            setStats({
                unpaidCount: data.summary.unpaid_count,
                totalOutstanding: data.summary.total_outstanding,
                overdueCount: data.summary.overdue_count,
            });
        } catch (err) {
            console.error('Error applying penalty:', err);
            alert('Failed to apply penalty. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    // ============================================================================
    // ✅ Block Registration (Individual) - Connected to API
    // ============================================================================
    const handleBlockRegistration = async (studentId) => {
        const student = students.find(s => s.student_id === studentId || s.id === parseInt(studentId.replace('STD-', '')));
        if (!student) {
            alert('Student not found');
            return;
        }

        if (window.confirm(`Are you sure you want to block registration for ${student.name}?`)) {
            setActionLoading(`block-${studentId}`);
            
            try {
                await unpaidStudentsService.blockStudent(student.user_id || student.id, {
                    block_type: 'REGISTRATION',
                    reason: `Outstanding dues of $${student.outstanding} - ${student.days_overdue || 0} days overdue`,
                    notes: 'Blocked from Unpaid Students page'
                });
                
                alert(`Registration blocked successfully for ${student.name}`);
                
                // Refresh data
                const data = await unpaidStudentsService.getUnpaidStudents();
                setStudents(data.students);
            } catch (err) {
                console.error('Error blocking student:', err);
                alert('Failed to block student. Please try again.');
            } finally {
                setActionLoading(null);
            }
        }
    };

    // ============================================================================
    // ✅ Send Bulk Reminder - Connected to API
    // ============================================================================
    const handleSendBulkReminder = async () => {
        if (students.length === 0) {
            alert('No unpaid students found.');
            return;
        }

        if (window.confirm(`Send reminders to all ${students.length} unpaid students?`)) {
            setActionLoading('bulk-reminder');
            
            try {
                const result = await unpaidStudentsService.sendBulkReminders({
                    student_ids: 'all',
                    message_template: 'default',
                    contact_method: 'EMAIL'
                });
                
                alert(`Bulk reminders sent successfully!\nSent: ${result.sent_count}\nFailed: ${result.failed_count}`);
                
                // Refresh data
                const data = await unpaidStudentsService.getUnpaidStudents();
                setStudents(data.students);
            } catch (err) {
                console.error('Error sending bulk reminders:', err);
                alert('Failed to send bulk reminders. Please try again.');
            } finally {
                setActionLoading(null);
            }
        }
    };

    // ============================================================================
    // ✅ Apply Late Penalties - Connected to API
    // ============================================================================
    const handleApplyLatePenalties = async () => {
        const overdueStudents = students.filter(s => (s.days_overdue || 0) > 0);
        if (overdueStudents.length === 0) {
            alert('No overdue students found.');
            return;
        }

        const penaltyAmount = prompt(`Enter penalty amount to apply to ${overdueStudents.length} overdue students:`, '50');
        if (!penaltyAmount || isNaN(penaltyAmount) || parseFloat(penaltyAmount) <= 0) {
            return;
        }

        if (window.confirm(`Apply $${penaltyAmount} penalty to ${overdueStudents.length} overdue students?`)) {
            setActionLoading('bulk-penalty');
            
            try {
                const studentIds = overdueStudents.map(s => s.user_id || s.id);
                const result = await unpaidStudentsService.applyBulkPenalties({
                    student_ids: studentIds,
                    penalty_amount: parseFloat(penaltyAmount),
                    penalty_type: 'LATE_FEE'
                });
                
                alert(`Bulk penalties applied successfully!\nApplied to: ${result.applied_count} students\nTotal penalties: $${result.total_penalties}`);
                
                // Refresh data
                const data = await unpaidStudentsService.getUnpaidStudents();
                setStudents(data.students);
                setStats({
                    unpaidCount: data.summary.unpaid_count,
                    totalOutstanding: data.summary.total_outstanding,
                    overdueCount: data.summary.overdue_count,
                });
            } catch (err) {
                console.error('Error applying bulk penalties:', err);
                alert('Failed to apply bulk penalties. Please try again.');
            } finally {
                setActionLoading(null);
            }
        }
    };

    // ============================================================================
    // ✅ Block Registrations - Connected to API
    // ============================================================================
    const handleBlockRegistrations = async () => {
        const severelyOverdue = students.filter(s => (s.days_overdue || 0) > 7);
        if (severelyOverdue.length === 0) {
            alert('No severely overdue students found.');
            return;
        }
        
        if (window.confirm(`Block registration for ${severelyOverdue.length} students with overdue payments (>7 days)?`)) {
            setActionLoading('bulk-block');
            
            try {
                const studentIds = severelyOverdue.map(s => s.user_id || s.id);
                const result = await unpaidStudentsService.blockBulkRegistrations({
                    student_ids: studentIds,
                    block_type: 'REGISTRATION',
                    reason: 'Outstanding dues over 7 days'
                });
                
                alert(`Bulk registrations blocked successfully!\nBlocked: ${result.blocked_count} students`);
                
                // Refresh data
                const data = await unpaidStudentsService.getUnpaidStudents();
                setStudents(data.students);
            } catch (err) {
                console.error('Error blocking bulk registrations:', err);
                alert('Failed to block bulk registrations. Please try again.');
            } finally {
                setActionLoading(null);
            }
        }
    };

    const getStatusClass = (student) => {
        // Use status field if available, otherwise calculate from days_overdue
        const daysOverdue = student.days_overdue || 0;
        const status = student.status || '';
        
        if (daysOverdue > 7 || status === 'Critical') return 'status-severe-overdue';
        if (daysOverdue > 0 || status === 'Moderate') return 'status-overdue';
        if (status === 'Due Today') return 'status-due-today';
        return 'status-due-soon';
    };

    const formatStatus = (student) => {
        const daysOverdue = student.days_overdue || 0;
        if (daysOverdue > 7) return `${daysOverdue} days overdue`;
        if (daysOverdue > 0) return `${daysOverdue} days overdue`;
        if (student.status === 'Due Today') return 'Due Today';
        return 'Due Soon';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="unpaid-students-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading unpaid students...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="unpaid-students-page">
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="unpaid-students-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Unpaid Students</h1>
                    <p className="page-subtitle">Manage students with outstanding balances</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-danger">
                    <div className="stat-icon stat-icon-danger">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Unpaid Students</div>
                        <div className="stat-value">{stats.unpaidCount}</div>
                    </div>
                </div>

                <div className="stat-card stat-card-warning">
                    <div className="stat-icon stat-icon-warning">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Outstanding</div>
                        <div className="stat-value">${stats.totalOutstanding.toLocaleString()}</div>
                    </div>
                </div>

                <div className="stat-card stat-card-info">
                    <div className="stat-icon stat-icon-info">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Overdue (&gt;7 days)</div>
                        <div className="stat-value">{stats.overdueCount}</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-bar">
                <button 
                    className="action-btn reminder-btn" 
                    onClick={handleSendBulkReminder}
                    disabled={actionLoading === 'bulk-reminder' || students.length === 0}
                >
                    {actionLoading === 'bulk-reminder' ? (
                        <span className="btn-loading">Sending...</span>
                    ) : (
                        <>
                            <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Bulk Reminder
                        </>
                    )}
                </button>
                <button 
                    className="action-btn penalties-btn" 
                    onClick={handleApplyLatePenalties}
                    disabled={actionLoading === 'bulk-penalty' || students.filter(s => (s.days_overdue || 0) > 0).length === 0}
                >
                    {actionLoading === 'bulk-penalty' ? (
                        <span className="btn-loading">Applying...</span>
                    ) : (
                        <>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '4px' }}>$</span>
                            Apply Late Penalties
                        </>
                    )}
                </button>
                <button 
                    className="action-btn block-btn" 
                    onClick={handleBlockRegistrations}
                    disabled={actionLoading === 'bulk-block' || students.filter(s => (s.days_overdue || 0) > 7).length === 0}
                >
                    {actionLoading === 'bulk-block' ? (
                        <span className="btn-loading">Blocking...</span>
                    ) : (
                        <>
                            <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Block Registrations
                        </>
                    )}
                </button>
            </div>

            {/* Students Table */}
            <div className="students-section">
                <div className="section-header">
                    <div className="section-title-with-icon">
                        <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="section-title">Students with Outstanding Balances</h2>
                    </div>
                </div>

                <div className="table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Faculty</th>
                                <th>Outstanding</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td className="student-cell">
                                        <div className="student-name">{student.name || student.username || 'Unknown'}</div>
                                        <div className="student-id">{student.student_id || `STD-${String(student.user_id).padStart(3, '0')}`}</div>
                                    </td>
                                    <td className="faculty">{student.faculty || 'Unknown'}</td>
                                    <td className="outstanding-amount">${(student.outstanding || student.dues_balance || 0).toLocaleString()}</td>
                                    <td className="due-date">{formatDate(student.due_date)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(student)}`}>
                                            {formatStatus(student)}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="icon-btn email-btn"
                                            onClick={() => handleSendReminder(student.student_id || `STD-${student.user_id}`)}
                                            disabled={actionLoading === `reminder-${student.student_id || student.user_id}`}
                                            title="Send Reminder"
                                        >
                                            {actionLoading === `reminder-${student.student_id || student.user_id}` ? (
                                                <span className="btn-loading">...</span>
                                            ) : (
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            className="icon-btn penalty-btn"
                                            onClick={() => handleApplyPenalties(student.student_id || `STD-${student.user_id}`)}
                                            disabled={actionLoading === `penalty-${student.student_id || student.user_id}` || student.is_blocked}
                                            title={student.is_blocked ? "Student is already blocked" : "Apply Penalty"}
                                        >
                                            {actionLoading === `penalty-${student.student_id || student.user_id}` ? (
                                                <span className="btn-loading">...</span>
                                            ) : (
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>$</span>
                                            )}
                                        </button>
                                        <button
                                            className="icon-btn block-btn-icon"
                                            onClick={() => handleBlockRegistration(student.student_id || `STD-${student.user_id}`)}
                                            disabled={actionLoading === `block-${student.student_id || student.user_id}` || student.is_blocked}
                                            title={student.is_blocked ? "Student is already blocked" : "Block Registration"}
                                        >
                                            {actionLoading === `block-${student.student_id || student.user_id}` ? (
                                                <span className="btn-loading">...</span>
                                            ) : (
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UnpaidStudents;
