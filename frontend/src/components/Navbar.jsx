import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <NavLink to="/">Leave Management</NavLink>
        </div>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Dashboard
          </NavLink>

          {/* Only EMPLOYEE can access Leave Application */}
          {user?.role === 'EMPLOYEE' && (
            <NavLink to="/leaves" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              My Leaves
            </NavLink>
          )}

          {/* Manager sees their approval queue */}
          {user?.role === 'MANAGER' && (
            <NavLink to="/approvals" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Leave Approvals
            </NavLink>
          )}

          {/* HR sees all leave requests */}
          {user?.role === 'HR' && (
            <>
              <NavLink to="/approvals" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                All Leaves
              </NavLink>
              <NavLink to="/hr/users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                User Management
              </NavLink>
              <NavLink to="/hr/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Types & Holidays
              </NavLink>
              <NavLink to="/salary" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Salary Calculation
              </NavLink>
            </>
          )}
        </div>
        <div className="navbar-user">
          <span className="user-badge">{user?.first_name || user?.username} ({user?.role})</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
