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
        // silently fail — dashboard is not critical
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const isEmployee = user?.role === 'EMPLOYEE';
  const isManager = user?.role === 'MANAGER';
  const isHR = user?.role === 'HR';

  // Employee: their own leaves
  const myLeaves = isEmployee ? leaves : [];
  const pendingMine = myLeaves.filter((l) => l.status === 'PENDING').length;
  const approvedMine = myLeaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedMine = myLeaves.filter((l) => l.status === 'REJECTED').length;

  // Manager/HR: requests in their queue
  const pendingApprovals = leaves.filter((l) => l.status === 'PENDING').length;
  const totalLeaves = leaves.length;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Welcome, {user?.first_name || user?.username}!</h2>
          <p className="subtitle">
            Role: <strong>{user?.role}</strong> — Leave Management System
          </p>
        </div>
      </div>

      {/* EMPLOYEE dashboard */}
      {isEmployee && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{myLeaves.length}</div>
              <div className="stat-label">Total Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-warning">{pendingMine}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-success">{approvedMine}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-danger">{rejectedMine}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="card text-center p-4">
              <h3>Apply for Leave</h3>
              <p>Submit a new leave request. Duration is calculated automatically, excluding weekends and public holidays.</p>
              <NavLink to="/leaves" className="btn btn-primary mt-2">
                Go to My Leaves
              </NavLink>
            </div>
          </div>
        </>
      )}

      {/* MANAGER dashboard */}
      {isManager && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalLeaves}</div>
              <div className="stat-label">Requests Requiring Approval</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-warning">{pendingApprovals}</div>
              <div className="stat-label">Pending Action</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-success">{leaves.filter((l) => l.status === 'APPROVED').length}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-danger">{leaves.filter((l) => l.status === 'REJECTED').length}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="card text-center p-4">
              <h3>Leave Approvals</h3>
              <p>Review and action employee leave requests that satisfy the manager approval rules.</p>
              <NavLink to="/approvals" className="btn btn-primary mt-2">
                View Approval Queue
              </NavLink>
            </div>
          </div>
        </>
      )}

      {/* HR dashboard */}
      {isHR && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalLeaves}</div>
              <div className="stat-label">Total Leave Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-warning">{pendingApprovals}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-success">{leaves.filter((l) => l.status === 'APPROVED').length}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-danger">{leaves.filter((l) => l.status === 'REJECTED').length}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="card text-center p-4">
              <h3>Leave Management</h3>
              <p>View all leave requests across the organisation, approve, reject, or override decisions.</p>
              <NavLink to="/approvals" className="btn btn-primary mt-2">
                View All Leave Requests
              </NavLink>
            </div>
            <div className="card text-center p-4">
              <h3>User Management</h3>
              <p>Create, edit, and manage employee accounts. Assign roles and activate/deactivate accounts.</p>
              <NavLink to="/hr/users" className="btn btn-secondary mt-2">
                Manage Users
              </NavLink>
            </div>
            <div className="card text-center p-4">
              <h3>Salary Calculation</h3>
              <p>Calculate monthly payable days and final salary for any employee based on approved leaves.</p>
              <NavLink to="/salary" className="btn btn-secondary mt-2">
                Open Salary Calculator
              </NavLink>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
