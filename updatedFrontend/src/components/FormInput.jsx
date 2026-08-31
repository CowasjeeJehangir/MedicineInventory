import React from 'react';

const FormInput = ({ 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  required = false,
  step
}) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="input-container">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          step={step}
        />
      </div>
    </div>
  );
};

export default FormInput;