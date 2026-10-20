import React, { useEffect, useRef, useState } from 'react';
import InputField from './InputField';
import { cnicError, phoneError, emailError, displayPhone } from '../utils/contactValidation';

export default function UserModal({ user, onSave, onClose }) {
  const [formData, setFormData] = useState({
    email: user?.email || '', name: user?.name || user?.username || '',
    cnic: String(user?.cnic || ''), phone_number: displayPhone(user?.phone_number), role: user?.role || 'Staff',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector('input:not(:disabled)')?.focus();
    return () => previous?.focus();
  }, []);

  const change = (field, value) => {
    setFormData(data => ({ ...data, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
    setSaveError('');
  };
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    const next = {
      name: formData.name.trim() ? '' : 'Full name is required.',
      email: user ? '' : emailError(formData.email),
      cnic: user ? '' : cnicError(formData.cnic),
      phone_number: phoneError(formData.phone_number),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      const field = Object.keys(next).find(key => next[key]);
      dialog.current?.querySelector(`[name="${field}"]`)?.focus();
      return;
    }
    setSaving(true);
    try { await onSave({ ...formData, name: formData.name.trim(), email: formData.email.trim().toLowerCase() }); }
    catch (err) { setSaveError(err.message || 'Unable to save. Please try again.'); }
    finally { setSaving(false); }
  };
  const keyDown = event => {
    if (event.key === 'Escape' && !saving) onClose();
    if (event.key !== 'Tab') return;
    const elements = dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)');
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return (
    <div className="admin-modal-overlay" onKeyDown={keyDown}>
      <section className="admin-modal" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="staff-modal-title" aria-describedby="staff-modal-description">
        <div className="admin-modal-header">
          <div><h2 id="staff-modal-title">{user ? 'Edit staff member' : 'Invite a staff member'}</h2>
            <p id="staff-modal-description">{user ? 'Update contact details and access.' : 'Create a private setup link, then share it in an email draft.'}</p></div>
          <button type="button" className="admin-icon-button" aria-label="Close dialog" disabled={saving} onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} noValidate className="admin-user-form">
          <InputField label="Full name" name="name" type="text" autoComplete="name" maxLength={200} required value={formData.name} error={errors.name} disabled={saving} onChange={e => change('name', e.target.value)} />
          <InputField label="Email address" name="email" type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" required value={formData.email} error={errors.email} hint={user ? 'Login email cannot be changed here.' : 'The setup draft will be addressed to this email.'} disabled={!!user || saving} onChange={e => change('email', e.target.value)} />
          <div className="admin-form-grid">
            <InputField label="CNIC" name="cnic" type="text" inputMode="numeric" maxLength={15} placeholder="42101-1234567-1" required={!user} value={formData.cnic} error={errors.cnic} hint="13 digits, with or without hyphens." disabled={!!user || saving} onChange={e => change('cnic', e.target.value)} />
            <InputField label="Mobile number" name="phone_number" type="tel" autoComplete="tel" maxLength={20} placeholder="03001234567" required value={formData.phone_number} error={errors.phone_number} hint="Use 03… or +92…" disabled={saving} onChange={e => change('phone_number', e.target.value)} />
          </div>
          <div className="form-group"><label htmlFor="staff-role">Role *</label>
            <select id="staff-role" value={formData.role} onChange={e => change('role', e.target.value)} disabled={saving}>
              <option>Staff</option><option>Pharmacist</option><option>Admin</option>
            </select></div>
          {saveError && <p className="field-error" role="alert">{saveError}</p>}
          <div className="admin-modal-actions">
            <button type="button" className="admin-button secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="admin-button primary" disabled={saving}>{saving ? 'Saving…' : user ? 'Save changes' : 'Create invitation'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
