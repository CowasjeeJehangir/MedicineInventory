import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENDPOINTS } from '../config/api';

async function publicPost(url, body) {
  const response = await fetch(url, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string'
    ? data.detail : 'Please check your password and try again.');
  return data;
}

export default function SetPasswordPage() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    let active = true;
    if (!token) { setError('The invitation token is missing.'); return; }
    publicPost(ENDPOINTS.VALIDATE_INVITATION, { token })
      .then(() => { if (active) setValid(true); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    if (new TextEncoder().encode(password).length > 72) {
      setError('Password must be at most 72 UTF-8 bytes.'); return;
    }
    setBusy(true);
    try {
      await publicPost(ENDPOINTS.COMPLETE_INVITATION, { token, password });
      setPassword(''); setConfirmation(''); setComplete(true);
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  if (complete) return <main><h1>Password set successfully</h1><p>Your staff account is ready.</p><Link to="/login">Go to login</Link></main>;
  return <main className="login-card"><h1>Set up your password</h1>
    <p>Your invitation expires 24 hours after creation.</p>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={submit}>
      <label>Password<input type="password" autoComplete="new-password" minLength={12} maxLength={72}
        required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy || !valid} /></label>
      <label>Confirm password<input type="password" autoComplete="new-password" required
        value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={busy || !valid} /></label>
      <button disabled={busy || !valid}>{busy ? 'Setting up…' : 'Set password'}</button>
    </form></main>;
}
