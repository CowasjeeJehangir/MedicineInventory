import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';

function MedicineDispenseForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    wardName: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 1, name: '', quantity: '' },
      { id: 2, name: '', quantity: '' },
      { id: 3, name: '', quantity: '' },
      { id: 4, name: '', quantity: '' }
    ],
    staffName: '',
    doctorName: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    const newId = Math.max(...formData.items.map(item => item.id)) + 1;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, name: '', quantity: '' }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  return (
    <div className="medicine-dispense-form">
      <div className="form-container">
        {/* Header */}
        <div className="form-header">
          <div className="form-title">
            <FileText className="title-icon" />
            <h1>Medicine Dispense</h1>
          </div>
          <div className="form-badge">
            Original
          </div>
        </div>

        <div className="form-content">
          {/* Ward and Date */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ward Name</label>
              <input
                type="text"
                value={formData.wardName}
                onChange={(e) => handleInputChange('wardName', e.target.value)}
                className="form-input"
                placeholder="Enter ward name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section">
            <div className="items-header">
              <h2>Medicine Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="add-item-btn"
              >
                <Plus className="btn-icon" />
                Add Item
              </button>
            </div>

            <div className="items-table">
              {/* Table Header */}
              <div className="table-header">
                <div className="col-sno">S.No</div>
                <div className="col-item">Item</div>
                <div className="col-qty">Qty Required</div>
                <div className="col-action">Action</div>
              </div>

              {/* Table Rows */}
              {formData.items.map((item, index) => (
                <div key={item.id} className="table-row">
                  <div className="col-sno">
                    {index + 1}
                  </div>
                  <div className="col-item">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="table-input"
                      placeholder="Enter medicine name"
                    />
                  </div>
                  <div className="col-qty">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="table-input"
                      placeholder="Qty"
                      min="0"
                    />
                  </div>
                  <div className="col-action">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="remove-btn"
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="btn-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff and Doctor Names */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Staff Name</label>
              <input
                type="text"
                value={formData.staffName}
                onChange={(e) => handleInputChange('staffName', e.target.value)}
                className="form-input"
                placeholder="Enter staff name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor Name</label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) => handleInputChange('doctorName', e.target.value)}
                className="form-input"
                placeholder="Enter doctor name"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              onClick={handleSubmit}
              className="submit-btn"
            >
              <Save className="btn-icon" />
              Save Inventory
            </button>
          </div>

          {/* Display formatted date */}
          <div className="date-display">
            Formatted Date: {formatDate(formData.date)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicineDispenseForm;