import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './BankReconciliation.css';

const BankReconciliation = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash === '#transactions') {
            const element = document.getElementById('transactions');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    const [transactions, setTransactions] = useState([
        {
            id: 1,
            bankRef: 'REF-78945612',
            amount: 5200,
            date: 'Dec 10, 2025',
            studentId: 'STD-001',
            status: 'Matched'
        },
        {
            id: 2,
            bankRef: 'REF-78945613',
            amount: 3100,
            date: 'Dec 9, 2025',
            studentId: 'STD-003',
            status: 'Matched'
        },
        {
            id: 3,
            bankRef: 'REF-78945614',
            amount: 1850,
            date: 'Dec 8, 2025',
            studentId: null,
            status: 'Unmatched'
        },
        {
            id: 4,
            bankRef: 'REF-78945615',
            amount: 7400,
            date: 'Dec 7, 2025',
            studentId: 'STD-002',
            status: 'Matched'
        },
        {
            id: 5,
            bankRef: 'REF-78945616',
            amount: 2900,
            date: 'Dec 7, 2025',
            studentId: null,
            status: 'Unmatched'
        },
        {
            id: 6,
            bankRef: 'REF-78945617',
            amount: 4500,
            date: 'Dec 6, 2025',
            studentId: 'STD-005',
            status: 'Matched'
        }
    ]);

    const [filterStatus, setFilterStatus] = useState('all');

    const stats = {
        total: transactions.length,
        matched: transactions.filter(t => t.status === 'Matched').length,
        unmatched: transactions.filter(t => t.status === 'Unmatched').length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0)
    };

    const filteredTransactions = transactions.filter(transaction => {
        if (filterStatus === 'all') return true;
        return transaction.status.toLowerCase() === filterStatus.toLowerCase();
    });

    const getStatusClass = (status) => {
        return status === 'Matched' ? 'status-matched' : 'status-unmatched';
    };

    const handleSyncBankData = () => {
        console.log('Syncing bank data...');
        alert('Bank data synced successfully!');
    };

    const handleViewTransaction = (transactionId) => {
        console.log('View transaction:', transactionId);
    };

    const handleMatchManually = (transactionId) => {
        console.log('Match manually:', transactionId);
        // Open modal or navigate to matching interface
    };

    return (
        <div className="bank-reconciliation-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Bank Reconciliation</h1>
                    <p className="page-subtitle">Match bank transactions with system payments</p>
                </div>
                <button className="sync-bank-btn" onClick={handleSyncBankData}>
                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Bank Data
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Transactions</div>
                    <div className="stat-value">{stats.total}</div>
                </div>

                <div className="stat-card stat-card-success">
                    <div className="stat-label">Matched</div>
                    <div className="stat-value stat-value-success">{stats.matched}</div>
                </div>

                <div className="stat-card stat-card-danger">
                    <div className="stat-label">Unmatched</div>
                    <div className="stat-value stat-value-danger">{stats.unmatched}</div>
                </div>

                <div className="stat-card stat-card-warning">
                    <div className="stat-label">Total Amount</div>
                    <div className="stat-value stat-value-warning">${stats.totalAmount.toLocaleString()}</div>
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
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id}>
                                    <td className="bank-ref">{transaction.bankRef}</td>
                                    <td className="amount">${transaction.amount.toLocaleString()}</td>
                                    <td className="date">{transaction.date}</td>
                                    <td className="student-id">
                                        {transaction.studentId || <span className="no-match">—</span>}
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
                            ))}
                        </tbody>
                    </table>

                    {filteredTransactions.length === 0 && (
                        <div className="no-results">
                            <svg className="no-results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="no-results-text">No transactions found</p>
                            <p className="no-results-subtext">Try adjusting your filter criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankReconciliation;
