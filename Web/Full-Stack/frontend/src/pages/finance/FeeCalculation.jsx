import React, { useState, useEffect, useCallback } from 'react';
import './FeeCalculation.css';
import feeCalculationService from '../../services/api-routes/fee-calculation-routes/feeCalculationService';

const FeeCalculation = () => {
    const [tuitionFees, setTuitionFees] = useState([]);
    const [busFees, setBusFees] = useState([]);
    const [faculties, setFaculties] = useState(['Engineering', 'Computer Science', 'Digital Arts', 'Business']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Calculator state
    const [creditHours, setCreditHours] = useState(15);
    const [selectedFaculty, setSelectedFaculty] = useState('Engineering');
    const [includeBus, setIncludeBus] = useState(true);

    // Fetch fee structure from API
    const fetchFeeStructure = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await feeCalculationService.getFeeStructure();
            
            // Transform API data to component format
            const tuitionCategory = data.categories.find(cat => cat.name === 'tuition');
            const busCategory = data.categories.find(cat => cat.name === 'bus');
            
            if (tuitionCategory) {
                setTuitionFees(tuitionCategory.fees.map(fee => ({
                    id: fee.id,
                    name: fee.name,
                    amount: fee.amount,
                    is_per_credit: fee.is_per_credit
                })));
            }
            
            if (busCategory) {
                setBusFees(busCategory.fees.map(fee => ({
                    id: fee.id,
                    name: fee.name,
                    amount: fee.amount,
                    is_per_credit: fee.is_per_credit
                })));
            }
            
            if (data.faculties && data.faculties.length > 0) {
                setFaculties(data.faculties);
                setSelectedFaculty(prevFaculty => {
                    if (data.faculties.includes(prevFaculty)) {
                        return prevFaculty;
                    }
                    return data.faculties[0];
                });
            }
        } catch (err) {
            console.error('Error fetching fee structure:', err);
            setError('Failed to load fee structure. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeeStructure();
    }, []);

    const addFee = async (category) => {
        try {
            // Create new fee item via API
            const newFee = await feeCalculationService.addFeeItem({
                category: category,
                name: '',
                amount: 0,
                is_per_credit: category === 'tuition' ? false : false // Default to false, user can change
            });
            
            // Add to local state
            const feeItem = {
                id: newFee.fee.id,
                name: newFee.fee.name,
                amount: newFee.fee.amount,
                is_per_credit: newFee.fee.is_per_credit
            };
            
            switch (category) {
                case 'tuition':
                    setTuitionFees([...tuitionFees, feeItem]);
                    break;
                case 'bus':
                    setBusFees([...busFees, feeItem]);
                    break;
                default:
                    break;
            }
            
            setHasChanges(true);
        } catch (err) {
            console.error('Error adding fee item:', err);
            alert('Failed to add fee item. Please try again.');
        }
    };

    const removeFee = async (category, id) => {
        // Check if it's a new item (temporary ID) or existing item
        const isNewItem = typeof id === 'number' && id > 1000000000000; // Temporary IDs are timestamps
        
        if (!isNewItem) {
            try {
                // Delete via API
                await feeCalculationService.deleteFeeItem(id);
            } catch (err) {
                console.error('Error deleting fee item:', err);
                alert('Failed to delete fee item. Please try again.');
                return;
            }
        }
        
        // Remove from local state
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
        
        setHasChanges(true);
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
        
        setHasChanges(true);
    };

    // Calculate totals
    const calculateTotal = () => {
        // Calculate tuition fees (per credit + fixed fees)
        let tuitionTotal = 0;
        let registrationTotal = 0;
        
        tuitionFees.forEach(fee => {
            if (fee.is_per_credit) {
                tuitionTotal += (Number(fee.amount) || 0) * creditHours;
            } else {
                registrationTotal += Number(fee.amount) || 0;
            }
        });
        
        // Calculate bus fees
        const busTotal = includeBus 
            ? busFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0)
            : 0;

        return {
            tuition: tuitionTotal,
            registration: registrationTotal,
            bus: busTotal,
            total: tuitionTotal + registrationTotal + busTotal
        };
    };

    const totals = calculateTotal();

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            
            // Prepare fee structure for API
            const feeStructure = {
                tuition: tuitionFees.map(fee => ({
                    id: fee.id,
                    name: fee.name,
                    amount: Number(fee.amount) || 0,
                    is_per_credit: fee.is_per_credit || false
                })),
                bus: busFees.map(fee => ({
                    id: fee.id,
                    name: fee.name,
                    amount: Number(fee.amount) || 0,
                    is_per_credit: fee.is_per_credit || false
                }))
            };
            
            await feeCalculationService.updateFeeStructure(feeStructure);
            setHasChanges(false);
            alert('Fee structure saved successfully!');
        } catch (err) {
            console.error('Error saving fee structure:', err);
            alert('Failed to save fee structure. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fee-calculation-page">
                <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p>Loading fee structure...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fee-calculation-page">
                <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                    <button onClick={fetchFeeStructure} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fee-calculation-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">Fee Calculation</h1>
                    <p className="page-subtitle">Configure and manage fee structures</p>
                </div>
                <button 
                    className={`save-changes-btn ${saving ? 'saving' : ''} ${!hasChanges ? 'no-changes' : ''}`}
                    onClick={handleSaveChanges}
                    disabled={saving || !hasChanges}
                >
                    <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="fee-content-grid">
                {/* Left Column - Fee Categories */}
                <div className="fee-categories">
                    {/* Tuition Fees */}
                    <div className="fee-category-card">
                        <h2 className="category-title">Tuition Fees</h2>
                        <div className="fee-items">
                            {tuitionFees.length === 0 ? (
                                <div className="empty-state" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                                    No tuition fees configured
                                </div>
                            ) : (
                                tuitionFees.map((fee) => (
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
                                        <label className="per-credit-checkbox" title="Per credit hour">
                                            <input
                                                type="checkbox"
                                                checked={fee.is_per_credit || false}
                                                onChange={(e) => updateFee('tuition', fee.id, 'is_per_credit', e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>Per Credit</span>
                                        </label>
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
                                ))
                            )}
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
                            {busFees.length === 0 ? (
                                <div className="empty-state" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                                    No bus fees configured
                                </div>
                            ) : (
                                busFees.map((fee) => (
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
                                ))
                            )}
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
                                onChange={(e) => setCreditHours(Number(e.target.value) || 0)}
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

                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={includeBus}
                                    onChange={(e) => setIncludeBus(e.target.checked)}
                                />
                                Include Bus Fees
                            </label>
                        </div>
                    </div>

                    <div className="calculator-breakdown">
                        {totals.tuition > 0 && (
                            <div className="breakdown-item">
                                <span className="breakdown-label">
                                    Tuition ({creditHours} x ${tuitionFees.find(f => f.is_per_credit)?.amount || 0})
                                </span>
                                <span className="breakdown-value">${totals.tuition.toLocaleString()}</span>
                            </div>
                        )}
                        {totals.registration > 0 && (
                            <div className="breakdown-item">
                                <span className="breakdown-label">Registration & Other Fees</span>
                                <span className="breakdown-value">${totals.registration.toLocaleString()}</span>
                            </div>
                        )}
                        {includeBus && totals.bus > 0 && (
                            <div className="breakdown-item">
                                <span className="breakdown-label">Bus Fees</span>
                                <span className="breakdown-value">${totals.bus.toLocaleString()}</span>
                            </div>
                        )}
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
