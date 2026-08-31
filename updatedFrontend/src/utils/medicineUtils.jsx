// utils/medicineUtils.js
export const getMedicineStatus = (medicine) => {
  const today = new Date();
  const expiryDate = new Date(medicine.expiry);
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0 || medicine.quantity === 0) return 'expired';
  if (medicine.quantity <= 10) return 'low';
  return 'instock';
};

export const getRowClassName = (medicine) => {
  const status = getMedicineStatus(medicine);
  if (status === 'expired') return 'expired-row';
  if (status === 'low') return 'low-stock-row';
  return '';
};

export const filterMedicines = (medicines, searchTerm, stockFilter) => {
  return medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.pharmacyId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (stockFilter === 'all') return true;
    
    const status = getMedicineStatus(medicine);
    return status === stockFilter;
  });
};

export const sortMedicines = (medicines, sortConfig) => {
  return [...medicines].sort((a, b) => {
    let aVal, bVal;
    
    switch(sortConfig.field) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      case 'quantity':
        aVal = a.quantity;
        bVal = b.quantity;
        break;
      case 'expiry':
        aVal = new Date(a.expiry);
        bVal = new Date(b.expiry);
        break;
      case 'pharmacyId':
        aVal = a.pharmacyId;
        bVal = b.pharmacyId;
        break;
      default:
        return 0;
    }
    
    if (sortConfig.direction === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
};