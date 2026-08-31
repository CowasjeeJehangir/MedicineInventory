import React from 'react';
import Header from '../components/Header';
import MedicineDispenseForm from '../components/MedicineDispenseForm';
import Footer from '../components/Footer';
import '../styles/MedicineDispense.css';

const MedicineDispensePage = () => {
  const handleInventorySubmit = (inventoryData) => {
    console.log('Inventory submitted:', inventoryData);
    // Here you would typically send the data to your backend
    alert('Medicine inventory saved successfully!');
  };

  return (
    <div className="inventory-container">
      <div className="inventory-card">
        <Header />
        <MedicineDispenseForm onSubmit={handleInventorySubmit} />
        <Footer />
      </div>
    </div>
  );
};

export default MedicineDispensePage;