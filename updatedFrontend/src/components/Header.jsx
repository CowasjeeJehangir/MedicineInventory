import React from 'react';

const Header = () => {
  return (
    <div
      className="header"
      style={{
        backgroundColor: "#add3eb",
        color: "white",
        padding: "20px",
        textAlign: "center"
      }}
    >
      <div className="logo">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <h1 className="title">Cowasjee Psychiatric Institute</h1>
      <p className="subtitle">Pharmacy Inventory System</p>
    </div>
  );
};

export default Header;
