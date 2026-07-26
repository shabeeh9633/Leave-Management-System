import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await api.get('/leave-requests/');
        setLeaves(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const myLeaves = leaves.filter((l) => l.employee === user?.id);
  const pendingApprovals = leaves.filter((l) => l.status === 'PENDING');
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED');
  const rejectedLeaves = leaves.filter((l) => l.status === 'REJECTED');

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Welcome, {user?.first_name || user?.username}!</h2>
          <p className="subtitle">Role: {user?.role} | Overview of leave system status</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{myLeaves.length}</div>
          <div className="stat-label">My Total Leaves</div>
        </div>

        <div className="stat-card">
          <div className="stat-value text-warning">{pendingApprovals.length}</div>
          <div className="stat-label">Pending Approvals</div>
        </div>

        <div className="stat-card">
          <div className="stat-value text-success">{approvedLeaves.length}</div>
          <div className="stat-label">Approved Leaves</div>
        </div>

        <div className="stat-card">
          <div className="stat-value text-danger">{rejectedLeaves.length}</div>
          <div className="stat-label">Rejected Leaves</div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="card text-center p-4">
          <h3>Apply for Leave</h3>
          <p>Submit a new leave request with automatic duration calculation.</p>
          <NavLink to="/leaves" className="btn btn-primary mt-2">
            Go to Leave Management
          </NavLink>
        </div>

        {user?.role === 'HR' && (
          <div className="card text-center p-4">
            <h3>HR Administration</h3>
            <p>Manage employee accounts, assign roles, and configure leave settings.</p>
            <div className="btn-group justify-center mt-2">
              <NavLink to="/hr/users" className="btn btn-secondary btn-sm">
                Manage Users
              </NavLink>
              <NavLink to="/hr/settings" className="btn btn-secondary btn-sm">
                Types & Holidays
              </NavLink>
            </div>
          </div>
        )}

        {(user?.role === 'HR' || user?.role === 'MANAGER') && (
          <div className="card text-center p-4">
            <h3>Salary Calculation</h3>
            <p>Compute monthly payable days and final salary for employees.</p>
            <NavLink to="/salary" className="btn btn-secondary mt-2">
              Open Salary Calculator
            </NavLink>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
