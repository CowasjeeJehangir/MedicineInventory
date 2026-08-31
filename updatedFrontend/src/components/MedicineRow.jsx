// components/MedicineRow.js
import React from 'react';
import StatusBadge from './StatusBadge';
import { getMedicineStatus, getRowClassName } from '../utils/medicineUtils';

const MedicineRow = ({ medicine }) => {
  const status = getMedicineStatus(medicine);
  const rowClassName = getRowClassName(medicine);

  return (
    <tr className={rowClassName}>
      <td className="medicine-name">{medicine.name}</td>
      <td className="price">${medicine.price.toFixed(2)}</td>
      <td className="quantity">{medicine.quantity}</td>
      <td className="expiry-date">{medicine.expiry}</td>
      <td className="pharmacy-id">{medicine.pharmacyId}</td>
      <td>
        <StatusBadge status={status} />
      </td>
    </tr>
  );
};

export default MedicineRow;