import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const LeaveTypesAndHolidays = () => {
  const [activeTab, setActiveTab] = useState('leaveTypes');

  // Leave Types state
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [ltLoading, setLtLoading] = useState(true);
  const [showLtModal, setShowLtModal] = useState(false);
  const [editingLt, setEditingLt] = useState(null);
  const [ltForm, setLtForm] = useState({ name: '', is_paid: true, description: '' });

  // Public Holidays state
  const [holidays, setHolidays] = useState([]);
  const [hLoading, setHLoading] = useState(true);
  const [showHModal, setShowHModal] = useState(false);
  const [editingH, setEditingH] = useState(null);
  const [hForm, setHForm] = useState({ name: '', date: '' });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchLeaveTypes = async () => {
    setLtLoading(true);
    try {
      const res = await api.get('/leave-types/');
      setLeaveTypes(res.data);
    } catch (err) {
      setError('Failed to fetch leave types.');
    } finally {
      setLtLoading(false);
    }
  };

  const fetchHolidays = async () => {
    setHLoading(true);
    try {
      const res = await api.get('/holidays/');
      setHolidays(res.data);
    } catch (err) {
      setError('Failed to fetch holidays.');
    } finally {
      setHLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
    fetchHolidays();
  }, []);

  // Leave Type actions
  const handleOpenLtModal = (lt = null) => {
    setEditingLt(lt);
    setLtForm(lt ? { name: lt.name, is_paid: lt.is_paid, description: lt.description || '' } : { name: '', is_paid: true, description: '' });
    setShowLtModal(true);
    setMessage(null);
    setError(null);
  };

  const handleSaveLt = async (e) => {
    e.preventDefault();
    try {
      if (editingLt) {
        await api.put(`/leave-types/${editingLt.id}/`, ltForm);
        setMessage('Leave type updated successfully.');
      } else {
        await api.post('/leave-types/', ltForm);
        setMessage('Leave type created successfully.');
      }
      setShowLtModal(false);
      fetchLeaveTypes();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to save leave type.');
    }
  };

  const handleDeleteLt = async (id, name) => {
    if (window.confirm(`Delete leave type "${name}"?`)) {
      try {
        await api.delete(`/leave-types/${id}/`);
        setMessage(`Leave type "${name}" deleted.`);
        fetchLeaveTypes();
      } catch (err) {
        setError('Failed to delete leave type.');
      }
    }
  };

  // Holiday actions
  const handleOpenHModal = (h = null) => {
    setEditingH(h);
    setHForm(h ? { name: h.name, date: h.date } : { name: '', date: '' });
    setShowHModal(true);
    setMessage(null);
    setError(null);
  };

  const handleSaveH = async (e) => {
    e.preventDefault();
    try {
      if (editingH) {
        await api.put(`/holidays/${editingH.id}/`, hForm);
        setMessage('Public holiday updated successfully.');
      } else {
        await api.post('/holidays/', hForm);
        setMessage('Public holiday added successfully.');
      }
      setShowHModal(false);
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.date?.[0] || 'Failed to save public holiday.');
    }
  };

  const handleDeleteH = async (id, name) => {
    if (window.confirm(`Delete holiday "${name}"?`)) {
      try {
        await api.delete(`/holidays/${id}/`);
        setMessage(`Holiday "${name}" deleted.`);
        fetchHolidays();
      } catch (err) {
        setError('Failed to delete holiday.');
      }
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Types & Public Holidays Management</h2>
          <p className="subtitle">Configure leave policies and holiday calendars</p>
        </div>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'leaveTypes' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaveTypes')}
        >
          Leave Types
        </button>
        <button
          className={`tab-btn ${activeTab === 'holidays' ? 'active' : ''}`}
          onClick={() => setActiveTab('holidays')}
        >
          Public Holidays
        </button>
      </div>

      {activeTab === 'leaveTypes' && (
        <div className="card">
          <div className="card-header-actions">
            <h3>Leave Types</h3>
            <button onClick={() => handleOpenLtModal()} className="btn btn-primary btn-sm">
              + Add Leave Type
            </button>
          </div>
          {ltLoading ? (
            <p className="p-4 text-center">Loading leave types...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((lt) => (
                  <tr key={lt.id}>
                    <td>{lt.id}</td>
                    <td><strong>{lt.name}</strong></td>
                    <td><code>{lt.code}</code></td>
                    <td>
                      <span className={`status-pill ${lt.is_paid ? 'active' : 'inactive'}`}>
                        {lt.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>{lt.description || '-'}</td>
                    <td>
                      <div className="btn-group">
                        <button onClick={() => handleOpenLtModal(lt)} className="btn btn-sm btn-secondary">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteLt(lt.id, lt.name)} className="btn btn-sm btn-danger">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="card">
          <div className="card-header-actions">
            <h3>Public Holidays</h3>
            <button onClick={() => handleOpenHModal()} className="btn btn-primary btn-sm">
              + Add Holiday
            </button>
          </div>
          {hLoading ? (
            <p className="p-4 text-center">Loading holidays...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Holiday Name</th>
                  <th>Date</th>
                  <th>Day of Week</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => {
                  const d = new Date(h.date);
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                  return (
                    <tr key={h.id}>
                      <td>{h.id}</td>
                      <td><strong>{h.name}</strong></td>
                      <td>{h.date}</td>
                      <td>{dayName}</td>
                      <td>
                        <div className="btn-group">
                          <button onClick={() => handleOpenHModal(h)} className="btn btn-sm btn-secondary">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteH(h.id, h.name)} className="btn btn-sm btn-danger">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Leave Type Modal */}
      {showLtModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingLt ? 'Edit Leave Type' : 'Add Leave Type'}</h3>
              <button onClick={() => setShowLtModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSaveLt}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Leave Type Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ltForm.name}
                    onChange={(e) => setLtForm({ ...ltForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Policy</label>
                  <select
                    className="form-control"
                    value={ltForm.is_paid}
                    onChange={(e) => setLtForm({ ...ltForm, is_paid: e.target.value === 'true' })}
                  >
                    <option value="true">Paid Leave</option>
                    <option value="false">Unpaid Leave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={ltForm.description}
                    onChange={(e) => setLtForm({ ...ltForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLtModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLt ? 'Save Changes' : 'Create Leave Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Public Holiday Modal */}
      {showHModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingH ? 'Edit Public Holiday' : 'Add Public Holiday'}</h3>
              <button onClick={() => setShowHModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSaveH}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Holiday Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={hForm.name}
                    onChange={(e) => setHForm({ ...hForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={hForm.date}
                    onChange={(e) => setHForm({ ...hForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowHModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingH ? 'Save Changes' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveTypesAndHolidays;
