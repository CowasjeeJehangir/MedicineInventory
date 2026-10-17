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
  const [invitations, setInvitations] = useState([]);
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
      const { data: invites } = await apiFetch(ENDPOINTS.INVITATIONS);
      setInvitations(invites);
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
      if (editingUser) {
        await apiFetch(ENDPOINTS.USER(editingUser.id), {
          method: 'PUT',
          body: JSON.stringify({ name: userData.name,
            phone_number: Number(userData.phone_number), designation: userData.role }),
        });
      } else {
        await apiFetch(ENDPOINTS.INVITATIONS, {
          method: 'POST',
          body: JSON.stringify({ email: userData.email.trim(), name: userData.name,
            cnic: Number(userData.cnic), phone_number: Number(userData.phone_number),
            designation: userData.role }),
        });
      }
      showNotification(editingUser ? 'User updated.' : 'Invitation sent. Link expires in 24 hours.');
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      showNotification(err.message || 'Unable to save user.', 'error');
      await fetchUsers();
    }
  };

  const revokeInvitation = async (id) => {
    try {
      await apiFetch(ENDPOINTS.REVOKE_INVITATION(id), { method: 'POST' });
      await fetchUsers();
    } catch (err) { showNotification(err.message, 'error'); }
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
        
        <section aria-label="Invitations">
          <h2>Invitations</h2>
          <p>To resend an expired or revoked invitation, invite the user again. Revoke a pending invitation before replacing it.</p>
          {invitations.length === 0 && <p>No invitations yet.</p>}
          <ul>
            {invitations.map((invite) => (
              <li key={invite.invite_id}>
                {invite.name} — {invite.invite_email} — {invite.status}
                {' '} (expires {new Date(invite.expires_at).toLocaleString()})
                {invite.status === 'pending' && (
                  <button onClick={() => revokeInvitation(invite.invite_id)}>Revoke</button>
                )}
              </li>
            ))}
          </ul>
        </section>

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
