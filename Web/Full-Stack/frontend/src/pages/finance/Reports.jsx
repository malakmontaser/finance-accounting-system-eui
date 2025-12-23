import React, { useState, useEffect, useCallback } from 'react';
import { reportsService } from '../../services/api-routes/reports-routes';
import './Reports.css';

const Reports = () => {
    const [reportType, setReportType] = useState('Student Level');
    const [faculty, setFaculty] = useState('All Faculties');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Loading states
    const [loading, setLoading] = useState(false);
    const [downloadingReport, setDownloadingReport] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [loadingReportTypes, setLoadingReportTypes] = useState(true);
    const [loadingRecentReports, setLoadingRecentReports] = useState(true);
    const [error, setError] = useState(null);

    // Report data states
    const [reportTypes, setReportTypes] = useState([]);
    const [faculties, setFaculties] = useState(['All Faculties']);
    const [predefinedReports, setPredefinedReports] = useState([]);
    const [recentReports, setRecentReports] = useState([]);

    // ============================================================================
    // ✅ FETCH REPORT TYPES AND FACULTIES ON MOUNT
    // ============================================================================
    useEffect(() => {
        const fetchReportTypes = async () => {
            try {
                setLoadingReportTypes(true);
                const data = await reportsService.getReportTypes();
                
                // Set report types
                const types = data.report_types.map(rt => ({
                    id: rt.id,
                    type: rt.id,
                    title: rt.name,
                    description: rt.description,
                    icon: rt.icon,
                    iconColor: '#fbbf24',
                    available: true  // ✅ All APIs are now available
                }));
                setPredefinedReports(types);
                
                // Set report type options for dropdown
                setReportTypes(data.report_types.map(rt => rt.name));
                
                // Set faculties
                if (data.faculties && data.faculties.length > 0) {
                    setFaculties(data.faculties);
                }
            } catch (err) {
                console.error('Error fetching report types:', err);
                setError('Failed to load report types. Please refresh the page.');
            } finally {
                setLoadingReportTypes(false);
            }
        };

        fetchReportTypes();
    }, []);

    // ============================================================================
    // ✅ FETCH RECENT REPORTS ON MOUNT
    // ============================================================================
    useEffect(() => {
        const fetchRecentReports = async () => {
            try {
                setLoadingRecentReports(true);
                const data = await reportsService.getReportHistory({ limit: 10 });
                
                if (data.reports) {
                    const formattedReports = data.reports.map(report => ({
                        id: report.id,
                        name: report.name,
                        date: new Date(report.generated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        type: report.report_type_display || report.report_type,
                        report_type: report.report_type,
                        available_formats: report.available_formats || []
                    }));
                    setRecentReports(formattedReports);
                }
            } catch (err) {
                console.error('Error fetching recent reports:', err);
                // Don't show error for recent reports, just log it
            } finally {
                setLoadingRecentReports(false);
            }
        };

        fetchRecentReports();
    }, []);

    // ============================================================================
    // ✅ HELPER: Download JSON as file
    // ============================================================================
    const downloadAsJSON = (data, filename) => {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ============================================================================
    // ✅ HELPER: Convert JSON to CSV and download
    // ============================================================================
    const downloadAsCSV = (data, filename) => {
        let csvContent = '';
        
        if (data.students && Array.isArray(data.students)) {
            // Header
            csvContent = 'Student ID,Username,Email,Dues Balance,Total Enrollments,Last Payment Date\n';
            // Data rows
            data.students.forEach(student => {
                csvContent += `${student.user_id},"${student.username}","${student.email}",${student.dues_balance},${student.total_enrollments || 0},${student.last_payment_date || 'N/A'}\n`;
            });
        } else if (data.detailed_report && Array.isArray(data.detailed_report)) {
            // Header for detailed report
            csvContent = 'Student ID,Username,Email,Dues Balance,Status\n';
            data.detailed_report.forEach(student => {
                const status = student.dues_balance > 5000 ? 'Critical' : student.dues_balance >= 1000 ? 'Moderate' : 'Low';
                csvContent += `${student.user_id},"${student.username}","${student.email}",${student.dues_balance},${status}\n`;
            });
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ============================================================================
    // ✅ CONNECTED: Generate Report using new API
    // ============================================================================
    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        setError(null);
        
        try {
            // Map report type name to API format
            const reportTypeMap = {
                'Student Level': 'student_level',
                'Faculty Level': 'faculty_level',
                'University Level': 'university_level',
                'Finance Overview': 'finance_overview'
            };
            
            const reportTypeId = reportTypeMap[reportType] || 'student_level';
            
            // Call the generate report API
            const reportData = await reportsService.generateReport({
                report_type: reportTypeId,
                faculty: faculty === 'All Faculties' ? null : faculty,
                start_date: startDate || null,
                end_date: endDate || null,
                format: 'json',
                save_to_history: true
            });
            
            // Download as JSON
            const filename = `${reportTypeId}-report-${new Date().toISOString().split('T')[0]}.json`;
            downloadAsJSON(reportData, filename);
            
            // Refresh recent reports
            const historyData = await reportsService.getReportHistory({ limit: 10 });
            if (historyData.reports) {
                const formattedReports = historyData.reports.map(report => ({
                    id: report.id,
                    name: report.name,
                    date: new Date(report.generated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }),
                    type: report.report_type_display || report.report_type,
                    report_type: report.report_type,
                    available_formats: report.available_formats || []
                }));
                setRecentReports(formattedReports);
            }
            
            alert(`${reportType} report generated successfully!`);
        } catch (error) {
            console.error('Error generating report:', error);
            setError('Failed to generate report. Please try again.');
            alert('Failed to generate report. Please try again.');
        } finally {
            setGeneratingReport(false);
        }
    };

    // ============================================================================
    // ✅ CONNECTED: Download Predefined Report using new API
    // ============================================================================
    const handleDownloadPDF = async (reportId) => {
        const report = predefinedReports.find(r => r.id === reportId);
        if (!report) return;

        setDownloadingReport(`pdf-${reportId}`);
        
        try {
            // Generate report with PDF format
            const reportData = await reportsService.generateReport({
                report_type: report.type,
                faculty: faculty === 'All Faculties' ? null : faculty,
                start_date: startDate || null,
                end_date: endDate || null,
                format: 'pdf',
                save_to_history: false
            });
            
            // For now, PDF generation returns JSON (placeholder)
            // In production, this would download actual PDF
            if (reportData.download_url) {
                // Try to download from URL
                try {
                    await reportsService.downloadAndSaveReport(reportData.report_id, 'pdf');
                    alert('Report downloaded successfully!');
                } catch (downloadError) {
                    // Fallback to JSON download
                    const filename = `${report.type}-report-${new Date().toISOString().split('T')[0]}.json`;
                    downloadAsJSON(reportData, filename);
                    alert('Report downloaded successfully! (JSON format - PDF generation coming soon)');
                }
            } else {
                // If JSON format was returned, download as JSON
                const filename = `${report.type}-report-${new Date().toISOString().split('T')[0]}.json`;
                downloadAsJSON(reportData, filename);
                alert('Report downloaded successfully! (JSON format)');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report. Please try again.');
        } finally {
            setDownloadingReport(null);
        }
    };

    const handleDownloadExcel = async (reportId) => {
        const report = predefinedReports.find(r => r.id === reportId);
        if (!report) return;

        setDownloadingReport(`excel-${reportId}`);
        
        try {
            // Generate report with Excel format
            const reportData = await reportsService.generateReport({
                report_type: report.type,
                faculty: faculty === 'All Faculties' ? null : faculty,
                start_date: startDate || null,
                end_date: endDate || null,
                format: 'excel',
                save_to_history: false
            });
            
            // For now, Excel generation returns JSON (placeholder)
            // In production, this would download actual Excel
            if (reportData.download_url) {
                // Try to download from URL
                try {
                    await reportsService.downloadAndSaveReport(reportData.report_id, 'excel');
                    alert('Report downloaded successfully!');
                } catch (downloadError) {
                    // Fallback: convert data to CSV if it's student level
                    if (report.type === 'student_level' && reportData.data) {
                        const filename = `${report.type}-report-${new Date().toISOString().split('T')[0]}.csv`;
                        downloadAsCSV(reportData.data, filename);
                        alert('Report downloaded successfully! (CSV format - Excel generation coming soon)');
                    } else {
                        const filename = `${report.type}-report-${new Date().toISOString().split('T')[0]}.json`;
                        downloadAsJSON(reportData, filename);
                        alert('Report downloaded successfully! (JSON format - Excel generation coming soon)');
                    }
                }
            } else {
                // If JSON format was returned, try to convert to CSV for student level
                if (report.type === 'student_level' && reportData.data) {
                    const filename = `${report.type}-report-${new Date().toISOString().split('T')[0]}.csv`;
                    downloadAsCSV(reportData.data, filename);
                    alert('Report downloaded successfully! (CSV format)');
                } else {
                    const filename = `${report.type}-report-${new Date().toISOString().split('T')[0]}.json`;
                    downloadAsJSON(reportData, filename);
                    alert('Report downloaded successfully! (JSON format)');
                }
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report. Please try again.');
        } finally {
            setDownloadingReport(null);
        }
    };

    // ============================================================================
    // ✅ CONNECTED: Export All (Student Level data)
    // ============================================================================
    const handleExportAll = async () => {
        setLoading(true);
        
        try {
            // ✅ Export all available data from existing APIs
            const data = await reportsService.getStudentLevelReportData();
            
            const exportData = {
                export_name: 'All Financial Data Export',
                exported_at: new Date().toISOString(),
                unpaid_report: data.unpaid,
                status_report: data.status,
                dues_summary: data.dues
            };
            
            const filename = `finance-export-${new Date().toISOString().split('T')[0]}.json`;
            downloadAsJSON(exportData, filename);
            
            alert('All available data exported successfully!');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // ✅ CONNECTED: Download Recent Report
    // ============================================================================
    const handleDownloadRecentReport = async (reportId) => {
        try {
            // Download as JSON (default format that's always available)
            await reportsService.downloadAndSaveReport(reportId, 'json');
            alert('Report downloaded successfully!');
        } catch (error) {
            console.error('Error downloading recent report:', error);
            // Try PDF as fallback
            try {
                await reportsService.downloadAndSaveReport(reportId, 'pdf');
                alert('Report downloaded successfully!');
            } catch (pdfError) {
                alert('Failed to download report. The report may have expired or is not available.');
            }
        }
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

            {/* Error Message */}
            {error && (
                <div className="error-message" style={{ 
                    padding: '1rem', 
                    margin: '1rem 0', 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    borderRadius: '0.5rem' 
                }}>
                    {error}
                </div>
            )}

            {/* Predefined Reports Grid */}
            <div className="reports-grid">
                {loadingReportTypes ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading report types...</div>
                ) : (
                    predefinedReports.map((report) => (
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
                                className={`download-btn pdf-btn ${!report.available ? 'btn-disabled' : ''}`}
                                onClick={() => handleDownloadPDF(report.id)}
                                disabled={downloadingReport === `pdf-${report.id}`}
                                title={report.available ? "Download PDF" : "Coming soon"}
                            >
                                {downloadingReport === `pdf-${report.id}` ? (
                                    <span className="btn-loading">...</span>
                                ) : (
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )}
                                {report.available ? 'JSON' : 'PDF'}
                            </button>
                            <button
                                className={`download-btn excel-btn ${!report.available ? 'btn-disabled' : ''}`}
                                onClick={() => handleDownloadExcel(report.id)}
                                disabled={downloadingReport === `excel-${report.id}`}
                                title={report.available ? "Download Excel/CSV" : "Coming soon"}
                            >
                                {downloadingReport === `excel-${report.id}` ? (
                                    <span className="btn-loading">...</span>
                                ) : (
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )}
                                {report.available ? 'CSV' : 'Excel'}
                            </button>
                            {!report.available && (
                                <span className="coming-soon-badge">Coming Soon</span>
                            )}
                        </div>
                    </div>
                    ))
                )}
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
                                disabled={loadingReportTypes}
                            >
                                {loadingReportTypes ? (
                                    <option>Loading...</option>
                                ) : (
                                    reportTypes.map((type, index) => (
                                        <option key={index} value={type}>
                                            {type}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Faculty</label>
                            <select
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                className="form-select"
                                disabled={loadingReportTypes}
                            >
                                {loadingReportTypes ? (
                                    <option>Loading...</option>
                                ) : (
                                    faculties.map((fac, index) => (
                                        <option key={index} value={fac}>
                                            {fac}
                                        </option>
                                    ))
                                )}
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
                        <button 
                            className="generate-btn" 
                            onClick={handleGenerateReport}
                            disabled={generatingReport}
                        >
                            {generatingReport ? 'Generating...' : 'Generate Report'}
                        </button>
                        <button 
                            className="export-all-btn" 
                            onClick={handleExportAll}
                            disabled={loading}
                        >
                            {loading ? (
                                'Exporting...'
                            ) : (
                                <>
                                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export All
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="recent-reports-section">
                <h2 className="section-title">Recent Reports</h2>

                <div className="recent-reports-list">
                    {loadingRecentReports ? (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>Loading recent reports...</div>
                    ) : recentReports.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                            No recent reports. Generate a report to see it here.
                        </div>
                    ) : (
                        recentReports.map((report) => (
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
