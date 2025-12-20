import React, { useState } from 'react';
import './Reports.css';

const Reports = () => {
    const [reportType, setReportType] = useState('Student Level');
    const [faculty, setFaculty] = useState('All Faculties');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const reportTypes = [
        'Student Level',
        'Faculty Level',
        'University Level',
        'Finance Overview'
    ];

    const faculties = [
        'All Faculties',
        'Engineering',
        'Computer Science',
        'Digital Arts',
        'Business'
    ];

    const predefinedReports = [
        {
            id: 1,
            title: 'Student Level Report',
            description: 'Individual student payment history and outstanding balances',
            icon: 'user',
            iconColor: '#fbbf24'
        },
        {
            id: 2,
            title: 'Faculty Level Report',
            description: 'Aggregated payment data by faculty/department',
            icon: 'building',
            iconColor: '#fbbf24'
        },
        {
            id: 3,
            title: 'University Level Report',
            description: 'Complete university-wide financial overview',
            icon: 'chart',
            iconColor: '#fbbf24'
        },
        {
            id: 4,
            title: 'Finance Overview',
            description: 'Summary of all financial transactions and metrics',
            icon: 'document',
            iconColor: '#fbbf24'
        }
    ];

    const recentReports = [
        {
            id: 1,
            name: 'December 2025 Finance Overview',
            date: 'Dec 10, 2025',
            type: 'Finance Overview'
        },
        {
            id: 2,
            name: 'Engineering Faculty Report Q4',
            date: 'Dec 8, 2025',
            type: 'Faculty Level'
        },
        {
            id: 3,
            name: 'Unpaid Students List',
            date: 'Dec 5, 2025',
            type: 'Student Level'
        },
        {
            id: 4,
            name: 'November 2025 Finance Overview',
            date: 'Nov 30, 2025',
            type: 'Finance Overview'
        }
    ];

    const handleGenerateReport = () => {
        console.log('Generating report:', { reportType, faculty, startDate, endDate });
        alert(`Generating ${reportType} report...`);
    };

    const handleExportAll = () => {
        console.log('Exporting all reports...');
        alert('Exporting all reports...');
    };

    const handleDownloadPDF = (reportId) => {
        console.log('Download PDF:', reportId);
    };

    const handleDownloadExcel = (reportId) => {
        console.log('Download Excel:', reportId);
    };

    const handleDownloadRecentReport = (reportId) => {
        console.log('Download recent report:', reportId);
    };

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'user':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'building':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case 'chart':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
            case 'document':
                return (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="reports-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Generate and export financial reports</p>
                </div>
            </div>

            {/* Predefined Reports Grid */}
            <div className="reports-grid">
                {predefinedReports.map((report) => (
                    <div key={report.id} className="report-card">
                        <div className="report-icon" style={{ color: report.iconColor }}>
                            {getIcon(report.icon)}
                        </div>
                        <div className="report-info">
                            <h3 className="report-title">{report.title}</h3>
                            <p className="report-description">{report.description}</p>
                        </div>
                        <div className="report-actions">
                            <button
                                className="download-btn pdf-btn"
                                onClick={() => handleDownloadPDF(report.id)}
                                title="Download PDF"
                            >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDF
                            </button>
                            <button
                                className="download-btn excel-btn"
                                onClick={() => handleDownloadExcel(report.id)}
                                title="Download Excel"
                            >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Excel
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Report Generator */}
            <div className="custom-report-section">
                <h2 className="section-title">Custom Report Generator</h2>

                <div className="generator-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="form-select"
                            >
                                {reportTypes.map((type, index) => (
                                    <option key={index} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Faculty</label>
                            <select
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                className="form-select"
                            >
                                {faculties.map((fac, index) => (
                                    <option key={index} value={fac}>
                                        {fac}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="form-input"
                                placeholder="mm/dd/yyyy"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="form-input"
                                placeholder="mm/dd/yyyy"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="generate-btn" onClick={handleGenerateReport}>
                            Generate Report
                        </button>
                        <button className="export-all-btn" onClick={handleExportAll}>
                            <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export All
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="recent-reports-section">
                <h2 className="section-title">Recent Reports</h2>

                <div className="recent-reports-list">
                    {recentReports.map((report) => (
                        <div key={report.id} className="recent-report-item">
                            <div className="report-icon-small">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="report-details">
                                <div className="report-name">{report.name}</div>
                                <div className="report-meta">{report.date}</div>
                            </div>
                            <button
                                className="download-icon-btn"
                                onClick={() => handleDownloadRecentReport(report.id)}
                                title="Download"
                            >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reports;
