import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FinanceDashboard.css';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCollected: 2400000,
    totalCollectedChange: 12.5,
    pendingPayments: 340000,
    pendingPaymentsChange: -8.2,
    totalStudents: 2847,
    totalStudentsChange: 5.3,
    unpaidStudents: 156,
    unpaidStudentsChange: -3.1
  });

  const [facultyPayments, setFacultyPayments] = useState([
    { name: 'Engineering', collected: 850000, total: 1000000, color: '#10b981' },
    { name: 'Computer Science', collected: 620000, total: 750000, color: '#fbbf24' },
    { name: 'Digital Arts', collected: 280000, total: 400000, color: '#3b82f6' },
    { name: 'Business Informatics', collected: 450000, total: 500000, color: '#10b981' }
  ]);

  const [bankReconciliation, setBankReconciliation] = useState([
    { id: 1, amount: 5200, status: 'Matched', date: 'Today', statusColor: '#10b981' },
    { id: 2, amount: 3100, status: 'Pending', date: 'Yesterday', statusColor: '#fbbf24' },
    { id: 3, amount: 1850, status: 'Unmatched', date: 'Dec 8', statusColor: '#ef4444' },
    { id: 4, amount: 7400, status: 'Matched', date: 'Dec 7', statusColor: '#10b981' }
  ]);

  const [recentPayments, setRecentPayments] = useState([
    { id: 'STD-001', name: 'John Smith', faculty: 'Engineering', amount: 2916, date: 'Dec 10, 2025', status: 'Paid' },
    { id: 'STD-002', name: 'Sarah Johnson', faculty: 'Computer Science', amount: 3125, date: 'Dec 10, 2025', status: 'Paid' },
    { id: 'STD-003', name: 'Michael Brown', faculty: 'Digital Arts', amount: 2500, date: 'Dec 9, 2025', status: 'Pending' },
    { id: 'STD-004', name: 'Emily Davis', faculty: 'Business', amount: 2750, date: 'Dec 9, 2025', status: 'Paid' },
    { id: 'STD-005', name: 'James Wilson', faculty: 'Engineering', amount: 2916, date: 'Dec 8, 2025', status: 'Failed' }
  ]);

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

  return (
    <div className="finance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Finance Dashboard</h1>
          <p className="dashboard-subtitle">Overview of university tuition payments</p>
        </div>
        <button className="generate-report-btn">
          <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Report
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
            {facultyPayments.map((faculty, index) => (
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
                      width: `${(faculty.collected / faculty.total) * 100}%`,
                      backgroundColor: faculty.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
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
            {bankReconciliation.map((transaction) => (
              <div key={transaction.id} className="bank-transaction-item">
                <div className="transaction-status-badge" style={{ backgroundColor: transaction.statusColor }}>
                  {transaction.status}
                </div>
                <div className="transaction-amount">${transaction.amount.toLocaleString()}</div>
                <div className="transaction-date">{transaction.date}</div>
              </div>
            ))}
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
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="student-id">{payment.id}</td>
                  <td className="student-name">{payment.name}</td>
                  <td className="faculty-name">{payment.faculty}</td>
                  <td className="amount">${payment.amount.toLocaleString()}</td>
                  <td className="date">{payment.date}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(payment.status)}`}>
                      {payment.status}
                    </span>
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

export default FinanceDashboard;
