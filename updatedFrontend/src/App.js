import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AddMedicinePage from "./pages/AddMedicineForm";
import AddPatientPage from './pages/AddPatientForm';
import AdminScreen from './pages/AdminScreen';
import PharmacyPatientList from './pages/PharmacyPatientList.jsx';
import MedicineDispense from './pages/MedicineDispensePage.jsx';
import StockRegisterPage from './pages/StockRegisterPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Admin and Pharmacist routes */}
        <Route 
          path="/admin-screen" 
          element={
            <ProtectedRoute>
              <AdminScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-medicine" 
          element={
            <ProtectedRoute>
              <AddMedicinePage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/edit-medicine/:id"
          element={
            <ProtectedRoute>
              <AddMedicinePage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/medicine-stock" 
          element={
            <ProtectedRoute>
              <StockRegisterPage />
            </ProtectedRoute>
          } 
        />

        {/* Pharmacy routes */}
        <Route 
          path="/pharmacy-patientlist" 
          element={
            <ProtectedRoute>
              <PharmacyPatientList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-patient" 
          element={
            <ProtectedRoute>
              <AddPatientPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/medicine-dispense" 
          element={
            <ProtectedRoute>
              <MedicineDispense />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
