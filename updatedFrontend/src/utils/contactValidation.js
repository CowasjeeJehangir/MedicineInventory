export function cnicError(value, required = true) {
  const text = String(value ?? '').trim();
  if (!text) return required ? 'CNIC is required.' : '';
  return /^(?:[1-9][0-9]{12}|[1-9][0-9]{4}-[0-9]{7}-[0-9])$/.test(text)
    ? '' : 'Enter 13 digits, e.g. 42101-1234567-1.';
}

export function phoneError(value, required = true) {
  const text = String(value ?? '').trim().replace(/[ -]/g, '');
  if (!text) return required ? 'Mobile number is required.' : '';
  return /^(?:03[0-9]{9}|\+?923[0-9]{9})$/.test(text)
    ? '' : 'Use 03001234567 or +923001234567.';
}

export function emailError(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'Email is required.';
  if (text.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Enter a valid email address.';
  const [local, domain] = text.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
      !domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))) {
    return 'Enter a valid email address.';
  }
  return '';
}

export function displayPhone(value) {
  const text = String(value ?? '');
  if (/^3[0-9]{9}$/.test(text)) return `0${text}`;
  if (/^923[0-9]{9}$/.test(text)) return `+${text}`;
  return text === '0' ? '' : text;
}
