import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import CourseRegistration from './pages/student/CourseRegistration';
import CalculatedFees from './pages/student/CalculatedFees';
import MakePayment from './pages/student/MakePayment';
import PaymentReceipt from './pages/student/PaymentReceipt';
import PaymentHistory from './pages/student/PaymentHistory';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import StudentList from './pages/finance/StudentList';
import FeeCalculation from './pages/finance/FeeCalculation';
import BankReconciliation from './pages/finance/BankReconciliation';
import Reports from './pages/finance/Reports';
import UnpaidStudents from './pages/finance/UnpaidStudents';
import FinanceDashboardLayout from './layouts/FinanceDashboardLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute role="student" />}>

            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<CourseRegistration />} />
            <Route path="/student/fees" element={<CalculatedFees />} />
            <Route path="/student/payment" element={<MakePayment />} />
            <Route path="/student/receipt" element={<PaymentReceipt />} />
            <Route path="/student/history" element={<PaymentHistory />} />
            {/* Add more student routes here later */}
          </Route>

          {/* Protected Finance Routes */}
          <Route element={<ProtectedRoute role="finance" />}>
            <Route path="/finance" element={<Navigate to="/finance/dashboard" replace />} />
            <Route path="/finance/dashboard" element={<FinanceDashboardLayout><FinanceDashboard /></FinanceDashboardLayout>} />
            <Route path="/finance/students" element={<FinanceDashboardLayout><StudentList /></FinanceDashboardLayout>} />
            <Route path="/finance/fee-calculation" element={<FinanceDashboardLayout><FeeCalculation /></FinanceDashboardLayout>} />
            <Route path="/finance/bank-reconciliation" element={<FinanceDashboardLayout><BankReconciliation /></FinanceDashboardLayout>} />
            <Route path="/finance/reports" element={<FinanceDashboardLayout><Reports /></FinanceDashboardLayout>} />
            <Route path="/finance/unpaid-students" element={<FinanceDashboardLayout><UnpaidStudents /></FinanceDashboardLayout>} />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;