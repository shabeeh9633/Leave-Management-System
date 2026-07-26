import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const SalaryCalculation = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await api.get('/users/');
        setUsers(res.data);
        if (res.data.length > 0) {
          setSelectedEmployeeId(res.data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch employee list.');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !year || !month) {
      setError('Please select employee, year, and month.');
      return;
    }

    setCalculating(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.get('/salary/calculate/', {
        params: {
          employee_id: selectedEmployeeId,
          year: parseInt(year),
          month: parseInt(month),
        },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate salary.');
    } finally {
      setCalculating(false);
    }
  };

  const monthsList = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Monthly Salary Calculation</h2>
          <p className="subtitle">Compute payable days and final monthly salary using approved leave records</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card max-w-700">
        <h3>Calculation Parameters</h3>
        {loadingUsers ? (
          <p className="p-4">Loading employee list...</p>
        ) : (
          <form onSubmit={handleCalculate} className="mt-3">
            <div className="form-group">
              <label>Select Employee</label>
              <select
                className="form-control"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.first_name} {u.last_name}) - {u.role} [${u.monthly_salary}/mo]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label>Month</label>
                <select
                  className="form-control"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group col">
                <label>Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min="2020"
                  max="2035"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3" disabled={calculating}>
              {calculating ? 'Calculating...' : 'Calculate Monthly Salary'}
            </button>
          </form>
        )}
      </div>

      {result && (
        <div className="card max-w-700 mt-4 border-highlight">
          <div className="result-header">
            <h3>Salary Calculation Summary</h3>
            <span className="result-tag">{result.employee_name} ({monthsList.find((m) => m.value === result.month)?.name} {result.year})</span>
          </div>

          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">Base Monthly Salary</span>
              <strong className="result-value">${result.base_monthly_salary.toFixed(2)}</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Total Working Days (Mon-Fri)</span>
              <strong className="result-value">{result.total_working_days} days</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Public Holidays (Mon-Fri)</span>
              <strong className="result-value text-info">{result.public_holidays} days</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Net Working Days</span>
              <strong className="result-value">{result.net_working_days} days</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Approved Paid Leave</span>
              <strong className="result-value text-success">{result.approved_paid_leave} days</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Unpaid Leave</span>
              <strong className="result-value text-danger">{result.unpaid_leave} days</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Calculated Payable Days</span>
              <strong className="result-value highlight">{result.payable_days} days</strong>
            </div>

            <div className="result-item">
              <span className="result-label">Effective Daily Rate</span>
              <strong className="result-value">${result.daily_rate.toFixed(2)} / day</strong>
            </div>
          </div>

          <div className="final-salary-banner mt-4">
            <span>Final Salary Payable:</span>
            <span className="final-amount">${result.final_salary_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SalaryCalculation;
