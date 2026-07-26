import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'EMPLOYEE',
    monthly_salary: 5000,
    is_active: true,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role: 'EMPLOYEE',
      monthly_salary: 5000,
      is_active: true,
    });
    setShowModal(true);
    setMessage(null);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      role: user.role,
      monthly_salary: user.monthly_salary || 5000,
      is_active: user.is_active,
    });
    setShowModal(true);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${editingUser.id}/`, payload);
        setMessage('User updated successfully.');
      } else {
        await api.post('/users/', formData);
        setMessage('User created successfully.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      const errDetail = err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Failed to save user.';
      setError(errDetail);
    }
  };

  const handleDelete = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await api.delete(`/users/${id}/`);
        setMessage(`User "${username}" deleted successfully.`);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user.');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.post(`/users/${id}/toggle_active/`);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user active status.');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p className="subtitle">Manage company employees, managers, and HR accounts</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          + Add New User
        </button>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="text-center p-4">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center p-4">No users found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Monthly Salary ($)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email || '-'}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>${Number(u.monthly_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`status-pill ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        onClick={() => handleToggleActive(u.id)}
                        className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="btn btn-sm btn-danger"
                      >
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

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group col">
                    <label>Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                  <div className="form-group col">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group col">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col">
                    <label>Password {editingUser && '(Leave blank to keep current)'}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                  <div className="form-group col">
                    <label>Role</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col">
                    <label>Monthly Salary ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.monthly_salary}
                      onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group col">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserManagement;
