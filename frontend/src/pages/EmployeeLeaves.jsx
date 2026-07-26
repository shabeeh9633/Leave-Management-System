import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const EmployeeLeaves = () => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('apply');
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

  // Live preview: calculate working days client-side
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
      const dayOfWeek = curr.getDay();
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
      const applied = response.data;
      const statusMsg = applied.needs_manager_approval
        ? 'Submitted for Manager approval (PENDING).'
        : 'Automatically approved.';
      setMessage(
        `Leave request submitted. Duration: ${applied.working_days} working day(s). Status: ${applied.status}. ${statusMsg}`
      );
      setStartDate('');
      setEndDate('');
      setReason('');
      setCalculatedDays(0);
      await fetchData();
      setActiveTab('myLeaves');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Cancel this pending leave request?')) return;
    try {
      await api.post(`/leave-requests/${id}/cancel/`);
      setMessage('Leave request cancelled.');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel leave request.');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>My Leaves</h2>
          <p className="subtitle">Apply for leave and track your requests</p>
        </div>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => { setActiveTab('apply'); setMessage(null); setError(null); }}
        >
          Apply Leave
        </button>
        <button
          className={`tab-btn ${activeTab === 'myLeaves' ? 'active' : ''}`}
          onClick={() => { setActiveTab('myLeaves'); setMessage(null); setError(null); }}
        >
          My Requests ({leaves.length})
        </button>
      </div>

      {/* Apply Leave Form */}
      {activeTab === 'apply' && (
        <div className="card max-w-700">
          <h3>Submit Leave Request</h3>
          <form onSubmit={handleApplyLeave} className="mt-3">
            <div className="form-group">
              <label>Leave Type</label>
              <select
                id="leave-type-select"
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
                  id="leave-start-date"
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
                  id="leave-end-date"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="duration-preview-box">
              <span>Calculated Duration (excl. weekends &amp; public holidays):</span>
              <strong className="duration-badge">{calculatedDays} working day(s)</strong>
            </div>

            <div className="form-group mt-3">
              <label>Reason</label>
              <textarea
                id="leave-reason"
                className="form-control"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason for your leave..."
                required
              />
            </div>

            <button
              id="submit-leave-btn"
              type="submit"
              className="btn btn-primary btn-block mt-3"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>
      )}

      {/* My Leave Requests */}
      {activeTab === 'myLeaves' && (
        <div className="card">
          <h3>My Leave Requests</h3>
          {loading ? (
            <p className="p-4 text-center">Loading...</p>
          ) : leaves.length === 0 ? (
            <p className="p-4 text-center">No leave requests submitted yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Working Days</th>
                  <th>Status</th>
                  <th>Approval Required</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td><strong>{l.leave_type_details?.name}</strong></td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td><strong>{l.working_days}</strong></td>
                    <td>
                      <span className={`status-pill status-${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.needs_manager_approval
                        ? <span className="status-pill status-pending">Manager Review</span>
                        : <span className="status-pill status-approved">Auto</span>
                      }
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
                      ) : '-'}
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

export default EmployeeLeaves;
