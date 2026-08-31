import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/StockRegister.module.css';
import { ENDPOINTS, apiFetch } from '../config/api';

const StockRegisterPage = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Fetch medicines from backend
  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching medicines from API...');
      const { data } = await apiFetch(ENDPOINTS.INVENTORY);
      
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        const transformedMedicines = data.map(item => {
          console.log('Processing item:', item);
          
          return {
            id: item.id,
            medicine_id: item.medicine_id,
            date: new Date(item.restock_date || Date.now()).toLocaleDateString('en-GB'),
            article: item.medicine_name,
            particulars: `B:${item.particulars_b || 0} F:${item.particulars_f || 0} T:${item.particulars_t || 0}`,
            folio: item.batch_no ? item.batch_no.toString().padStart(2, '0') : '-',
            receipts: (item.quantity || 0).toString(),
            issued: ((item.quantity || 0) - (item.available_quantity || 0)).toString(),
            balance: (item.available_quantity || 0).toString(),
            expiryDate: item.best_before ? new Date(item.best_before).toLocaleDateString('en-GB') : 'N/A',
            remarks: (item.available_quantity || 0) <= (item.restock_threshold || 10) ? 'Low stock alert' : 'Normal',
            pricePerUnit: item.price_per_unit || 0,
            batchNumber: item.batch_no || '-',
            needsPrescription: item.needs_prescription,
            potentialAllergens: item.potential_allergens,
            pharmacyId: item.medicine_id ? `PH${item.medicine_id.toString().padStart(6, '0')}` : '-',
            restockThreshold: item.restock_threshold || 10
          };
        });
        
        console.log('Transformed medicines:', transformedMedicines);
        setMedicines(transformedMedicines);
      } else {
        setError('Failed to fetch medicines');
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleDelete = async (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine? This will remove all batches and inventory records.')) {
      return;
    }

    try {
      await apiFetch(ENDPOINTS.MEDICINE(medicineId), {
        method: 'DELETE',
      });

      alert('Medicine deleted successfully');
      fetchMedicines();
    } catch (err) {
      console.error('Error deleting medicine:', err);
      alert(err.message || 'Failed to delete medicine');
    }
  };

  const handleEdit = (medicine) => {
    // Navigate to edit page with medicine data
    navigate(`/edit-medicine/${medicine.medicine_id}`, { 
      state: { 
        medicine: {
          id: medicine.medicine_id,
          name: medicine.article,
          particulars: medicine.particulars,
          folio: medicine.folio,
          remarks: medicine.remarks,
          needs_prescription: medicine.needsPrescription,
          potential_allergens: medicine.potentialAllergens
        }
      } 
    });
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.remarks.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: medicines.length,
    lowStock: medicines.filter(m => parseInt(m.balance) < 100).length,
    normalStock: medicines.filter(m => parseInt(m.balance) >= 100).length
  };

  if (loading) {
    return (
      <div className={styles.inventoryContainer}>
        <Header />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #add3eb',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#666' }}>Loading medicines...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.inventoryContainer}>
      <Header />

      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: "#add3eb",
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 20px',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0px 4px 6px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        ← Back
      </button>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '8px',
          padding: '15px',
          margin: '20px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ margin: 0, color: '#c62828' }}>Error: {error}</p>
          <button
            onClick={fetchMedicines}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} style={{ 
            position: 'absolute', 
            left: '15px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#94a3b8' 
          }} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '45px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchMedicines}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={18} /> Refresh
          </button>
          
          <button 
            className={styles.addButton} 
            onClick={() => navigate('/add-medicine')}
          >
            <Plus size={20} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Items</div>
        </div>
        <div className={`${styles.statCard} ${styles.low}`}>
          <div className={styles.statValue}>{stats.lowStock}</div>
          <div className={styles.statLabel}>Low Stock</div>
        </div>
        <div className={`${styles.statCard} ${styles.normal}`}>
          <div className={styles.statValue}>{stats.normalStock}</div>
          <div className={styles.statLabel}>Normal Stock</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className={styles.inventoryTable}>
        <div className={styles.tableHeader}>
          <h3>Medicine Stock Register</h3>
        </div>
        <div className={styles.tableContainer}>
          {filteredMedicines.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Article</th>
                  <th>Pharmacy ID</th>
                  <th>Batch No</th>
                  <th>Particulars</th>
                  <th>Folio</th>
                  <th>Receipts</th>
                  <th>Issued</th>
                  <th>Balance</th>
                  <th>Restock At</th>
                  <th>Price/Unit</th>
                  <th>Allergens</th>
                  <th>Expiry Date</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((medicine) => (
                  <tr key={medicine.id}>
                    <td>{medicine.date}</td>
                    <td><strong>{medicine.article}</strong></td>
                    <td>{medicine.pharmacyId}</td>
                    <td>{medicine.batchNumber}</td>
                    <td>{medicine.particulars}</td>
                    <td>{medicine.folio}</td>
                    <td>{medicine.receipts}</td>
                    <td>{medicine.issued}</td>
                    <td>
                      <span className={parseInt(medicine.balance) < 100 ? styles.balanceLow : styles.balanceNormal}>
                        {medicine.balance}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: parseInt(medicine.balance) <= medicine.restockThreshold ? '#fff3cd' : 'transparent',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: parseInt(medicine.balance) <= medicine.restockThreshold ? 'bold' : 'normal',
                        color: parseInt(medicine.balance) <= medicine.restockThreshold ? '#856404' : 'inherit'
                      }}>
                        {medicine.restockThreshold}
                      </span>
                    </td>
                    <td>Rs. {parseFloat(medicine.pricePerUnit).toFixed(2)}</td>
                    <td>{medicine.potentialAllergens || '-'}</td>
                    <td>{medicine.expiryDate}</td>
                    <td>{medicine.remarks}</td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={`${styles.actionBtn} ${styles.edit}`}
                          onClick={() => handleEdit(medicine)}
                          title="Edit medicine"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${styles.delete}`}
                          onClick={() => handleDelete(medicine.medicine_id)}
                          title="Delete medicine"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <h3>No medicines found</h3>
              <p>
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : 'Click "Add Medicine" to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StockRegisterPage;
