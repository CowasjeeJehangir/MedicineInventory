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
      <h2>Invitation ready</h2>
      <p>Share this link privately with {invitation.invite_email}. No email has been sent.</p>
      <p>Expires {new Date(invitation.expires_at).toLocaleString()}.</p>
      <label htmlFor="invitation-setup-link">Setup link</label>
      <input id="invitation-setup-link" type="text" readOnly value={invitation.setup_url}
        onFocus={(event) => event.target.select()} />
      <div className="invitation-share-actions">
        <button type="button" onClick={copyLink}>Copy setup link</button>
        <a href={draftUrl}>Open email draft</a>
        <button type="button" onClick={onClose}>Dismiss</button>
      </div>
      <p>Open email draft uses your default email app. Review the draft and click Send yourself. Set Outlook as your default email app to use it here.</p>
      <p>Save or share the link before leaving this page. If you lose it, revoke the invitation and create a new one.</p>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </section>
  );
}
