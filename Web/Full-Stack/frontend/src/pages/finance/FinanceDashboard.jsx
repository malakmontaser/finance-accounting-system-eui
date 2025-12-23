import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeService } from '../../services/api-routes/dashboard-routes';
import './FinanceDashboard.css';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Stats state - all values come from APIs
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalCollectedChange: 0,
    totalStudents: 0,
    totalStudentsChange: 0,
    pendingPayments: 0,
    pendingPaymentsChange: 0,
    unpaidStudents: 0,
    unpaidStudentsChange: 0
  });

  // Faculty payments - from /api/finance/payments/by-faculty
  const [facultyPayments, setFacultyPayments] = useState([]);

  // Bank reconciliation - from /api/finance/bank-reconciliation
  const [bankReconciliation, setBankReconciliation] = useState([]);

  // Recent payments - from /api/finance/payments/recent
  const [recentPayments, setRecentPayments] = useState([]);

  // ============================================================================
  // ✅ FETCH DATA FROM APIs
  // ============================================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // ✅ Fetch all dashboard data in parallel
        const [summaryData, duesData, recentPaymentsData, facultyPaymentsData, bankData] = await Promise.all([
          financeService.getSummary(),           // ✅ New API
          financeService.getDues(),               // ✅ Existing API
          financeService.getRecentPayments({ limit: 5 }),  // ✅ New API
          financeService.getPaymentsByFaculty(),  // ✅ New API
          financeService.getBankReconciliation({ limit: 4 })  // ✅ Bank Reconciliation API
        ]);
        
        // Update stats from summary API
        setStats({
          totalCollected: summaryData.total_collected || 0,
          totalCollectedChange: summaryData.total_collected_change || 0,
          totalStudents: summaryData.total_students || 0,
          totalStudentsChange: summaryData.total_students_change || 0,
          pendingPayments: summaryData.pending_payments || 0,
          pendingPaymentsChange: summaryData.pending_payments_change || 0,
          unpaidStudents: summaryData.unpaid_students || 0,
          unpaidStudentsChange: summaryData.unpaid_students_change || 0,
        });

        // Update recent payments
        if (recentPaymentsData.payments) {
          setRecentPayments(recentPaymentsData.payments);
        }

        // Update faculty payments
        if (facultyPaymentsData.faculties) {
          setFacultyPayments(facultyPaymentsData.faculties);
        }

        // Update bank reconciliation
        if (bankData && bankData.transactions && bankData.transactions.length > 0) {
          // Format bank transactions for display
          const formattedTransactions = bankData.transactions.map(txn => ({
            id: txn.id,
            amount: txn.amount,
            status: txn.status,
            date: formatRelativeDate(txn.date),
            statusColor: getStatusColor(txn.status),
            bank_ref: txn.bank_ref,
            student_id: txn.student_id,
            student_name: txn.student_name
          }));
          setBankReconciliation(formattedTransactions);
        } else {
          // Set empty array if no transactions (normal if database is empty)
          setBankReconciliation([]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format relative dates
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched':
        return '#10b981';
      case 'pending':
        return '#fbbf24';
      case 'unmatched':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  // ============================================================================
  // ✅ GENERATE REPORT - Connected to /api/finance/unpaid-report
  // ============================================================================
  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const reportData = await financeService.getUnpaidReport();
      
      // Create downloadable report
      const reportContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([reportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unpaid-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Report generated successfully!');
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="finance-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="finance-dashboard">
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
    <div className="finance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Finance Dashboard</h1>
          <p className="dashboard-subtitle">Overview of university tuition payments</p>
        </div>
        <button 
          className="generate-report-btn" 
          onClick={handleGenerateReport}
          disabled={reportLoading}
        >
          {reportLoading ? (
            <>
              <div className="btn-spinner"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Collected</span>
            <div className="stat-value">{formatCurrency(stats.totalCollected)}</div>
            <div className="stat-change stat-change-positive">
              <svg className="change-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +{stats.totalCollectedChange}%
            </div>
          </div>
          <div className="stat-icon stat-icon-green">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Pending Payments</span>
            <div className="stat-value">{formatCurrency(stats.pendingPayments)}</div>
            <div className="stat-change stat-change-negative">
              <svg className="change-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              {stats.pendingPaymentsChange}%
            </div>
          </div>
          <div className="stat-icon stat-icon-orange">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <div className="stat-value">{stats.totalStudents.toLocaleString()}</div>
            <div className="stat-change stat-change-positive">
              <svg className="change-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +{stats.totalStudentsChange}%
            </div>
          </div>
          <div className="stat-icon stat-icon-teal">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Unpaid Students</span>
            <div className="stat-value">{stats.unpaidStudents}</div>
            <div className="stat-change stat-change-negative">
              <svg className="change-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              {stats.unpaidStudentsChange}%
            </div>
          </div>
          <div className="stat-icon stat-icon-red">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Payments by Faculty */}
        <div className="content-card faculty-payments-card">
          <h2 className="card-title">Payments by Faculty</h2>
          <div className="faculty-payments-list">
            {facultyPayments.length > 0 ? (
              facultyPayments.map((faculty, index) => (
                <div key={index} className="faculty-payment-item">
                  <div className="faculty-info">
                    <span className="faculty-name">{faculty.name}</span>
                    <span className="faculty-amount">
                      {formatCurrency(faculty.collected)} / {formatCurrency(faculty.total)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${faculty.total > 0 ? (faculty.collected / faculty.total) * 100 : 0}%`,
                        backgroundColor: faculty.color
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No faculty payment data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Reconciliation */}
        <div className="content-card bank-reconciliation-card">
          <div className="card-header-with-icon">
            <svg className="card-header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="card-title">Bank Reconciliation</h2>
          </div>
          <div className="bank-reconciliation-list">
            {bankReconciliation.length > 0 ? (
              bankReconciliation.map((transaction) => (
                <div key={transaction.id} className="bank-transaction-item">
                  <div className="transaction-status-badge" style={{ backgroundColor: transaction.statusColor }}>
                    {transaction.status}
                  </div>
                  <div className="transaction-amount">${transaction.amount.toLocaleString()}</div>
                  <div className="transaction-date">{transaction.date}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No bank transactions available.</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Sync bank data to get started with reconciliation.
                </p>
              </div>
            )}
          </div>
          <button
            className="view-all-btn"
            onClick={() => navigate('/finance/bank-reconciliation#transactions')}
          >
            View All Transactions
          </button>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="content-card recent-payments-card">
        <h2 className="card-title">Recent Payments</h2>
        <div className="table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Faculty</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length > 0 ? (
                recentPayments.map((payment, index) => (
                  <tr key={payment.payment_id || payment.id || `payment-${index}`}>
                    <td className="student-id">{payment.id || `STD-${String(payment.student_id).padStart(3, '0')}`}</td>
                    <td className="student-name">{payment.student_name || payment.name || 'Unknown'}</td>
                    <td className="faculty-name">{payment.faculty || 'Unknown'}</td>
                    <td className="amount">${(payment.amount || 0).toLocaleString()}</td>
                    <td className="date">{payment.date || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(payment.status)}`}>
                        {payment.status || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state-cell">
                    <div className="empty-state">
                      <p>No recent payments found</p>
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

export default FinanceDashboard;
