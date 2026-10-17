"""Run once: python migrations/invitation_setup.py (from backend).

Adds staff.email and preserves any incompatible invitation table as a legacy
backup. Does not create users, send email, or modify credentials.
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import inspect, text
from db import engine
import models
from models.staff import Invitation


def migrate():
    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = inspector.get_table_names()
        if 'staff' not in tables:
            raise RuntimeError('Initialize the application database before migrating.')
        columns = {c['name'] for c in inspector.get_columns('staff')}
        if 'email' not in columns:
            connection.execute(text('ALTER TABLE staff ADD COLUMN email VARCHAR(320)'))
        connection.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS staff_email_unique ON staff(email)'))
        if 'invitation' in tables:
            existing = {c['name']: c for c in inspector.get_columns('invitation')}
            required = {c.name for c in Invitation.__table__.columns}
            compatible = (required <= existing.keys()
                          and 'CHAR' in str(existing['status']['type']).upper())
            if not compatible:
                suffix = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
                connection.execute(text(f'ALTER TABLE invitation RENAME TO invitation_legacy_{suffix}'))
                if connection.dialect.name == 'postgresql':
                    legacy = f'invitation_legacy_{suffix}'
                    names = connection.execute(text(
                        "SELECT conname FROM pg_constraint WHERE conrelid = to_regclass(:table)"
                    ), {'table': legacy}).scalars().all()
                    quote = connection.dialect.identifier_preparer.quote
                    for number, name in enumerate(names):
                        new_name = f'legacy_invitation_{suffix}_{number}'
                        connection.execute(text(
                            f'ALTER TABLE {quote(legacy)} RENAME CONSTRAINT {quote(name)} TO {quote(new_name)}'
                        ))
                print('Preserved the old invitation table as a legacy backup.')
        Invitation.__table__.create(connection, checkfirst=True)
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS invitation_pending_email_unique ON invitation(invite_email) WHERE status = 'pending'"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS invitation_pending_cnic_unique ON invitation(cnic) WHERE status = 'pending'"))
    print('Invitation schema ready. No users or credentials created.')


if __name__ == '__main__':
    migrate()
