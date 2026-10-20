import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserList from '../components/UserList';
import UserModal from '../components/UserModal';
import InvitationShare from '../components/InvitationShare';
import '../styles/AdminScreen.css';
import { ENDPOINTS, apiFetch, toUserView } from '../config/api';
import { useNotification } from '../components/NotificationProvider';

const AdminScreen = () => {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [createdInvitation, setCreatedInvitation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const { data } = await apiFetch(ENDPOINTS.INVITATIONS, {
          method: 'POST',
          body: JSON.stringify({ email: userData.email.trim(), name: userData.name,
            cnic: Number(userData.cnic), phone_number: Number(userData.phone_number),
            designation: userData.role }),
        });
        setCreatedInvitation(data);
      }
      showNotification(editingUser ? 'User updated.' : 'Invitation ready. Copy the link or open an email draft.');
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
      if (createdInvitation?.invite_id === id) setCreatedInvitation(null);
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

        {createdInvitation && (
          <InvitationShare invitation={createdInvitation} onClose={() => setCreatedInvitation(null)} />
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
          <p>Invitations do not send email automatically. Share the setup link using an email draft or copy it. To replace a lost link, revoke the pending invitation and invite the user again.</p>
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
