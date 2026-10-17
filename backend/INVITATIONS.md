# Invitation setup (Neon PostgreSQL)

1. Install `requirements.txt` in your backend environment.
2. Add your actual Neon `DATABASE_URL` to backend/.env. Configured database
   failures now stop startup instead of silently writing to SQLite.
3. From backend, run `python migrations/invitation_setup.py` once before starting
   the updated app. It adds staff.email and the invitation schema/indexes. An
   incompatible old invitation table is preserved as a legacy backup; its old
   invitations are not activated. No staff or credentials are created.
4. Configure SMTP and FRONTEND_URL, then restart the backend.

## Gmail SMTP setup

Use an account you control. Enable Google Account 2-Step Verification, then create
an app password at https://myaccount.google.com/apppasswords (when your account
supports app passwords). Put that app password, not your normal login password,
in backend/.env:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-address@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Medicine Inventory <your-address@gmail.com>
FRONTEND_URL=http://localhost:3000
```

Google documentation:
https://support.google.com/accounts/answer/185833
https://support.google.com/mail/answer/7104828

If app passwords are unavailable, use another SMTP provider and its STARTTLS
port 587 credentials. This implementation does not support SSL-only port 465.
Use a verified sender address permitted by your provider.

FRONTEND_URL must be the address recipients can reach, with HTTPS for deployment.
The web host must route /set-password to the React app. backend/.env is ignored
by Git; do not commit credentials. backend/.env.example contains placeholders.

## Behavior

Admin Add User sends an invitation rather than creating staff. Invitations appear
separately, expire after 24 hours, and can be revoked. Revoke pending invitations
before inviting the same email/CNIC again. Expired/revoked invitations can be
replaced with a new invitation. SMTP failure revokes the new link and returns an
error; no staff is created. Opening/validating a link does not consume it.

Password submission atomically claims the invitation, creates staff and hashed
credentials, and accepts it. Users log in with the invited email and their chosen
password. Existing username accounts keep working. Passwords are not trimmed;
new passwords require 12 characters and at most 72 UTF-8 bytes (bcrypt limit).

The staff-creation API is removed so it cannot bypass invitations. Legacy scripts
such as admin.py/create_test_user.py are not invitation entry points.
