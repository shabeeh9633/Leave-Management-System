import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const LeaveApprovals = () => {
  const { user } = useContext(AuthContext);

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const isManager = user?.role === 'MANAGER';
  const isHR = user?.role === 'HR';

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave-requests/');
      // Filter for Manager on frontend as well to guarantee no other requests are displayed
      const displayLeaves = isManager
        ? res.data.filter((l) => l.needs_manager_approval === true)
        : res.data;
      setLeaves(displayLeaves);
      setError(null);
    } catch (err) {
      setError('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user?.role]);

  const handleApprove = async (id) => {
    setMessage(null);
    setError(null);
    try {
      await api.post(`/leave-requests/${id}/approve/`);
      setMessage('Leave request approved.');
      await fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve leave request.');
    }
  };

  const handleReject = async (id) => {
    setMessage(null);
    setError(null);
    try {
      await api.post(`/leave-requests/${id}/reject/`);
      setMessage('Leave request rejected.');
      await fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject leave request.');
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>{isManager ? 'Leave Approvals' : 'All Leave Requests'}</h2>
          <p className="subtitle">
            {isManager
              ? 'Review and action leave requests that require Manager approval'
              : 'View and override all employee leave decisions'}
          </p>
        </div>
        <div>
          <span className="status-pill status-pending">{pendingCount} Pending</span>
        </div>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="p-4 text-center">Loading leave requests...</p>
        ) : leaves.length === 0 ? (
          <p className="p-4 text-center">
            {isManager
              ? 'No leave requests requiring Manager approval.'
              : 'No leave requests found.'}
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Working Days</th>
                <th>Reason</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>
                    <strong>{l.employee_details?.first_name} {l.employee_details?.last_name}</strong>
                    <br />
                    <span className="text-muted">{l.employee_details?.username}</span>
                  </td>
                  <td>
                    {l.leave_type_details?.name}
                    <br />
                    <span className={`status-pill ${l.leave_type_details?.is_paid ? 'active' : 'inactive'}`}>
                      {l.leave_type_details?.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    {l.start_date}
                    <br />
                    to {l.end_date}
                  </td>
                  <td><strong>{l.working_days} day(s)</strong></td>
                  <td>{l.reason}</td>
                  <td>{new Date(l.applied_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-pill status-${l.status.toLowerCase()}`}>
                      {l.status}
                    </span>
                    {l.reviewed_by_username && (
                      <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                        by {l.reviewed_by_username}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="btn-group">
                      {/* MANAGER: ONLY Approve & Reject for PENDING requests requiring approval */}
                      {isManager && l.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(l.id)}
                            className="btn btn-sm btn-success"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(l.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {isManager && l.status !== 'PENDING' && (
                        <span className="text-muted">—</span>
                      )}

                      {/* HR: Approve / Reject / Override for non-cancelled requests */}
                      {isHR && l.status !== 'CANCELLED' && (
                        <>
                          {l.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleApprove(l.id)}
                              className="btn btn-sm btn-success"
                            >
                              {l.status === 'REJECTED' ? 'Override (Approve)' : 'Approve'}
                            </button>
                          )}
                          {l.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleReject(l.id)}
                              className="btn btn-sm btn-danger"
                            >
                              {l.status === 'APPROVED' ? 'Override (Reject)' : 'Reject'}
                            </button>
                          )}
                        </>
                      )}
                      {isHR && l.status === 'CANCELLED' && (
                        <span className="text-muted">Cancelled</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default LeaveApprovals;
