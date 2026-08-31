// components/StatusBadge.js
import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case 'instock': return 'In Stock';
      case 'low': return 'Low Stock';
      case 'expired': return 'Expired/Out';
      default: return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'normal': return 'status-normal';
      case 'low': return 'status-low';
      case 'expired': return 'status-expired';
      default: return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;