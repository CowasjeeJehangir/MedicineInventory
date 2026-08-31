import React, { useState, useEffect } from 'react';
import InputField from './InputField';

const UserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    cnic: '',
    phone_number: '',
    password: '',
    role: 'Staff',
    status: 'Active'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        name: user.name || user.username,
        cnic: user.cnic || '',
        phone_number: user.phone_number || '',
        password: '',
        role: user.role,
        status: user.status
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{user ? 'Edit User' : 'Add New User'}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <InputField
              label="Username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
            />

            <InputField
              label="Account ID"
              type="text"
              placeholder="Enter login account ID"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <InputField
              label="Full Name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            <InputField
              label="CNIC"
              type="number"
              placeholder="Enter CNIC"
              value={formData.cnic}
              onChange={(e) => handleChange('cnic', e.target.value)}
              required={!user}
              disabled={!!user}
            />
          </div>

          <div className="form-row">
            <InputField
              label="Phone Number"
              type="number"
              placeholder="Enter phone number"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              required
            />
            <div></div>
          </div>

          <div className="form-row">
            <InputField
              label={user ? "New Password (leave blank to keep current)" : "Password"}
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required={!user}
            />

            <div className="form-group">
              <label>Role</label>
              <select 
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                required
              >
                <option value="Admin">Admin</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select 
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div></div> {/* Empty div for spacing */}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {user ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
