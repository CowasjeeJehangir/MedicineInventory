import React from 'react';

const ActionButtons = ({ onSave, onCancel }) => {
  return (
    <div className="action-buttons">
      <button type="button" className="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="save-btn">
        Save
      </button>
    </div>
  );
};

export default ActionButtons;