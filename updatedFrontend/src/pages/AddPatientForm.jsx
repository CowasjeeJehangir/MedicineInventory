import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PatientForm from '../components/PatientForm';
import '../styles/MedicineForm.css'; // Reuse the same CSS for layout
import { ENDPOINTS, apiFetch } from '../config/api';
import { useNotification } from '../components/NotificationProvider';

const AddPatientForm = ({ onSave }) => {
  const navigate = useNavigate();
  const showNotification = useNotification();

  const handleSave = async (patientData) => {
    console.log('Save patient:', patientData);
    try {
      await apiFetch(ENDPOINTS.PATIENTS, {
        method: 'POST',
        body: JSON.stringify({
          name: patientData.name,
          cnic: patientData.cnic ? Number(patientData.cnic) : null,
          phone_number: patientData.phone_number ? Number(patientData.phone_number) : null,
          ward_code: patientData.ward,
          diagnosis: patientData.diagnosis || null,
          medicines: patientData.medicines || null,
        }),
      });
      onSave?.(patientData);
      navigate('/pharmacy-patientlist');
    } catch (error) {
      console.error('Error saving patient:', error);
      showNotification(error.message || 'Failed to save patient.', 'error');
    }
  };

  const handleCancel = () => {
    console.log('Cancel operation');
    navigate('/pharmacy-patientlist'); // Redirect to patient list
  };

  return (
    <div className="medicine-container">
      <div className="medicine-card">
        <Header />
        <button className="form-back-button" onClick={() => navigate('/pharmacy-patientlist')}>
          ← Back to patient list
        </button>
        <PatientForm 
          onSave={handleSave}
          onCancel={handleCancel} // Connected to patient list
        />
        <Footer />
      </div>
    </div>
  );
};

export default AddPatientForm;
