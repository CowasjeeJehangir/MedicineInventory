import React from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';

export default function UserList({ users, onEditUser, onDeleteUser }) {
  return (
    <section className="admin-panel" aria-labelledby="staff-heading">
      <div className="admin-panel-header"><div className="admin-section-title"><Users size={19} /><h2 id="staff-heading">Staff members</h2><span className="admin-count">{users.length}</span></div>
        <span className="admin-muted">Accounts ready to sign in</span></div>
      <div className="admin-table-scroll"><table className="admin-table">
        <thead><tr><th scope="col">Staff member</th><th scope="col">Role</th><th scope="col">Access</th><th scope="col" className="admin-align-right">Actions</th></tr></thead>
        <tbody>{users.map(user => <tr key={user.id}>
          <td><div className="admin-person"><span className="admin-avatar" aria-hidden="true">{(user.name || user.username || '?').slice(0, 1).toUpperCase()}</span>
            <div><strong>{user.name || user.username}</strong><span className="admin-email">{user.email || 'Email not set'}</span></div></div></td>
          <td><span className={`admin-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
          <td><span className="admin-badge state-accepted"><span aria-hidden="true">● </span>Active</span></td>
          <td><div className="admin-row-actions"><button type="button" className="admin-icon-button" aria-label={`Edit ${user.name || user.username}`} onClick={() => onEditUser(user)}><Pencil size={16} /></button>
            <button type="button" className="admin-icon-button danger" aria-label={`Delete ${user.name || user.username}`} onClick={() => onDeleteUser(user.id)}><Trash2 size={16} /></button></div></td>
        </tr>)}{users.length === 0 && <tr><td colSpan={4} className="admin-empty">No staff members yet. Create an invitation to get started.</td></tr>}</tbody>
      </table></div>
    </section>
  );
}
