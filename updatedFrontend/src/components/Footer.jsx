import React from 'react';

const Footer = () => {
  return (
    <div className="footer">
      <p>© {new Date().getFullYear()} Cowasjee Psychiatric Institute</p>
      <p>Pharmacy Inventory Management System v2.1</p>
    </div>
  );
};

export default Footer;