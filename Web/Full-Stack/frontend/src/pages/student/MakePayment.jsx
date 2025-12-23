import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import studentService from '../../services/studentService';
import './MakePayment.css';

const MakePayment = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'banking'
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Bank Transfer details
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardStatus();
      const balance = data.dues_balance || 0;
      setOutstandingBalance(balance);
    } catch (err) {
      setError('Failed to load balance information.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, proofFile: 'File size must be less than 5MB' }));
        return;
      }
      setProofFile(file);
      setFieldErrors(prev => ({ ...prev, proofFile: null }));
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (outstandingBalance <= 0) {
      setError('No outstanding balance to pay');
      return;
    }

    setFieldErrors({});
    let isValid = true;
    const errors = {};

    // Validate based on method
    if (paymentMethod === 'card') {
      // 1. Validate Card Number
      const cleanCardNum = cardNumber.replace(/\s/g, '');
      if (cleanCardNum.length !== 16) {
        errors.cardNumber = 'Card number must be 16 digits';
        isValid = false;
      }

      // 2. Validate Expiry Date
      if (expiryDate.length !== 5) {
        errors.expiryDate = 'Invalid format (MM/YY)';
        isValid = false;
      } else {
        const [expMonth, expYear] = expiryDate.split('/');
        const month = parseInt(expMonth, 10);
        const year = parseInt(expYear, 10);
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        if (!month || !year || month < 1 || month > 12) {
          errors.expiryDate = 'Invalid month';
          isValid = false;
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          errors.expiryDate = 'Card has expired';
          isValid = false;
        }
      }

      // 3. Validate CVV
      if (cvv.length < 3 || cvv.length > 4) {
        errors.cvv = 'Invalid CVV';
        isValid = false;
      }

      // 4. Validate Name
      if (!cardholderName || cardholderName.trim().length < 2) {
        errors.cardholderName = 'Enter cardholder name';
        isValid = false;
      }
    } else if (paymentMethod === 'banking') {
      // Validate Bank Transfer
      if (!referenceNumber || referenceNumber.trim().length < 3) {
        errors.referenceNumber = 'Reference number is required';
        isValid = false;
      }

      if (!proofFile) {
        errors.proofFile = 'Please upload proof of payment';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    if (!isValid) return;

    setProcessing(true);
    setError(null);
    
    // Capture the exact moment the user initiated the payment
    const paymentInitiatedTime = new Date();
    const isoTimestamp = paymentInitiatedTime.toISOString();

    try {
      const isCard = paymentMethod === 'card';
      const last4 = isCard ? cardNumber.replace(/\s/g, '').slice(-4) : '0000';
      
      const methodStr = isCard ? 'ONLINE' : 'BANK_TRANSFER';
      const refStr = isCard ? `PAY-${Date.now()}-${last4}` : referenceNumber;

      const response = await studentService.makePayment(
        outstandingBalance,
        methodStr,
        refStr,
        isCard ? null : proofFile,
        isoTimestamp
      );

      // Navigate to receipt page with payment data
      navigate('/student/receipt', { 
        state: { 
          payment: {
            ...response,
            initiatedAt: isoTimestamp,
            paymentMethod: isCard ? 'card' : 'bank',
            cardLast4: isCard ? last4 : null,
            isPending: !isCard
          }
        } 
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading payment information...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="make-payment-container">
        {/* Page Header */}
        <div className="payment-page-header">
          <h1 className="payment-page-title">Make Payment</h1>
          <p className="payment-page-subtitle">Choose your preferred payment method</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="payment-content">
          {/* Left Section - Payment Form */}
          <div className="payment-form-section">
            <form onSubmit={handlePayment}>
              {/* Payment Method Selection */}
              <div className="payment-method-section">
                <h2 className="section-title">Select Payment Method</h2>
                <div className="payment-methods">
                  <div 
                    className={`payment-method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <svg className="method-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Card</span>
                  </div>
                  <div 
                    className={`payment-method-card ${paymentMethod === 'banking' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('banking')}
                  >
                    <svg className="method-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <span>Bank Transfer</span>
                  </div>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="card-details-section">
                  <div className="section-header">
                    <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h2 className="section-title">Card Details</h2>
                  </div>

                  <div className="form-group">
                    <label>Card Number</label>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                          setCardNumber(formatted);
                          setFieldErrors(prev => ({ ...prev, cardNumber: null }));
                        }}
                        maxLength="19"
                        
                        className={fieldErrors.cardNumber ? 'invalid' : ''}
                      />
                      <svg className="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    {fieldErrors.cardNumber && <span className="error-message">{fieldErrors.cardNumber}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val.length < expiryDate.length) { setExpiryDate(val); return; }
                            const clean = val.replace(/\D/g, '');
                            if (clean.length === 1 && parseInt(clean) > 1) { setExpiryDate(`0${clean}/`); return; }
                            if (clean.length === 2 && parseInt(clean) > 12) return; 
                            let formatted = clean.slice(0, 4);
                            if (formatted.length >= 2) formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
                            setExpiryDate(formatted);
                            setFieldErrors(prev => ({ ...prev, expiryDate: null }));
                        }}
                        onBlur={() => {
                            if (expiryDate.length === 5) {
                                const [expMonth, expYear] = expiryDate.split('/');
                                const month = parseInt(expMonth, 10);
                                const year = parseInt(expYear, 10);
                                const now = new Date();
                                const currentYear = now.getFullYear() % 100;
                                const currentMonth = now.getMonth() + 1;

                                if (year < currentYear || (year === currentYear && month < currentMonth)) {
                                    setFieldErrors(prev => ({ ...prev, expiryDate: 'Card has expired' }));
                                }
                            }
                        }}
                        maxLength="5"
                        
                        className={fieldErrors.expiryDate ? 'invalid' : ''}
                      />
                      {fieldErrors.expiryDate && <span className="error-message">{fieldErrors.expiryDate}</span>}
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => {
                            setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setFieldErrors(prev => ({ ...prev, cvv: null }));
                          }}
                          maxLength="4"
                          
                          className={fieldErrors.cvv ? 'invalid' : ''}
                        />
                         <svg className="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      {fieldErrors.cvv && <span className="error-message">{fieldErrors.cvv}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="JOHN SMITH"
                      value={cardholderName}
                      onChange={(e) => {
                        setCardholderName(e.target.value.toUpperCase());
                        setFieldErrors(prev => ({ ...prev, cardholderName: null }));
                      }}
                      className={fieldErrors.cardholderName ? 'invalid' : ''}
                    />
                    {fieldErrors.cardholderName && <span className="error-message">{fieldErrors.cardholderName}</span>}
                  </div>
                </div>
              )}

              {/* Bank Transfer Details Form */}
              {paymentMethod === 'banking' && (
                <div className="bank-details-section">
                  <div className="section-header">
                    <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h2 className="section-title">Bank Transfer Details</h2>
                  </div>

                  {/* Bank Info Card */}
                  <div className="bank-info-card">
                    <div className="bank-info-row">
                      <span className="label">Bank Name:</span>
                      <span className="value">University Central Bank</span>
                    </div>
                    <div className="bank-info-row">
                      <span className="label">Account Number:</span>
                      <span className="value">1234 5678 9012</span>
                    </div>
                    <div className="bank-info-row">
                      <span className="label">Routing Number:</span>
                      <span className="value">987654321</span>
                    </div>
                    <div className="bank-info-row">
                      <span className="label">Beneficiary:</span>
                      <span className="value">University Finance Dept</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label>Transaction Reference Number</label>
                    <input
                      type="text"
                      placeholder="Enter the bank reference number (e.g. REF-12345)"
                      value={referenceNumber}
                      onChange={(e) => {
                        setReferenceNumber(e.target.value);
                        setFieldErrors(prev => ({ ...prev, referenceNumber: null }));
                      }}
                      className={fieldErrors.referenceNumber ? 'invalid' : ''}
                    />
                    {fieldErrors.referenceNumber && <span className="error-message">{fieldErrors.referenceNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label>Upload Proof of Payment</label>
                    <div className={`file-upload-area ${fieldErrors.proofFile ? 'invalid' : ''}`}>
                      <input
                        type="file"
                        id="proof-upload"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="proof-upload" className="file-upload-label">
                        <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {proofFile ? (
                           <span className="file-name">{proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)</span>
                        ) : (
                           <span>Click to upload PDF, JPG, or PNG (Max 5MB)</span>
                        )}
                      </label>
                    </div>
                    {fieldErrors.proofFile && <span className="error-message">{fieldErrors.proofFile}</span>}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Section - Payment Summary */}
          <div className="payment-summary-section">
            <div className="summary-card">
              <div className="summary-header">
                <svg className="summary-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="summary-title">Payment Summary</h2>
              </div>

              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Outstanding Balance</span>
                  <span className="summary-value">${outstandingBalance.toLocaleString()}</span>
                </div>

                <button 
                  className="pay-btn"
                  onClick={handlePayment}
                  disabled={processing || outstandingBalance <= 0}
                >
                  {processing ? 'Processing...' : (paymentMethod === 'banking' ? 'Submit for Verification' : `Pay $${outstandingBalance.toLocaleString()}`)}
                </button>

                <p className="secure-note">
                  <svg className="lock-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {paymentMethod === 'card' ? 'Secure payment powered by Stripe' : 'Payments subject to verification'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MakePayment;
