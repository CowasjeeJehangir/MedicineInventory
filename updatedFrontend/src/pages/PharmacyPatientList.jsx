import React, { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/StockRegister.module.css';  
import { ENDPOINTS, apiFetch } from '../config/api';

const PharmacyPatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState("");
  const [showWardFilter, setShowWardFilter] = useState(false);
  const [selectedWards, setSelectedWards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const { data } = await apiFetch(ENDPOINTS.PATIENTS);
        setPatients(data.map((patient) => ({
          id: `P${patient.id.toString().padStart(3, '0')}`,
          name: patient.name,
          medicines: patient.medicines || '-',
          diagnosis: patient.diagnosis || '',
          ward: patient.ward_code || (patient.ward_id ? `Ward ${patient.ward_id}` : '-'),
        })));
        setError('');
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err.message || 'Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Unique ward list
  const wardList = [...new Set(patients.map(p => p.ward))];

  // Filtered patients
  const filteredPatients = patients.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
       p.id.toLowerCase().includes(search.toLowerCase())) &&
      (selectedWards.length === 0 || selectedWards.includes(p.ward))
  );

  if (loading) {
    return (
      <div className={styles.inventoryContainer}>
        <Header />
        <div className={styles.emptyState}>
          <h3>Loading patients...</h3>
        </div>
        <Footer />
      </div>
    );
  }

  // Patient stats
  const stats = {
    total: patients.length,
    withDiagnosis: patients.filter(p => p.diagnosis.trim() !== "").length,
    withoutDiagnosis: patients.filter(p => p.diagnosis.trim() === "").length,
  };

  return (
    <div className={styles.inventoryContainer}>
      <Header />

      {error && (
        <div className={styles.emptyState}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

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
          boxShadow: '0px 4px 6px rgba(0,0,0,0.2)'
        }}
      >
        ⬅ Back
      </button>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} aria-hidden="true" />
          {/* Search by Name or ID */}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Add Patient Button */}
        <div className={styles.container}>
          <button 
            className={styles.addButton} 
            onClick={() => navigate('/add-patient')}
          >
            <UserPlus size={18} className="mr-2" /> Add Patient
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Patients</div>
        </div>
        <div className={`${styles.statCard} ${styles.normal}`}>
          <div className={styles.statValue}>{stats.withDiagnosis}</div>
          <div className={styles.statLabel}>With Diagnosis</div>
        </div>
        <div className={`${styles.statCard} ${styles.low}`}>
          <div className={styles.statValue}>{stats.withoutDiagnosis}</div>
          <div className={styles.statLabel}>No Diagnosis</div>
        </div>
      </div>

      {/* Patient Table */}
      <div className={styles.inventoryTable}>
        <div className={styles.tableHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>Pharmacy Patient List</h3>

          {/* Filter button with dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className={styles.addButton}
              onClick={() => setShowWardFilter(!showWardFilter)}
            >
              Filter
            </button>

            {showWardFilter && (
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  zIndex: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {wardList.map((ward) => (
                  <label key={ward} style={{ display: 'block', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      checked={selectedWards.includes(ward)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWards([...selectedWards, ward]);
                        } else {
                          setSelectedWards(selectedWards.filter(w => w !== ward));
                        }
                      }}
                    />{" "}
                    {ward}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableContainer}>
          {filteredPatients.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient Name / ID</th>
                  <th>Ward Number</th>
                  <th>Assigned Medicines</th>
                  <th>Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong> / {p.id}</td>
                    <td>{p.ward}</td>
                    <td>{p.medicines}</td>
                    <td>{p.diagnosis || <span style={{ color: 'gray' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <h3>No patients found</h3>
              <p>Try adjusting your search terms or ward filter.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PharmacyPatientList;
