"""Format checks for submitted contact details; database columns remain numeric."""
import re


def validate_cnic(value):
    if value is None or value == '':
        return None
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        raise ValueError('CNIC must contain exactly 13 digits.')
    text = str(value).strip()
    if not text:
        return None
    if not re.fullmatch(r'(?:[1-9][0-9]{12}|[1-9][0-9]{4}-[0-9]{7}-[0-9])', text):
        raise ValueError('Enter a 13-digit CNIC, e.g. 42101-1234567-1.')
    return int(text.replace('-', ''))


def validate_phone(value):
    if value is None or value == '':
        return None
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        raise ValueError('Enter a Pakistani mobile number starting with 03 or +92.')
    text = re.sub(r'[ -]', '', str(value).strip())
    if not text:
        return None
    # Existing clients historically converted 03... to an integer, losing the 0.
    if isinstance(value, int) and re.fullmatch(r'3[0-9]{9}', text):
        text = '0' + text
    if re.fullmatch(r'03[0-9]{9}', text):
        text = '92' + text[1:]
    elif not re.fullmatch(r'\+?923[0-9]{9}', text):
        raise ValueError('Enter a valid mobile number: 03001234567 or +923001234567.')
    return int(text.lstrip('+'))
