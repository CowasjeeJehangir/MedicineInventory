// components/MedicineTable.js
import React from 'react';
import MedicineRow from './MedicineRow';

const MedicineTable = ({ medicines, onSort, sortConfig }) => {
  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return '';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (medicines.length === 0) {
    return (
      <div className="no-results">
        No medicines found matching your criteria.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="medicine-table">
        <thead>
          <tr>
            <th onClick={() => onSort('name')} className="sortable">
              Medicine Name <span className="sort-arrow">{getSortIcon('name')}</span>
            </th>
            <th onClick={() => onSort('price')} className="sortable">
              Price <span className="sort-arrow">{getSortIcon('price')}</span>
            </th>
            <th onClick={() => onSort('quantity')} className="sortable">
              Quantity in Stock <span className="sort-arrow">{getSortIcon('quantity')}</span>
            </th>
            <th onClick={() => onSort('expiry')} className="sortable">
              Expiry Date <span className="sort-arrow">{getSortIcon('expiry')}</span>
            </th>
            <th onClick={() => onSort('pharmacyId')} className="sortable">
              Pharmacy ID <span className="sort-arrow">{getSortIcon('pharmacyId')}</span>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(medicine => (
            <MedicineRow key={medicine.id} medicine={medicine} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineTable;