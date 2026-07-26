import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const LeaveManagement = () => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('apply'); // 'apply', 'myLeaves', 'approvals'
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ltRes, hRes, lRes] = await Promise.all([
        api.get('/leave-types/'),
        api.get('/holidays/'),
        api.get('/leave-requests/'),
      ]);
      setLeaveTypes(ltRes.data);
      setHolidays(hRes.data);
      setLeaves(lRes.data);
      if (ltRes.data.length > 0 && !leaveTypeId) {
        setLeaveTypeId(ltRes.data[0].id);
      }
    } catch (err) {
      setError('Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate working days in frontend for live preview
  useEffect(() => {
    if (!startDate || !endDate) {
      setCalculatedDays(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setCalculatedDays(0);
      return;
    }

    const holidayDates = new Set(holidays.map((h) => h.date));
    let days = 0;
    let curr = new Date(start);

    while (curr <= end) {
      const dayOfWeek = curr.getDay(); // 0 is Sun, 6 is Sat
      const isoDate = curr.toISOString().split('T')[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(isoDate)) {
        days += 1;
      }
      curr.setDate(curr.getDate() + 1);
    }

    setCalculatedDays(days);
  }, [startDate, endDate, holidays]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate || !reason.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.post('/leave-requests/', {
        leave_type: parseInt(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      const appliedLeave = response.data;
      setMessage(
        `Leave request submitted successfully! Duration: ${appliedLeave.working_days} working days. Initial Status: ${appliedLeave.status}`
      );
      setStartDate('');
      setEndDate('');
      setReason('');
      setCalculatedDays(0);
      fetchData();
      setActiveTab('myLeaves');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (window.confirm('Are you sure you want to cancel this pending leave request?')) {
      try {
        await api.post(`/leave-requests/${id}/cancel/`);
        setMessage('Leave request cancelled successfully.');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to cancel leave request.');
      }
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await api.post(`/leave-requests/${id}/approve/`);
      setMessage('Leave request approved.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve leave request.');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.post(`/leave-requests/${id}/reject/`);
      setMessage('Leave request rejected.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject leave request.');
    }
  };

  const myLeaves = leaves.filter((l) => l.employee === user?.id);
  const pendingOrAllLeaves = leaves; // Includes approvals

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Leave Management</h2>
          <p className="subtitle">Apply for leaves and track request statuses</p>
        </div>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          Apply Leave
        </button>
        <button
          className={`tab-btn ${activeTab === 'myLeaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('myLeaves')}
        >
          My Leaves ({myLeaves.length})
        </button>
        {(user?.role === 'MANAGER' || user?.role === 'HR') && (
          <button
            className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Leave Approvals ({leaves.filter((l) => l.status === 'PENDING').length} Pending)
          </button>
        )}
      </div>

      {activeTab === 'apply' && (
        <div className="card max-w-700">
          <h3>Submit Leave Request</h3>
          <form onSubmit={handleApplyLeave} className="mt-3">
            <div className="form-group">
              <label>Leave Type</label>
              <select
                className="form-control"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                required
              >
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.is_paid ? 'Paid' : 'Unpaid'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group col">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="duration-preview-box">
              <span>Calculated Duration (Excl. Weekends & Public Holidays):</span>
              <strong className="duration-badge">{calculatedDays} working day(s)</strong>
            </div>

            <div className="form-group mt-3">
              <label>Reason</label>
              <textarea
                className="form-control"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for leave..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'myLeaves' && (
        <div className="card">
          <h3>My Leave Applications</h3>
          {loading ? (
            <p className="p-4 text-center">Loading leaves...</p>
          ) : myLeaves.length === 0 ? (
            <p className="p-4 text-center">You have not submitted any leave requests yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Working Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td><strong>{l.leave_type_details?.name}</strong></td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td><strong>{l.working_days} day(s)</strong></td>
                    <td>
                      <span className={`status-pill status-${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>{l.reason}</td>
                    <td>{new Date(l.applied_at).toLocaleDateString()}</td>
                    <td>
                      {l.status === 'PENDING' ? (
                        <button
                          onClick={() => handleCancelLeave(l.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Cancel
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (user?.role === 'MANAGER' || user?.role === 'HR') && (
        <div className="card">
          <h3>Leave Requests & Approvals Workflow</h3>
          {loading ? (
            <p className="p-4 text-center">Loading approvals...</p>
          ) : pendingOrAllLeaves.length === 0 ? (
            <p className="p-4 text-center">No leave requests found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Working Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrAllLeaves.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td><strong>{l.employee_details?.username}</strong> ({l.employee_details?.first_name} {l.employee_details?.last_name})</td>
                    <td>{l.employee_details?.role}</td>
                    <td>{l.leave_type_details?.name}</td>
                    <td>{l.start_date} to {l.end_date}</td>
                    <td><strong>{l.working_days} day(s)</strong></td>
                    <td>
                      <span className={`status-pill status-${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>{l.reason}</td>
                    <td>
                      <div className="btn-group">
                        {/* Manager can approve/reject PENDING */}
                        {user.role === 'MANAGER' && l.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveLeave(l.id)}
                              className="btn btn-sm btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(l.id)}
                              className="btn btn-sm btn-danger"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {/* HR can approve/reject or override any decision (except CANCELLED) */}
                        {user.role === 'HR' && l.status !== 'CANCELLED' && (
                          <>
                            {l.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleApproveLeave(l.id)}
                                className="btn btn-sm btn-success"
                              >
                                {l.status === 'REJECTED' ? 'Override (Approve)' : 'Approve'}
                              </button>
                            )}
                            {l.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleRejectLeave(l.id)}
                                className="btn btn-sm btn-danger"
                              >
                                {l.status === 'APPROVED' ? 'Override (Reject)' : 'Reject'}
                              </button>
                            )}
                          </>
                        )}
                        {l.status === 'CANCELLED' && <span className="text-muted">Cancelled</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  );
};

export default LeaveManagement;
