import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserList from '../components/UserList';
import UserModal from '../components/UserModal';
import '../styles/AdminScreen.css';
import { ENDPOINTS, apiFetch, toUserView } from '../config/api';
import { useNotification } from '../components/NotificationProvider';

const AdminScreen = () => {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL - adjust this to match your Flask server

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await apiFetch(ENDPOINTS.USERS);
      setUsers(data.map(toUserView));
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiFetch(ENDPOINTS.USER(userId), {
          method: 'DELETE',
        });

        setUsers(users.filter(user => user.id !== userId));
        showNotification('User deleted successfully.');
      } catch (err) {
        console.error('Error deleting user:', err);
        showNotification('Failed to delete user.', 'error');
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      const url = editingUser 
        ? ENDPOINTS.USER(editingUser.id) 
        : ENDPOINTS.USERS;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload = editingUser
        ? {
            name: userData.name || userData.username,
            phone_number: Number(userData.phone_number || 0),
            designation: userData.role,
          }
        : {
            cnic: Number(userData.cnic || Date.now().toString().slice(-9)),
            name: userData.name || userData.username,
            phone_number: Number(userData.phone_number || 0),
            designation: userData.role,
            account_id: userData.email || userData.username,
            password: userData.password,
          };

      const { data } = await apiFetch(url, {
        method: method,
        body: JSON.stringify(payload),
      });

      if (editingUser) {
        setUsers(users.map(user => 
          user.id === editingUser.id ? toUserView({ ...data, account_id: editingUser.email }) : user
        ));
      } else {
        setUsers([...users, toUserView({ ...data, account_id: payload.account_id })]);
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setError(null);
      showNotification(editingUser ? 'User updated successfully.' : 'User added successfully.');
    } catch (err) {
      console.error('Error saving user:', err);
      showNotification('Failed to save user.', 'error');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <Header />
          <button className="admin-back-button" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
          <div className="loading-container">
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <Header />
        <button className="admin-back-button" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
        
        {error && (
          <div className="error-container">
            <p className="error-message">Error: {error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Retry
            </button>
          </div>
        )}
        
        <UserList 
          users={users}
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onRefresh={handleRefresh}
        />
        
        {isModalOpen && (
          <UserModal
            user={editingUser}
            onSave={handleSaveUser}
            onClose={handleCloseModal}
          />
        )}

        <Footer />
      </div>
    </div>
  );
};

export default AdminScreen;
