import React, { useState } from 'react';
import './UnpaidStudents.css';

const UnpaidStudents = () => {
    const [students, setStudents] = useState([
        {
            id: 1,
            name: 'James Wilson',
            studentId: 'STD-005',
            faculty: 'Engineering',
            outstanding: 12500,
            dueDate: 'Dec 15, 2025',
            daysOverdue: 0,
            status: 'Due Today'
        },
        {
            id: 2,
            name: 'Jennifer Martinez',
            studentId: 'STD-008',
            faculty: 'Business',
            outstanding: 11200,
            dueDate: 'Dec 10, 2025',
            daysOverdue: 1,
            status: '1 days overdue'
        },
        {
            id: 3,
            name: 'David Chen',
            studentId: 'STD-012',
            faculty: 'Computer Science',
            outstanding: 8500,
            dueDate: 'Nov 30, 2025',
            daysOverdue: 11,
            status: '11 days overdue'
        },
        {
            id: 4,
            name: 'Lisa Anderson',
            studentId: 'STD-006',
            faculty: 'Digital Arts',
            outstanding: 5900,
            dueDate: 'Dec 18, 2025',
            daysOverdue: 0,
            status: 'Due Soon'
        },
        {
            id: 5,
            name: 'Robert Taylor',
            studentId: 'STD-015',
            faculty: 'Engineering',
            outstanding: 9300,
            dueDate: 'Dec 5, 2025',
            daysOverdue: 6,
            status: '6 days overdue'
        }
    ]);

    const stats = {
        unpaidCount: students.length,
        totalOutstanding: students.reduce((sum, s) => sum + s.outstanding, 0),
        overdueCount: students.filter(s => s.daysOverdue > 7).length
    };

    const handleSendReminder = (studentId) => {
        console.log('Send reminder to:', studentId);
        alert(`Reminder sent to student ${studentId}`);
    };

    const handleApplyPenalties = (studentId) => {
        console.log('Apply penalties to:', studentId);
        alert(`Late penalties applied to student ${studentId}`);
    };

    const handleBlockRegistration = (studentId) => {
        console.log('Block registration for:', studentId);
        if (window.confirm('Are you sure you want to block registration for this student?')) {
            alert(`Registration blocked for student ${studentId}`);
        }
    };

    const handleSendBulkReminder = () => {
        console.log('Sending bulk reminders...');
        alert(`Sending reminders to ${students.length} students`);
    };

    const handleApplyLatePenalties = () => {
        const overdueStudents = students.filter(s => s.daysOverdue > 0);
        console.log('Applying late penalties...');
        alert(`Applying late penalties to ${overdueStudents.length} overdue students`);
    };

    const handleBlockRegistrations = () => {
        const severelyOverdue = students.filter(s => s.daysOverdue > 7);
        if (window.confirm(`Block registration for ${severelyOverdue.length} students with overdue payments?`)) {
            console.log('Blocking registrations...');
            alert(`Registration blocked for ${severelyOverdue.length} students`);
        }
    };

    const getStatusClass = (student) => {
        if (student.daysOverdue > 7) return 'status-severe-overdue';
        if (student.daysOverdue > 0) return 'status-overdue';
        if (student.status === 'Due Today') return 'status-due-today';
        return 'status-due-soon';
    };

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
                <button className="action-btn reminder-btn" onClick={handleSendBulkReminder}>
                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Bulk Reminder
                </button>
                <button className="action-btn penalties-btn" onClick={handleApplyLatePenalties}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '4px' }}>$</span>
                    Apply Late Penalties
                </button>
                <button className="action-btn block-btn" onClick={handleBlockRegistrations}>
                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Block Registrations
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
                                        <div className="student-name">{student.name}</div>
                                        <div className="student-id">{student.studentId}</div>
                                    </td>
                                    <td className="faculty">{student.faculty}</td>
                                    <td className="outstanding-amount">${student.outstanding.toLocaleString()}</td>
                                    <td className="due-date">{student.dueDate}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(student)}`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="icon-btn email-btn"
                                            onClick={() => handleSendReminder(student.studentId)}
                                            title="Send Reminder"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="icon-btn penalty-btn"
                                            onClick={() => handleApplyPenalties(student.studentId)}
                                            title="Apply Penalty"
                                        >
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>$</span>
                                        </button>
                                        <button
                                            className="icon-btn block-btn-icon"
                                            onClick={() => handleBlockRegistration(student.studentId)}
                                            title="Block Registration"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
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
