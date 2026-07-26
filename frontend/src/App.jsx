import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeaveManagement from './pages/LeaveManagement';
import UserManagement from './pages/UserManagement';
import LeaveTypesAndHolidays from './pages/LeaveTypesAndHolidays';
import SalaryCalculation from './pages/SalaryCalculation';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leaves" element={<LeaveManagement />} />
          </Route>

          {/* HR Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
            <Route path="/hr/users" element={<UserManagement />} />
            <Route path="/hr/settings" element={<LeaveTypesAndHolidays />} />
          </Route>

          {/* Manager & HR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['HR', 'MANAGER']} />}>
            <Route path="/salary" element={<SalaryCalculation />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
