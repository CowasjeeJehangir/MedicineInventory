import React, { useState, useEffect } from 'react';
import { Mail, Plus, ArrowLeft, RefreshCw } from 'lucide-react';
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
  const [invitationFilter, setInvitationFilter] = useState('pending');
  const [revoking, setRevoking] = useState(null);
  const invitationState = invite => invite.status === 'pending' && new Date(invite.expires_at) <= new Date() ? 'expired' : invite.status;
  const pendingCount = invitations.filter(invite => invitationState(invite) === 'pending').length;
  const visibleInvitations = invitations.filter(invite => invitationFilter === 'all' || invitationState(invite) === 'pending');

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
      setError(err.message || 'Unable to load user management.');
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
            phone_number: userData.phone_number, designation: userData.role }),
        });
      } else {
        const { data } = await apiFetch(ENDPOINTS.INVITATIONS, {
          method: 'POST',
          body: JSON.stringify({ email: userData.email.trim(), name: userData.name,
            cnic: userData.cnic, phone_number: userData.phone_number,
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
      throw err;
    }
  };

  const revokeInvitation = async (id) => {
    if (!window.confirm('Revoke this invitation? Its setup link will stop working.')) return;
    setRevoking(id);
    try {
      await apiFetch(ENDPOINTS.REVOKE_INVITATION(id), { method: 'POST' });
      if (createdInvitation?.invite_id === id) setCreatedInvitation(null);
      await fetchUsers();
    } catch (err) { showNotification(err.message, 'error'); }
    finally { setRevoking(null); }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <Header />
        <main className="admin-content">
          <button className="admin-back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={15} /> Back to dashboard</button>
          <div className="admin-page-heading">
            <div><p className="admin-eyebrow">TEAM & ACCESS</p><h1>User management</h1><p>Manage staff access and share secure setup invitations.</p></div>
            <div className="admin-heading-actions"><button className="admin-icon-button" aria-label="Refresh user management" disabled={loading} onClick={handleRefresh}><RefreshCw size={18} /></button>
              <button className="admin-button primary" onClick={handleAddUser}><Plus size={17} /> Invite user</button></div>
          </div>
          {error && <div className="admin-error" role="alert">{error}<button className="admin-button secondary" onClick={handleRefresh}>Retry</button></div>}
          {createdInvitation && <InvitationShare invitation={createdInvitation} onClose={() => setCreatedInvitation(null)} />}
          {loading && <p className="admin-muted" role="status">Updating staff and invitations…</p>}
          <UserList users={users} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />
          <section className="admin-panel" aria-labelledby="invitations-heading">
            <div className="admin-panel-header">
              <div><div className="admin-section-title"><Mail size={19} /><h2 id="invitations-heading">Invitations</h2><span className="admin-count">{pendingCount} pending</span></div>
                <p className="admin-muted">Setup links expire in 24 hours. Share them privately using an email draft.</p></div>
              <div className="admin-filter" aria-label="Filter invitations">
                <button aria-pressed={invitationFilter === 'pending'} onClick={() => setInvitationFilter('pending')}>Pending</button>
                <button aria-pressed={invitationFilter === 'all'} onClick={() => setInvitationFilter('all')}>All history</button>
              </div>
            </div>
            <div className="admin-table-scroll"><table className="admin-table">
              <thead><tr><th scope="col">Recipient</th><th scope="col">Status</th><th scope="col">Link expires</th><th scope="col" className="admin-align-right">Action</th></tr></thead>
              <tbody>{visibleInvitations.map(invite => {
                const status = invitationState(invite);
                return <tr key={invite.invite_id}>
                  <td><strong>{invite.name}</strong><span className="admin-email">{invite.invite_email}</span></td>
                  <td><span className={`admin-badge state-${status}`}>{status}</span></td>
                  <td className="admin-date">{new Date(invite.expires_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="admin-align-right">{status === 'pending' ? <button className="admin-button revoke" disabled={revoking === invite.invite_id} onClick={() => revokeInvitation(invite.invite_id)}>{revoking === invite.invite_id ? 'Revoking…' : 'Revoke'}</button> : <span className="admin-muted">—</span>}</td>
                </tr>;
              })}{visibleInvitations.length === 0 && <tr><td colSpan={4}><div className="admin-empty"><Mail size={26} /><strong>{invitationFilter === 'pending' ? 'No pending invitations' : 'No invitations yet'}</strong><p>{invitationFilter === 'pending' ? 'New invitations will appear here until setup is complete.' : 'Invite a staff member to create their setup link.'}</p></div></td></tr>}</tbody>
            </table></div>
          </section>
        </main>
        {isModalOpen && <UserModal user={editingUser} onSave={handleSaveUser} onClose={handleCloseModal} />}
        <Footer />
      </div>
    </div>
  );
};

export default AdminScreen;
