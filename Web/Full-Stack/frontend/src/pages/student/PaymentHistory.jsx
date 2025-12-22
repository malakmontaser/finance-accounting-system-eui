import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import studentService from '../../services/studentService';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const data = await studentService.getPaymentHistory();
      setPayments(data.payments || []);
    } catch (err) {
      setError('Failed to load payment history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getTotalTransactions = () => {
    return payments.length;
  };

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    
    // Map filter values to backend status values
    const statusMap = {
      'paid': 'RECEIVED',
      'pending': 'PENDING',
      'failed': 'FAILED'
    };
    
    const targetStatus = statusMap[filter.toLowerCase()] || filter.toUpperCase();
    return payments.filter(p => p.status.toUpperCase() === targetStatus);
  };

  const handleViewReceipt = (payment) => {
    // Navigate to receipt page with standardized payment data
    navigate('/student/receipt', {
      state: {
        payment: {
            ...payment,
            initiatedAt: payment.payment_date, // Backend provides this as ISO string
            paymentMethod: payment.payment_method === 'ONLINE' ? 'card' : 'bank',
            cardLast4: payment.reference_number?.slice(-4) || '****',
            isPending: payment.status === 'PENDING',
            remaining_dues: payment.remaining_dues || 0,
            payment_id: payment.id
        }
      }
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading payment history...</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredPayments = getFilteredPayments();

  const handleExport = () => {
    // Basic CSV export
    const headers = ['Transaction ID', 'Date', 'Amount', 'Method', 'Status'];
    const rows = filteredPayments.map(p => {
      const dateStr = new Date(p.payment_date).toLocaleDateString('en-US');
      const method = p.payment_method === 'ONLINE' ? 'Credit Card' : 
                     p.payment_method === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Manual / Cash';
      return [
        `TXN-${p.id.toString().padStart(6, '0')}`,
        dateStr,
        `$${p.amount}`,
        method,
        p.status
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payment_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="payment-history-container">
        {/* Page Header */}
        <div className="history-page-header">
          <div>
            <h1 className="history-page-title">Payment History</h1>
            <p className="history-page-subtitle">View all your past transactions</p>
          </div>
          <button className="export-btn" onClick={handleExport}>
            <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Paid</div>
            <div className="stat-value total-paid">${calculateTotalPaid().toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{getTotalTransactions()}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            Paid
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
        </div>

        {/* Transaction History Table */}
        <div className="transaction-section">
          <div className="section-header">
            <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="section-title">Transaction History</h2>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>No Transactions Found</h3>
              <p>You haven't made any payments yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="transaction-id">TXN-{payment.id.toString().padStart(6, '0')}</td>
                      <td>
                        {new Date(payment.payment_date.endsWith('Z') ? payment.payment_date : payment.payment_date + 'Z').toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="amount">${payment.amount.toLocaleString()}</td>
                      <td>
                        {payment.payment_method === 'ONLINE' ? 'Credit Card' : 
                         payment.payment_method === 'BANK_TRANSFER' ? 'Bank Transfer' : 
                         'Manual / Cash'}
                      </td>
                      <td>
                        <span className={`status-badge ${payment.status.toLowerCase()}`}>
                          {payment.status === 'RECEIVED' ? 'Paid' : payment.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn view-btn"
                          onClick={() => handleViewReceipt(payment)}
                          title="View Receipt"
                        >
                          <svg className="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;
