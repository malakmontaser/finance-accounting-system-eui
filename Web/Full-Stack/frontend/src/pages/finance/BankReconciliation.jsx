import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './BankReconciliation.css';
import bankReconciliationService from '../../services/api-routes/bank-reconciliation-routes/bankReconciliationService';

const BankReconciliation = () => {
    const location = useLocation();
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        matched: 0,
        unmatched: 0,
        pending: 0,
        total_amount: 0
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState(null);
    const [matchingTransaction, setMatchingTransaction] = useState(null);
    const [suggestions, setSuggestions] = useState(null);

    useEffect(() => {
        if (location.hash === '#transactions') {
            const element = document.getElementById('transactions');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    // Fetch bank reconciliation data
    const fetchBankReconciliation = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (filterStatus !== 'all') {
                params.status = filterStatus;
            }
            const data = await bankReconciliationService.getBankReconciliation(params);
            
            setTransactions(data.transactions || []);
            setSummary(data.summary || {
                total: 0,
                matched: 0,
                unmatched: 0,
                pending: 0,
                total_amount: 0
            });
        } catch (err) {
            console.error('Error fetching bank reconciliation:', err);
            setError('Failed to load bank transactions. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchBankReconciliation();
    }, [fetchBankReconciliation]);

    const filteredTransactions = transactions;

    const getStatusClass = (status) => {
        if (status === 'Matched') return 'status-matched';
        if (status === 'Unmatched') return 'status-unmatched';
        return 'status-pending';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleSyncBankData = async () => {
        // For now, show a prompt for manual entry
        const bankRef = prompt('Enter Bank Reference:');
        if (!bankRef) return;
        
        const amount = parseFloat(prompt('Enter Amount:'));
        if (!amount || isNaN(amount)) {
            alert('Invalid amount');
            return;
        }
        
        const dateStr = prompt('Enter Date (YYYY-MM-DD):');
        if (!dateStr) return;
        
        const description = prompt('Enter Description (optional):') || '';
        
        try {
            setSyncing(true);
            const result = await bankReconciliationService.syncBankData({
                source: 'manual',
                transactions: [{
                    bank_ref: bankRef,
                    amount: amount,
                    date: dateStr,
                    description: description
                }]
            });
            
            alert(`Bank data synced successfully!\nImported: ${result.imported_count}\nAuto-matched: ${result.auto_matched}\nUnmatched: ${result.unmatched}`);
            fetchBankReconciliation();
        } catch (err) {
            console.error('Error syncing bank data:', err);
            alert('Failed to sync bank data. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    const handleViewTransaction = async (transactionId) => {
        try {
            const data = await bankReconciliationService.getTransactionDetails(transactionId);
            setViewingTransaction(data);
            
            // Show details in alert (can be replaced with modal)
            let message = `Transaction Details:\n\n`;
            message += `Bank Ref: ${data.transaction.bank_ref}\n`;
            message += `Amount: $${data.transaction.amount}\n`;
            message += `Date: ${data.transaction.date}\n`;
            message += `Status: ${data.transaction.status}\n`;
            
            if (data.matched_payment) {
                message += `\nMatched Payment:\n`;
                message += `Student: ${data.matched_payment.student_name}\n`;
                message += `Amount: $${data.matched_payment.amount}\n`;
                message += `Date: ${new Date(data.matched_payment.payment_date).toLocaleDateString()}\n`;
            }
            
            if (data.student) {
                message += `\nStudent Info:\n`;
                message += `Name: ${data.student.name}\n`;
                message += `Email: ${data.student.email}\n`;
                message += `Dues Balance: $${data.student.dues_balance}\n`;
                message += `Total Paid: $${data.student.total_paid}\n`;
            }
            
            alert(message);
        } catch (err) {
            console.error('Error fetching transaction details:', err);
            alert('Failed to load transaction details. Please try again.');
        }
    };

    const handleMatchManually = async (transactionId) => {
        try {
            // Fetch suggestions first
            const suggestionsData = await bankReconciliationService.getMatchingSuggestions(transactionId);
            setSuggestions(suggestionsData);
            setMatchingTransaction(transactionId);
            
            // For now, show a simple prompt (can be replaced with modal)
            const matchType = prompt('Match to:\n1. Existing Payment (enter payment_id)\n2. Create New Payment (enter student_id)\n\nEnter "1" or "2":');
            
            if (matchType === '1') {
                const paymentId = parseInt(prompt('Enter Payment ID:'));
                if (!paymentId || isNaN(paymentId)) {
                    alert('Invalid payment ID');
                    return;
                }
                
                const notes = prompt('Enter notes (optional):') || '';
                
                try {
                    const result = await bankReconciliationService.matchTransaction(transactionId, {
                        payment_id: paymentId,
                        notes: notes
                    });
                    
                    alert(`Transaction matched successfully!\nStudent: ${result.student_name}\nRemaining Dues: $${result.remaining_dues}`);
                    fetchBankReconciliation();
                } catch (err) {
                    console.error('Error matching transaction:', err);
                    alert('Failed to match transaction. Please try again.');
                }
            } else if (matchType === '2') {
                const studentId = parseInt(prompt('Enter Student ID:'));
                if (!studentId || isNaN(studentId)) {
                    alert('Invalid student ID');
                    return;
                }
                
                const paymentMethod = prompt('Enter Payment Method (BANK_TRANSFER/ONLINE/MANUAL):') || 'BANK_TRANSFER';
                const notes = prompt('Enter notes (optional):') || '';
                
                try {
                    const result = await bankReconciliationService.matchTransaction(transactionId, {
                        create_payment: true,
                        student_id: studentId,
                        payment_method: paymentMethod,
                        notes: notes
                    });
                    
                    alert(`Transaction matched and payment created!\nStudent: ${result.student_name}\nPayment ID: ${result.payment_id}\nRemaining Dues: $${result.remaining_dues}`);
                    fetchBankReconciliation();
                } catch (err) {
                    console.error('Error matching transaction:', err);
                    alert('Failed to match transaction. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            alert('Failed to load matching suggestions. Please try again.');
        }
    };

    return (
        <div className="bank-reconciliation-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Bank Reconciliation</h1>
                    <p className="page-subtitle">Match bank transactions with system payments</p>
                </div>
                <button 
                    className={`sync-bank-btn ${syncing ? 'syncing' : ''}`}
                    onClick={handleSyncBankData}
                    disabled={syncing}
                >
                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {syncing ? 'Syncing...' : 'Sync Bank Data'}
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Transactions</div>
                    <div className="stat-value">{summary.total}</div>
                </div>

                <div className="stat-card stat-card-success">
                    <div className="stat-label">Matched</div>
                    <div className="stat-value stat-value-success">{summary.matched}</div>
                </div>

                <div className="stat-card stat-card-danger">
                    <div className="stat-label">Unmatched</div>
                    <div className="stat-value stat-value-danger">{summary.unmatched}</div>
                </div>

                <div className="stat-card stat-card-warning">
                    <div className="stat-label">Total Amount</div>
                    <div className="stat-value stat-value-warning">${summary.total_amount.toLocaleString()}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <button
                    className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                >
                    All Transactions
                </button>
                <button
                    className={`filter-btn ${filterStatus === 'matched' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('matched')}
                >
                    Matched
                </button>
                <button
                    className={`filter-btn ${filterStatus === 'unmatched' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('unmatched')}
                >
                    Unmatched
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message" style={{ 
                    padding: '1rem', 
                    margin: '1rem 0', 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                    <button onClick={fetchBankReconciliation} style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
                        Retry
                    </button>
                </div>
            )}

            {/* Transactions Table */}
            <div className="transactions-section" id="transactions">
                <div className="section-header">
                    <div className="section-title-with-icon">
                        <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h2 className="section-title">Bank Transactions</h2>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p>Loading transactions...</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>Bank Ref</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Student ID</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                            <div className="no-results">
                                                <svg className="no-results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="no-results-text">No transactions found</p>
                                                <p className="no-results-subtext">Try syncing bank data or adjusting your filter criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="bank-ref">{transaction.bank_ref}</td>
                                            <td className="amount">${transaction.amount.toLocaleString()}</td>
                                            <td className="date">{formatDate(transaction.date)}</td>
                                            <td className="student-id">
                                                {transaction.student_id || <span className="no-match">—</span>}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                                                    {transaction.status === 'Matched' && (
                                                        <svg className="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {transaction.status === 'Unmatched' && (
                                                        <svg className="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                {transaction.status === 'Matched' ? (
                                                    <button
                                                        className="action-btn view-btn"
                                                        onClick={() => handleViewTransaction(transaction.id)}
                                                    >
                                                        View
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="action-btn match-btn"
                                                        onClick={() => handleMatchManually(transaction.id)}
                                                    >
                                                        Match Manually
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankReconciliation;
