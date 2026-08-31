// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import PatientForm from '../components/PatientForm';
// import '../styles/AddPatient.css';

// const AddPatientPage = () => {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');

//   // API base URL - should match your Flask server

//   const handleSavePatient = async (patientData) => {
//     setIsLoading(true);
//     setError('');
    
//     console.log('AddPatientPage - Attempting to create patient with:', patientData);
    
//     try {
//       const response = await fetch(ENDPOINTS.PATIENTS, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(patientData),
//       });

//       console.log('AddPatientPage - Response status:', response.status);

//       const data = await response.json();
//       console.log('AddPatientPage - Response data:', data);

//       if (data.success) {
//         // Show success message
//         alert(`Patient "${data.patient.name}" added successfully!\nPatient ID: ${data.patient.patient_id}`);
        
//         // Navigate back to patient list
//         navigate('/pharmacy-patients');
//       } else {
//         setError(data.message || 'Failed to add patient');
//       }
//     } catch (error) {
//       console.error('AddPatientPage - Error:', error);
//       setError('Failed to connect to server. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (isLoading) {
//       return; // Prevent navigation while loading
//     }
    
//     const shouldLeave = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
//     if (shouldLeave) {
//       navigate('/pharmacy-patients');
//     }
//   };

//   return (
//     <div className="add-patient-container">
//       <div className="add-patient-card">
//         <Header />
        
//         <div className="page-header">
//           <h2>Add New Patient</h2>
//           <p>Enter patient information to add them to the system</p>
          
//           {/* Debug Info */}
//           <div style={{ 
//             fontSize: '12px', 
//             color: '#666', 
//             marginTop: '10px',
//             padding: '10px',
//             backgroundColor: '#f8f9fa',
//             borderRadius: '4px',
//             border: '1px solid #dee2e6'
//           }}>
//             <strong>Debug Info:</strong><br />
//             API URL: {ENDPOINTS.PATIENTS}<br />
//             Connection Status: <span style={{ 
//               color: connectionStatus === 'connected' ? 'green' : 
//                     connectionStatus === 'failed' ? 'red' : 'orange' 
//             }}>
//               {connectionStatus}
//             </span>
//             <button 
//               onClick={testConnection}
//               style={{
//                 marginLeft: '10px',
//                 padding: '4px 8px',
//                 fontSize: '10px',
//                 backgroundColor: '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '3px',
//                 cursor: 'pointer'
//               }}
//             >
//               Test Connection
//             </button>
//           </div>
//         </div>
        
//         {error && (
//           <div className="error-message">
//             <p>{error}</p>
//           </div>
//         )}
        
//         <PatientForm 
//           onSave={handleSavePatient}
//           onCancel={handleCancel}
//           isLoading={isLoading}
//         />
        
//         <Footer />
//       </div>
//     </div>
//   );
// };

// export default AddPatientPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PatientForm from './PatientForm';
import '../styles/AddPatient.css';
import { ENDPOINTS } from '../config/api';

const AddPatientPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // API base URL - should match your Flask server

  const handleSavePatient = async (patientData) => {
    console.log('=== SAVE PATIENT FUNCTION CALLED ===');
    console.log('1. Raw patient data received:', patientData);
    console.log('2. Data type:', typeof patientData);
    console.log('3. Data keys:', Object.keys(patientData || {}));
    console.log('4. Is loading before:', isLoading);
    
    setIsLoading(true);
    setError('');
    
    console.log('5. Is loading after setState:', true);
    
    // Validate the data structure
    if (!patientData || typeof patientData !== 'object') {
      console.error('6. VALIDATION FAILED - Invalid patient data format');
      setError('Invalid patient data format');
      setIsLoading(false);
      return;
    }
    
    if (!patientData.name || !patientData.ward || !patientData.medicines) {
      console.error('7. VALIDATION FAILED - Missing required fields');
      console.error('   - Name:', patientData.name);
      console.error('   - Ward:', patientData.ward); 
      console.error('   - Medicines:', patientData.medicines);
      setError('Missing required fields: name, ward, and medicines are required');
      setIsLoading(false);
      return;
    }
    
    console.log('8. Validation passed, preparing request');
    
    const requestData = {
      name: patientData.name,
      phone_number: patientData.phone_number || '',
      ward: patientData.ward,
      medicines: patientData.medicines,
      diagnosis: patientData.diagnosis || ''
    };
    
    console.log('9. Request data prepared:', requestData);
    console.log('10. API URL:', ENDPOINTS.PATIENTS);
    
    try {
      console.log('11. About to make fetch request...');
      
      const response = await fetch(ENDPOINTS.PATIENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('12. Fetch completed');
      console.log('13. Response received:', response);
      console.log('14. Response status:', response.status);
      console.log('15. Response ok:', response.ok);
      console.log('16. Response status text:', response.statusText);

      if (!response.ok) {
        console.error('17. Response not OK, reading error...');
        const errorText = await response.text();
        console.error('18. Error response text:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('19. Error response JSON:', errorData);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (parseError) {
          console.error('20. Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }

      console.log('21. Reading success response...');
      const data = await response.json();
      console.log('22. Success response data:', data);

      if (data.success && data.patient) {
        console.log('23. Patient created successfully:', data.patient);
        
        // Show success message
        alert(`Patient "${data.patient.name}" added successfully!\nPatient ID: ${data.patient.patient_id}`);
        
        // Navigate back to patient list
        console.log('24. Navigating back to patient list');
        navigate('/pharmacy-patients');
      } else {
        console.error('25. Success flag false or no patient data:', data);
        setError(data.message || 'Failed to add patient - no patient data returned');
      }
    } catch (error) {
      console.error('26. CATCH BLOCK - Error occurred:');
      console.error('    Error message:', error.message);
      console.error('    Error stack:', error.stack);
      console.error('    Full error object:', error);
      setError(error.message || 'Failed to connect to server. Please try again.');
    } finally {
      console.log('27. Finally block - setting loading to false');
      setIsLoading(false);
    }
    
    console.log('=== SAVE PATIENT FUNCTION COMPLETE ===');
  };

  const handleCancel = () => {
    console.log('Cancel clicked');
    if (isLoading) {
      console.log('Preventing cancel during loading');
      return;
    }
    
    const shouldLeave = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
    if (shouldLeave) {
      navigate('/pharmacy-patients');
    }
  };

  // Test connection function
  const testConnection = async () => {
    console.log('=== TESTING CONNECTION ===');
    try {
      console.log('Testing basic connection...');
      const response = await fetch(ENDPOINTS.TEST);
      console.log('Test response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Test response data:', data);
        alert('Connection test successful!');
      } else {
        console.log('Test failed with status:', response.status);
        alert('Connection test failed with status: ' + response.status);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      alert('Connection test failed: ' + error.message);
    }
    console.log('=== CONNECTION TEST COMPLETE ===');
  };

  return (
    <div className="add-patient-container">
      <div className="add-patient-card">
        <Header />
        
        <div className="page-header">
          <h2>Add New Patient</h2>
          <p>Enter patient information to add them to the system</p>
          
          {/* Debug section */}
          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <strong>Debug Info:</strong><br />
            API URL: {ENDPOINTS.PATIENTS}<br />
            Is Loading: {isLoading ? 'Yes' : 'No'}<br />
            <button 
              onClick={testConnection}
              style={{
                marginTop: '5px',
                padding: '4px 8px',
                fontSize: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Test Connection
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <PatientForm 
          onSave={handleSavePatient}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
        
        <Footer />
      </div>
    </div>
  );
};

export default AddPatientPage;