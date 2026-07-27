import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const CreateHRUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    monthly_salary: '',
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error when user edits
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateClient = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    if (!form.confirm_password) errs.confirm_password = 'Please confirm the password.';
    if (form.password && form.confirm_password && form.password !== form.confirm_password) {
      errs.confirm_password = 'Passwords do not match.';
    }
    if (form.monthly_salary === '') {
      errs.monthly_salary = 'Monthly salary is required.';
    } else if (parseFloat(form.monthly_salary) < 0) {
      errs.monthly_salary = 'Monthly salary must be zero or greater.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await api.post('/users/create-hr/', {
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        monthly_salary: parseFloat(form.monthly_salary),
      });

      setSuccessMsg(`HR user "${form.username}" created successfully. Redirecting...`);
      setTimeout(() => navigate('/hr/users'), 1800);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        // Map backend field errors directly
        const mappedErrors = {};
        Object.entries(data).forEach(([key, val]) => {
          mappedErrors[key] = Array.isArray(val) ? val[0] : val;
        });
        setErrors(mappedErrors);
      } else {
        setErrors({ non_field_errors: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Create HR User</h2>
          <p className="subtitle">Add a new HR team member to the system</p>
        </div>
        <button
          onClick={() => navigate('/hr/users')}
          className="btn btn-secondary"
        >
          &larr; Back to User Management
        </button>
      </div>

      {successMsg && <div className="alert-success">{successMsg}</div>}
      {errors.non_field_errors && <div className="alert-error">{errors.non_field_errors}</div>}
      {errors.detail && <div className="alert-error">{errors.detail}</div>}

      <div className="card max-w-700">
        <h3 style={{ marginBottom: '1.25rem' }}>New HR User Details</h3>
        <form onSubmit={handleSubmit} noValidate>

          {/* Role — read-only display */}
          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              className="form-control"
              value="HR"
              readOnly
              style={{ background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#6b7280' }}>Role is automatically set to HR and cannot be changed.</small>
          </div>

          {/* Username */}
          <div className="form-group">
            <label>Username <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="hr-username"
              type="text"
              name="username"
              className={`form-control ${errors.username ? 'input-error' : ''}`}
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. hr_jane"
              autoComplete="off"
              required
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          {/* First & Last Name */}
          <div className="form-row">
            <div className="form-group col">
              <label>First Name</label>
              <input
                id="hr-first-name"
                type="text"
                name="first_name"
                className="form-control"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Jane"
              />
            </div>
            <div className="form-group col">
              <label>Last Name</label>
              <input
                id="hr-last-name"
                type="text"
                name="last_name"
                className="form-control"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="hr-email"
              type="email"
              name="email"
              className={`form-control ${errors.email ? 'input-error' : ''}`}
              value={form.email}
              onChange={handleChange}
              placeholder="jane.doe@company.com"
              autoComplete="off"
              required
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Monthly Salary */}
          <div className="form-group">
            <label>Monthly Salary <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="hr-salary"
              type="number"
              name="monthly_salary"
              className={`form-control ${errors.monthly_salary ? 'input-error' : ''}`}
              value={form.monthly_salary}
              onChange={handleChange}
              placeholder="e.g. 80000"
              min="0"
              step="0.01"
              required
            />
            {errors.monthly_salary && <span className="field-error">{errors.monthly_salary}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="hr-password"
              type="password"
              name="password"
              className={`form-control ${errors.password ? 'input-error' : ''}`}
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              required
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="hr-confirm-password"
              type="password"
              name="confirm_password"
              className={`form-control ${errors.confirm_password ? 'input-error' : ''}`}
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
            {errors.confirm_password && <span className="field-error">{errors.confirm_password}</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              id="create-hr-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create HR User'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/hr/users')}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateHRUser;
