import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MedicineForm from '../components/MedicineForm';
import { ENDPOINTS, apiFetch } from '../config/api';
import '../styles/MedicineForm.css';

const AddMedicineForm = ({ onSave }) => {
  const navigate = useNavigate();

  const handleSave = async (formData) => {
    console.log('=== SAVING MEDICINE ===');
    console.log('Form data:', formData);
    
    try {
      const medicinePayload = {
        name: formData.name,
        potential_allergens: formData.potential_allergens || null,
        restock_threshold: Number(formData.restock_threshold || 10),
        needs_prescription: Boolean(formData.needs_prescription),
      };

      const { data: medicine } = await apiFetch(ENDPOINTS.MEDICINES, {
        method: 'POST',
        body: JSON.stringify(medicinePayload),
      });

      if (Number(formData.initial_stock || 0) > 0) {
        await apiFetch(ENDPOINTS.RESTOCK, {
          method: 'POST',
          body: JSON.stringify({
            med_id: medicine.id,
            batch_no: Number(formData.batch_no || Date.now().toString().slice(-6)),
            quantity_added: Number(formData.initial_stock),
            price_per_unit: Number(formData.price_per_unit || 0),
            best_before: formData.best_before ? new Date(formData.best_before).toISOString() : null,
            particulars_b: Number(formData.particulars_b || 0),
            particulars_f: Number(formData.particulars_f || 0),
            particulars_t: Number(formData.particulars_t || 0),
          }),
        });
      }

      alert('Medicine created successfully!');
      navigate('/medicine-stock');
    } catch (error) {
      console.error('Error saving medicine:', error);
      alert(error.message || 'Failed to save medicine');
    }
  };

  const handleCancel = () => {
    console.log('Cancel operation');
    navigate('/medicine-stock'); // ✅ Redirect to dashboard
  };

  return (
    <div className="medicine-container">
      <div className="medicine-card">
        <Header />
        <button className="form-back-button" onClick={() => navigate('/medicine-stock')}>
          ← Back to stock register
        </button>
        <MedicineForm 
          onSave={handleSave}
          onCancel={handleCancel} // ✅ Connected to dashboard
        />
        <Footer />
      </div>
    </div>
  );
};

export default AddMedicineForm;
