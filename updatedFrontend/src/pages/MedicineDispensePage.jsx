import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MedicineDispenseForm from '../components/MedicineDispenseForm';
import Footer from '../components/Footer';
import '../styles/MedicineDispense.css';
import { useNotification } from '../components/NotificationProvider';

const MedicineDispensePage = () => {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const handleInventorySubmit = (inventoryData) => {
    console.log('Inventory submitted:', inventoryData);
    // Here you would typically send the data to your backend
    showNotification('Medicine inventory saved successfully.');
  };

  return (
    <div className="inventory-container">
      <div className="inventory-card">
        <Header />
        <button className="dispense-back-button" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
        <MedicineDispenseForm onSubmit={handleInventorySubmit} />
        <Footer />
      </div>
    </div>
  );
};

export default MedicineDispensePage;
