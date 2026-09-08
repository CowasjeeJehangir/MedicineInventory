import React, { useState } from 'react';
import { useNotification } from './NotificationProvider';

const MedicineStock= ({ medicine, onSave, onCancel }) => {
  const showNotification = useNotification();
  const [formData, setFormData] = useState({
    article: medicine?.article || '',
    particulars: medicine?.particulars || '',
    folio: medicine?.folio || '',
    receipts: medicine?.receipts || '',
    issued: medicine?.issued || '',
    balance: medicine?.balance || '',
    remarks: medicine?.remarks || ''
  });

  const handleSubmit = () => {
    if (!formData.article || !formData.balance) {
      showNotification('Please fill in the medicine name and balance.', 'error');
      return;
    }
    onSave(formData);
  };

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Article/Medicine Name *</label>
        <input
          type="text"
          className="form-input"
          value={formData.article}
          onChange={(e) => setFormData({...formData, article: e.target.value})}
          placeholder="Enter medicine name"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Particulars</label>
        <input
          type="text"
          className="form-input"
          value={formData.particulars}
          onChange={(e) => setFormData({...formData, particulars: e.target.value})}
          placeholder="Enter particulars"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Folio</label>
        <input
          type="text"
          className="form-input"
          value={formData.folio}
          onChange={(e) => setFormData({...formData, folio: e.target.value})}
          placeholder="Enter folio number"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Receipts</label>
        <input
          type="number"
          className="form-input"
          value={formData.receipts}
          onChange={(e) => setFormData({...formData, receipts: e.target.value})}
          placeholder="Enter receipts quantity"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Issued</label>
        <input
          type="number"
          className="form-input"
          value={formData.issued}
          onChange={(e) => setFormData({...formData, issued: e.target.value})}
          placeholder="Enter issued quantity"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Balance *</label>
        <input
          type="number"
          className="form-input"
          value={formData.balance}
          onChange={(e) => setFormData({...formData, balance: e.target.value})}
          placeholder="Enter current balance"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Remarks</label>
        <input
          type="text"
          className="form-input"
          value={formData.remarks}
          onChange={(e) => setFormData({...formData, remarks: e.target.value})}
          placeholder="Enter remarks"
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          Save Medicine
        </button>
      </div>
    </div>
  );
};

export default MedicineStock;
