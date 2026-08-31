import React from 'react';

const SecurityNotice = () => {
  return (
    <div className="security-notice">
      <div className="notice-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      <div className="notice-content">
        <h4>Security Notice</h4>
        <p>This system contains confidential patient and medication data. Unauthorized access is strictly prohibited.</p>
      </div>
    </div>
  );
};

export default SecurityNotice;