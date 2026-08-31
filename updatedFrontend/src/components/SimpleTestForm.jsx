import React, { useState } from 'react';

const SimpleTestForm = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('SimpleTestForm - handleSubmit called');
    console.log('SimpleTestForm - Name value:', name);
    console.log('SimpleTestForm - onSave function:', typeof onSave);
    
    if (onSave) {
      console.log('SimpleTestForm - Calling onSave');
      onSave({ name, patient_id: 'TEST123' });
    } else {
      console.error('SimpleTestForm - No onSave function provided');
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px' }}>
      <h3>Simple Test Form</h3>
      <p>This is a minimal form to test the submission flow</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Test Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a test name"
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Submit Test
          </button>
          
          <button 
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button 
            type="button"
            onClick={() => {
              console.log('Direct call test');
              if (onSave) onSave({ name: 'Direct Test', patient_id: 'DIRECT123' });
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Direct Call Test
          </button>
        </div>
      </form>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        Current name value: "{name}"<br />
        onSave function available: {onSave ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

export default SimpleTestForm;