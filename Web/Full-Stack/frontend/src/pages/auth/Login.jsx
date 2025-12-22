import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import './Login.css';

/**
 * Login Page
 * Handles "Portal Selection" (Visual Step 1) and "Login Form" (Visual Step 2).
 */
const Login = ({ onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [view, setView] = useState('selection'); // 'selection' | 'student' | 'finance'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Form States
  const [formData, setFormData] = useState({ identifier: '', password: '' });

  // Handle Portal Select
  const handlePortalSelect = (role) => {
    setView(role);
    setFormData({ identifier: '', password: '' });
    setErrors({});
  };

  const handleBack = () => {
    setView('selection');
    setFormData({ identifier: '', password: '' });
    setErrors({});
    setSuccess(false);
  };

  // Handle Input Changes
  const setField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    setSuccess(false);

    if (!formData.identifier) newErrors.identifier = 'Username/ID is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await login(formData.identifier, formData.password);

      if (result.success) {
        setSuccess(true);
        // Short delay to show success message
        setTimeout(() => {
          if (view === 'student') {
            navigate('/student/dashboard');
          } else {
            navigate('/finance');
          }
        }, 1000);
      } else {
        setErrors({ general: result.message });
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target.className === 'login-overlay') {
      if (onClose) onClose();
    }
  };

  return (
    <div className="login-overlay" onClick={handleBackdropClick}>
      <div className="login-card modal-animate">
        {onClose && <button className="close-modal-btn" onClick={onClose}>&times;</button>}

        {/* Step 1: Portal Selection */}
        {view === 'selection' && (
          <>
            <div className="login-header">
              <h1 className="login-title">Choose Your Portal</h1>
              <p className="login-subtitle">Select your role to continue</p>
            </div>

            <div className="portal-grid">
              <div className="portal-card" onClick={() => handlePortalSelect('student')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="portal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#1d4ed8' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <span className="portal-title">Student</span>
              </div>

              <div className="portal-card" onClick={() => handlePortalSelect('finance')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="portal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#0f766e' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="portal-title">Finance</span>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Login Forms */}
        {view !== 'selection' && (
          <form className="login-form" onSubmit={handleSubmit}>
            <button type="button" className="back-btn" onClick={handleBack}>
              &larr; Back to selection
            </button>

            <div className="login-header login-header-margin">
              <h1 className="login-title">
                {view === 'student' ? 'Student Login' : 'Finance Login'}
              </h1>
              <p className="login-subtitle">Enter your credentials below</p>
            </div>

            <div>
              <label className="form-label">Username / ID</label>
              <input
                type="text"
                className={`form-input ${errors.identifier ? 'input-error' : ''}`}
                placeholder={view === 'student' ? 'e.g. 2023001' : 'e.g. admin'}
                value={formData.identifier}
                onChange={(e) => setField('identifier', e.target.value)}
                disabled={loading}
              />
              {errors.identifier && (
                <span className="error-text">
                  {errors.identifier}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setField('password', e.target.value)}
                disabled={loading}
              />
              {errors.password && (
                <span className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            {errors.general && (
              <div className="general-error">
                {errors.general}
              </div>
            )}

            {success && (
              <div className="message-box message-success">
                Login Successful! Redirecting...
              </div>
            )}

            <div className="submit-btn-wrapper">
              <Button
                variant="primary"
                style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
