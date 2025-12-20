import React, { useState } from 'react';
import './FeeCalculation.css';

const FeeCalculation = () => {
    const [tuitionFees, setTuitionFees] = useState([
        { id: 1, name: 'Per Credit Hour', amount: 200 },
        { id: 2, name: 'Registration Fee', amount: 150 }
    ]);

    const [busFees, setBusFees] = useState([
        { id: 1, name: 'Monthly Bus Pass', amount: 150 },
        { id: 2, name: 'Semester Bus Pass', amount: 500 }
    ]);

    // Calculator state
    const [creditHours, setCreditHours] = useState(15);
    const [selectedFaculty, setSelectedFaculty] = useState('Engineering');

    const faculties = ['Engineering', 'Computer Science', 'Digital Arts', 'Business'];

    const addFee = (category) => {
        const newFee = { id: Date.now(), name: '', amount: 0 };
        switch (category) {
            case 'tuition':
                setTuitionFees([...tuitionFees, newFee]);
                break;
            case 'bus':
                setBusFees([...busFees, newFee]);
                break;
            default:
                break;
        }
    };

    const removeFee = (category, id) => {
        switch (category) {
            case 'tuition':
                setTuitionFees(tuitionFees.filter(fee => fee.id !== id));
                break;
            case 'bus':
                setBusFees(busFees.filter(fee => fee.id !== id));
                break;
            default:
                break;
        }
    };

    const updateFee = (category, id, field, value) => {
        const updateArray = (fees) =>
            fees.map(fee => fee.id === id ? { ...fee, [field]: value } : fee);

        switch (category) {
            case 'tuition':
                setTuitionFees(updateArray(tuitionFees));
                break;
            case 'bus':
                setBusFees(updateArray(busFees));
                break;
            default:
                break;
        }
    };

    // Calculate totals
    const calculateTotal = () => {
        const perCreditHour = tuitionFees.find(f => f.name === 'Per Credit Hour')?.amount || 200;
        const tuitionTotal = creditHours * perCreditHour;
        const registrationTotal = tuitionFees.filter(f => f.name !== 'Per Credit Hour')
            .reduce((sum, fee) => sum + Number(fee.amount), 0);
        const busTotal = busFees.reduce((sum, fee) => sum + Number(fee.amount), 0);

        return {
            tuition: tuitionTotal,
            registration: registrationTotal,
            bus: busTotal,
            total: tuitionTotal + registrationTotal + busTotal
        };
    };

    const totals = calculateTotal();

    const handleSaveChanges = () => {
        console.log('Saving fee structure changes...');
        // API call to save changes
        alert('Fee structure saved successfully!');
    };

    return (
        <div className="fee-calculation-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Fee Calculation</h1>
                    <p className="page-subtitle">Configure and manage fee structures</p>
                </div>
                <button className="save-changes-btn" onClick={handleSaveChanges}>
                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Changes
                </button>
            </div>

            <div className="fee-content-grid">
                {/* Left Column - Fee Categories */}
                <div className="fee-categories">
                    {/* Tuition Fees */}
                    <div className="fee-category-card">
                        <h2 className="category-title">Tuition Fees</h2>
                        <div className="fee-items">
                            {tuitionFees.map((fee) => (
                                <div key={fee.id} className="fee-item">
                                    <input
                                        type="text"
                                        value={fee.name}
                                        onChange={(e) => updateFee('tuition', fee.id, 'name', e.target.value)}
                                        className="fee-name-input"
                                        placeholder="Fee name"
                                    />
                                    <div className="fee-amount-group">
                                        <span className="currency-symbol">$</span>
                                        <input
                                            type="number"
                                            value={fee.amount}
                                            onChange={(e) => updateFee('tuition', fee.id, 'amount', e.target.value)}
                                            className="fee-amount-input"
                                            placeholder="0"
                                        />
                                    </div>
                                    <button
                                        className="remove-fee-btn"
                                        onClick={() => removeFee('tuition', fee.id)}
                                        title="Remove fee"
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="add-fee-btn" onClick={() => addFee('tuition')}>
                            <svg className="add-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Fee
                        </button>
                    </div>

                    {/* Bus Fees */}
                    <div className="fee-category-card">
                        <h2 className="category-title">Bus Fees</h2>
                        <div className="fee-items">
                            {busFees.map((fee) => (
                                <div key={fee.id} className="fee-item">
                                    <input
                                        type="text"
                                        value={fee.name}
                                        onChange={(e) => updateFee('bus', fee.id, 'name', e.target.value)}
                                        className="fee-name-input"
                                        placeholder="Fee name"
                                    />
                                    <div className="fee-amount-group">
                                        <span className="currency-symbol">$</span>
                                        <input
                                            type="number"
                                            value={fee.amount}
                                            onChange={(e) => updateFee('bus', fee.id, 'amount', e.target.value)}
                                            className="fee-amount-input"
                                            placeholder="0"
                                        />
                                    </div>
                                    <button
                                        className="remove-fee-btn"
                                        onClick={() => removeFee('bus', fee.id)}
                                        title="Remove fee"
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="add-fee-btn" onClick={() => addFee('bus')}>
                            <svg className="add-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Fee
                        </button>
                    </div>
                </div>

                {/* Right Column - Fee Calculator */}
                <div className="fee-calculator-card">
                    <div className="calculator-header">
                        <svg className="calculator-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h2 className="calculator-title">Fee Calculator</h2>
                    </div>

                    <div className="calculator-inputs">
                        <div className="input-group">
                            <label className="input-label">Credit Hours</label>
                            <input
                                type="number"
                                value={creditHours}
                                onChange={(e) => setCreditHours(Number(e.target.value))}
                                className="calculator-input"
                                min="1"
                                max="30"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Faculty</label>
                            <select
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                className="calculator-select"
                            >
                                {faculties.map((faculty, index) => (
                                    <option key={index} value={faculty}>
                                        {faculty}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="calculator-breakdown">
                        <div className="breakdown-item">
                            <span className="breakdown-label">Tuition ({creditHours} x ${tuitionFees[0]?.amount || 200})</span>
                            <span className="breakdown-value">${totals.tuition.toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item">
                            <span className="breakdown-label">Registration</span>
                            <span className="breakdown-value">${totals.registration.toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item">
                            <span className="breakdown-label">Bus Fees</span>
                            <span className="breakdown-value">${totals.bus.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="calculator-total">
                        <span className="total-label">Total</span>
                        <span className="total-value">${totals.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeCalculation;
