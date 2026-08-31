// components/MedicineInventory.js
import React, { useState, useMemo } from 'react';
import StatsCards from './StatsCards';
import SearchAndFilters from './SearchAndFilters';
import MedicineTable from './MedicineTable';
import { getMedicineStatus, filterMedicines, sortMedicines } from '../utils/medicineUtils';
import '../styles/MedicineInventory.css';

const MedicineInventory = ({ medicines }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });

  // Filter and sort medicines
  const processedMedicines = useMemo(() => {
    let filtered = filterMedicines(medicines, searchTerm, stockFilter);
    return sortMedicines(filtered, sortConfig);
  }, [medicines, searchTerm, stockFilter, sortConfig]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = medicines.length;
    const lowStock = medicines.filter(m => getMedicineStatus(m) === 'low').length;
    const expired = medicines.filter(m => getMedicineStatus(m) === 'expired').length;
    return { total, lowStock, expired };
  }, [medicines]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="medicine-inventory">
      <div className="inventory-content">
        <StatsCards stats={stats} />
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
        />
        <MedicineTable
          medicines={processedMedicines}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>
    </div>
  );
};

export default MedicineInventory;