import React, { useState } from 'react';
import InputField from './InputField';
import ActionButtons from './ActionButtons';

const MedicineForm = ({ onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    potential_allergens: '',
    restock_threshold: '10',
    needs_prescription: false,
    // Batch/Stock fields
    batch_no: '',
    initial_stock: '',
    price_per_unit: '0.00',
    best_before: '',
    // Particulars fields (B, F, T)
    particulars_b: '0',
    particulars_f: '0',
    particulars_t: '0',
    pharmacyId: generatePharmacyId()
  });

  function generatePharmacyId() {
    const prefix = 'PH';
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="medicine-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 12h-6m-6 0H3m9-9v6m0 6v6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <span className="form-title">Medicine Information</span>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-row">
          <InputField
            label="Medicine Name"
            type="text"
            placeholder="Enter medicine name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isLoading}
            required
          />

          <InputField
            label="Potential Allergens"
            type="text"
            placeholder="e.g., Penicillin, Sulfa"
            value={formData.potential_allergens}
            onChange={(e) => handleChange('potential_allergens', e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <InputField
            label="Restock Threshold"
            type="number"
            placeholder="Minimum stock level (default: 10)"
            value={formData.restock_threshold}
            onChange={(e) => handleChange('restock_threshold', e.target.value)}
            disabled={isLoading}
            min="0"
          />

          <InputField
            label="Pharmacy ID (auto-generated)"
            type="text"
            value={formData.pharmacyId}
            disabled
          />
        </div>

        {/* Prescription checkbox */}
        <div className="form-row">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }}>
            <input
              type="checkbox"
              id="needs_prescription"
              name="needs_prescription"
              checked={formData.needs_prescription}
              onChange={handleInputChange}
              disabled={isLoading}
              style={{ marginRight: '8px' }}
            />
            <label 
              htmlFor="needs_prescription" 
              style={{ 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              This medicine requires a prescription
            </label>
          </div>
        </div>

        {/* Initial Stock Section */}
        <div className="form-section">
          
          <div className="form-row">
            <InputField
              label="Batch Number"
              type="text"
              placeholder="Enter batch number"
              value={formData.batch_no}
              onChange={(e) => handleChange('batch_no', e.target.value)}
              disabled={isLoading}
            />

            <InputField
              label="Initial Quantity"
              type="number"
              placeholder="Enter quantity"
              value={formData.initial_stock}
              onChange={(e) => handleChange('initial_stock', e.target.value)}
              disabled={isLoading}
              min="0"
            />
          </div>

          <div className="form-row">
            <InputField
              label="Price per Unit"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price_per_unit}
              onChange={(e) => handleChange('price_per_unit', e.target.value)}
              disabled={isLoading}
              min="0"
            />

            <InputField
              label="Expiry Date"
              type="date"
              value={formData.best_before}
              onChange={(e) => handleChange('best_before', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Particulars breakdown (B, F, T) */}
        <div className="form-section">
          
          <div className="form-row">
            <InputField
              label="Particulars B"
              type="number"
              placeholder="0"
              value={formData.particulars_b}
              onChange={(e) => handleChange('particulars_b', e.target.value)}
              disabled={isLoading}
              min="0"
            />

            <InputField
              label="Particulars F"
              type="number"
              placeholder="0"
              value={formData.particulars_f}
              onChange={(e) => handleChange('particulars_f', e.target.value)}
              disabled={isLoading}
              min="0"
            />
          </div>

          <div className="form-row">
            <InputField
              label="Particulars T"
              type="number"
              placeholder="0"
              value={formData.particulars_t}
              onChange={(e) => handleChange('particulars_t', e.target.value)}
              disabled={isLoading}
              min="0"
            />
            
            <InputField
              label="Total Issued (Auto-calculated)"
              type="number"
              value={
                (parseInt(formData.particulars_b) || 0) + 
                (parseInt(formData.particulars_f) || 0) + 
                (parseInt(formData.particulars_t) || 0)
              }
              disabled
            />
          </div>
        </div>

        <ActionButtons 
          onSave={handleSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      </form>
    </div>
  );
};

export default MedicineForm;