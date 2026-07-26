import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeLeaves from './pages/EmployeeLeaves';
import LeaveApprovals from './pages/LeaveApprovals';
import UserManagement from './pages/UserManagement';
import LeaveTypesAndHolidays from './pages/LeaveTypesAndHolidays';
import SalaryCalculation from './pages/SalaryCalculation';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* All authenticated users see Dashboard */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          {/* EMPLOYEE only: apply leave + view own leaves */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/leaves" element={<EmployeeLeaves />} />
          </Route>

          {/* MANAGER and HR: leave approvals/workflow */}
          <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'HR']} />}>
            <Route path="/approvals" element={<LeaveApprovals />} />
          </Route>

          {/* HR only: user management + leave types + holidays + salary */}
          <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
            <Route path="/hr/users" element={<UserManagement />} />
            <Route path="/hr/settings" element={<LeaveTypesAndHolidays />} />
            <Route path="/salary" element={<SalaryCalculation />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
