import React, { useState } from 'react';

export default function InvitationShare({ invitation, onClose }) {
  const [copyStatus, setCopyStatus] = useState('');
  const subject = 'Set up your CJIP Medicine Inventory password';
  const body = `Hello ${invitation.name},\n\nYou have been invited to CJIP Medicine Inventory.\n\nSet up your password using this link:\n${invitation.setup_url}\n\nThis link is single-use and expires on ${new Date(invitation.expires_at).toLocaleString()}.\n\nPlease keep this link private.\n\nCJIP Medicine Inventory`;
  const draftUrl = `mailto:${encodeURIComponent(invitation.invite_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitation.setup_url);
      setCopyStatus('Setup link copied.');
    } catch {
      setCopyStatus('Unable to copy automatically. Select and copy the link below.');
    }
  };

  return (
    <section className="invitation-share" aria-label="Share setup invitation">
      <div className="share-heading"><h2>Setup link ready</h2><button type="button" className="admin-icon-button" aria-label="Dismiss setup link" onClick={onClose}>×</button></div>
      <p>Share privately with <strong>{invitation.invite_email}</strong>. No email has been sent.</p>
      <label htmlFor="invitation-setup-link">Private setup link</label>
      <div className="share-link-row"><input id="invitation-setup-link" type="text" readOnly value={invitation.setup_url} onFocus={event => event.target.select()} />
        <button type="button" className="admin-button secondary" onClick={copyLink}>Copy link</button></div>
      <div className="invitation-share-actions"><a className="admin-button primary" href={draftUrl}>Open email draft</a>
        <span className="admin-muted">Expires {new Date(invitation.expires_at).toLocaleString()}</span></div>
      <p className="share-note">Review and send in your email app. Save this link before leaving; replace a lost link by revoking the invitation.</p>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </section>
  );
}
