import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import studentService from '../../services/studentService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './PaymentReceipt.css';

const PaymentReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    const loadPaymentData = async () => {
      if (location.state?.paymentData) {
        // If coming from Make Payment page with state
        const { paymentData, cardLast4, paymentMethod, date } = location.state;
        
        // Fetch enrolled courses
        try {
          const statusData = await studentService.getDashboardStatus();
          setEnrolledCourses(statusData.enrollments || []);
        } catch (err) {
          console.error('Failed to load courses:', err);
        }
        
        setPaymentInfo({

          ...paymentData,
          cardLast4,
          paymentMethod,
          isPending: location.state?.isPending || paymentData.status === 'PENDING',
          status: paymentData.status,
          date: date || new Date(paymentData.payment_date).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        });
      } else {
        // Fetch latest payment from backend
        try {
          const [history, statusData] = await Promise.all([
            studentService.getPaymentHistory(),
            studentService.getDashboardStatus()
          ]);
          
          if (history && history.payments && history.payments.length > 0) {
            const latestPayment = history.payments[0];
            setEnrolledCourses(statusData.enrollments || []);
            setPaymentInfo({
              amount: latestPayment.amount,
              remaining_dues: latestPayment.remaining_dues || 0,
              payment_id: latestPayment.id,
              payment_method: latestPayment.payment_method,
              cardLast4: latestPayment.reference_number?.slice(-4) || '****',
              paymentMethod: latestPayment.payment_method === 'ONLINE' ? 'card' : 'bank',
              isPending: latestPayment.status === 'PENDING',
              status: latestPayment.status,
              date: new Date(latestPayment.payment_date).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            });
          } else {
            // No payments found
            setPaymentInfo(null);
          }
        } catch (err) {
          console.error('Failed to load payment history:', err);
          setPaymentInfo(null);
        }
      }
    };

    loadPaymentData();
  }, [location]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector('.payment-receipt-container');
    if (!element) return;

    try {
      // Temporarily hide header actions for clean capture
      const actionsEl = element.querySelector('.receipt-actions');
      const originalDisplay = actionsEl ? actionsEl.style.display : '';
      if (actionsEl) actionsEl.style.display = 'none';

      const canvas = await html2canvas(element, {
        scale: 2, // Improve quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Restore actions
      if (actionsEl) actionsEl.style.display = originalDisplay;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt_TXN-${(paymentInfo.payment_id || 'XXXX').toString().padStart(6,'0')}.pdf`);
      
    } catch (err) {
      console.error('PDF generation error:', err);
      // Ensure UI is restored
      const actionsEl = element.querySelector('.receipt-actions');
      if (actionsEl) actionsEl.style.display = 'flex';
      alert('Could not download PDF. Please try the Print button.');
    }
  };

  if (!paymentInfo) {
    return (
      <DashboardLayout>
        <div className="payment-receipt-container">
          <div className="receipt-page-header">
            <div>
              <h1 className="receipt-page-title">Payment Receipt</h1>
              <p className="receipt-page-subtitle">Transaction details and confirmation</p>
            </div>
          </div>
          <div className="receipt-content">
            <div className="empty-state">
              <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2>No Payment Receipt Available</h2>
              <p>You haven't made any payments yet. Make a payment to view your receipt here.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPending = paymentInfo.isPending || paymentInfo.status === 'PENDING';

  return (
    <DashboardLayout>
      <div className="payment-receipt-container">
        {/* Page Header */}
        <div className="receipt-page-header">
          <div>
            <h1 className="receipt-page-title">Payment Receipt</h1>
            <p className="receipt-page-subtitle">Transaction details and confirmation</p>
          </div>
          <div className="receipt-actions">
            <button className="receipt-btn receipt-btn-secondary" onClick={handlePrint}>
              <svg className="receipt-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button className="receipt-btn receipt-btn-primary" onClick={handleDownloadPDF}>
              <svg className="receipt-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="receipt-content">
          {/* Status Message */}
          {isPending ? (
            <div className="success-message pending">
              <div className="success-icon-wrapper pending">
                <svg className="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="success-title">Payment Under Review</h2>
              <p className="success-subtitle">Your payment is under review by the finance department. You will be notified once it is approved or rejected.</p>
            </div>
          ) : (
            <div className="success-message">
              <div className="success-icon-wrapper">
                <svg className="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="success-title">Payment Successful</h2>
              <p className="success-subtitle">Your payment has been processed successfully</p>
            </div>
          )}

          {/* Transaction Details */}
          <div className="receipt-details">
            <div className="detail-row">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">{paymentInfo.date}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">
                {paymentInfo.paymentMethod === 'card' ? `Credit Card •••• ${paymentInfo.cardLast4}` : 'Bank Transfer'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`status-badge ${isPending ? 'pending' : 'completed'}`}>
                {isPending ? 'Pending Verification' : 'Completed'}
              </span>
            </div>
          </div>

          {/* Enrolled Courses */}
          {enrolledCourses.length > 0 && (
            <div className="courses-section">
              <h3 className="section-title">Enrolled Courses</h3>
              <div className="courses-list">
                {enrolledCourses.map((enrollment, index) => (
                  <div key={index} className="course-item">
                    <div className="course-info">
                      <span className="course-name">{enrollment.course_name}</span>
                      <span className="course-credits">{enrollment.credits || 'N/A'} Credits</span>
                    </div>
                    <span className="course-fee">${enrollment.course_fee?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="student-info-section">
            <h3 className="section-title">Student Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Student ID</span>
                <span className="info-value">STD-2024-{user?.id?.toString().padStart(3, '0')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{user?.username || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="payment-summary-box">
            <h3 className="section-title">Payment Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Amount Paid</span>
                <span className="summary-amount">${paymentInfo.amount?.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Remaining Balance</span>
                <span className="summary-amount">${paymentInfo.remaining_dues?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="receipt-footer">
            <p>Thank you for your payment. This receipt has been sent to your email.</p>
            <p className="footer-note">For any queries, please contact the finance department.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentReceipt;
