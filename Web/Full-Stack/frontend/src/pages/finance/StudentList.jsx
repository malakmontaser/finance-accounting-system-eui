import React, { useState } from 'react';
import './StudentList.css';

const StudentList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('all');

    const [students, setStudents] = useState([
        {
            id: 'STD-001',
            name: 'John Smith',
            email: 'john.s@uni.edu',
            faculty: 'Engineering',
            totalFees: 12500,
            paid: 12500,
            status: 'Paid'
        },
        {
            id: 'STD-002',
            name: 'Sarah Johnson',
            email: 'sarah.j@uni.edu',
            faculty: 'Computer Science',
            totalFees: 11800,
            paid: 11800,
            status: 'Paid'
        },
        {
            id: 'STD-003',
            name: 'Michael Brown',
            email: 'michael.b@uni.edu',
            faculty: 'Digital Arts',
            totalFees: 10500,
            paid: 7500,
            status: 'Pending'
        },
        {
            id: 'STD-004',
            name: 'Emily Davis',
            email: 'emily.d@uni.edu',
            faculty: 'Business',
            totalFees: 11200,
            paid: 11200,
            status: 'Paid'
        },
        {
            id: 'STD-005',
            name: 'James Wilson',
            email: 'james.w@uni.edu',
            faculty: 'Engineering',
            totalFees: 12500,
            paid: 0,
            status: 'Unpaid'
        },
        {
            id: 'STD-006',
            name: 'Lisa Anderson',
            email: 'lisa.a@uni.edu',
            faculty: 'Computer Science',
            totalFees: 11800,
            paid: 5900,
            status: 'Pending'
        },
        {
            id: 'STD-007',
            name: 'David Martinez',
            email: 'david.m@uni.edu',
            faculty: 'Engineering',
            totalFees: 12500,
            paid: 12500,
            status: 'Paid'
        },
        {
            id: 'STD-008',
            name: 'Jennifer Taylor',
            email: 'jennifer.t@uni.edu',
            faculty: 'Digital Arts',
            totalFees: 10500,
            paid: 0,
            status: 'Unpaid'
        }
    ]);

    const faculties = ['All Faculties', 'Engineering', 'Computer Science', 'Digital Arts', 'Business'];

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFaculty = selectedFaculty === 'all' ||
            selectedFaculty === 'All Faculties' ||
            student.faculty === selectedFaculty;
        return matchesSearch && matchesFaculty;
    });

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

    const handleViewStudent = (studentId) => {
        console.log('View student:', studentId);
        // Navigate to student details or open modal
    };

    const handleMoreActions = (studentId) => {
        console.log('More actions for:', studentId);
        // Show dropdown menu with more options
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
                        <option key={index} value={faculty}>
                            {faculty}
                        </option>
                    ))}
                </select>
            </div>

            {/* Students Table */}
            <div className="students-section">
                <div className="section-header">
                    <div className="section-title-with-icon">
                        <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h2 className="section-title">Students ({filteredStudents.length})</h2>
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
                            {filteredStudents.map((student) => (
                                <tr key={student.id}>
                                    <td className="student-id">{student.id}</td>
                                    <td className="student-name-cell">
                                        <div className="student-name">{student.name}</div>
                                        <div className="student-email">{student.email}</div>
                                    </td>
                                    <td className="faculty">{student.faculty}</td>
                                    <td className="amount">${student.totalFees.toLocaleString()}</td>
                                    <td className="amount">${student.paid.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(student.status)}`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => handleViewStudent(student.id)}
                                            title="View Details"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span>View</span>
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
                            ))}
                        </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                        <div className="no-results">
                            <svg className="no-results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="no-results-text">No students found</p>
                            <p className="no-results-subtext">Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentList;
