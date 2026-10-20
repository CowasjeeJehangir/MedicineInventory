import React, { useState } from 'react';
import InputField from './InputField';
import { cnicError, phoneError } from '../utils/contactValidation';
import ActionButtons from './ActionButtons';

const PatientForm = ({ onSave, onCancel }) => {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    patientId: generatePatientId(),
    cnic: '',
    phone_number: '',
    medicines: '',
    ward: '',
    diagnosis: ''
  });

  function generatePatientId() {
    const prefix = 'P';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { cnic: cnicError(formData.cnic, false), phone_number: phoneError(formData.phone_number, false) };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    onSave(formData);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="patient-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M4 20c0-4 8-4 8-4s8 0 8 4" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <span className="form-title">Patient Information</span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <InputField
            label="Patient Name"
            type="text"
            placeholder="Enter patient name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          <InputField
            label="Patient ID (auto-generated)"
            type="text"
            value={formData.patientId}
            disabled
          />
        </div>

        <div className="form-row">
          <InputField
            label="Assigned Medicines"
            type="text"
            placeholder="e.g., Paracetamol, Ibuprofen"
            value={formData.medicines}
            onChange={(e) => handleChange('medicines', e.target.value)}
            required
          />

          <InputField
            label="Phone Number"
            type="tel"
            error={errors.phone_number}
            hint="Optional: 03001234567 or +923001234567."
            placeholder="03001234567"
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
          />
        </div>

        <div className="form-row">
          <InputField
            label="CNIC"
            type="text"
            inputMode="numeric"
            maxLength={15}
            error={errors.cnic}
            hint="Optional: 13 digits, with or without hyphens."
            placeholder="42101-1234567-1"
            value={formData.cnic}
            onChange={(e) => handleChange('cnic', e.target.value)}
          />

          <InputField
            label="Ward Number"
            type="text"
            placeholder="e.g., A1"
            value={formData.ward}
            onChange={(e) => handleChange('ward', e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <InputField
            label="Diagnosis"
            type="text"
            placeholder="Enter diagnosis (optional)"
            value={formData.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
          />
        </div>

        <ActionButtons 
          onSave={handleSubmit}
          onCancel={onCancel}
        />
      </form>
    </div>
  );
};

export default PatientForm;
