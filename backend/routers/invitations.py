import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.dependencies import require_admin, get_password_hash
from db import get_db
from models.staff import Staff, Credentials, Invitation
from schemas.schemas import (InvitationCreate, InvitationResponse, InvitationCreatedResponse,
                             InvitationToken, PasswordSetupRequest)

router = APIRouter()


def now():
    return datetime.now(timezone.utc)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def aware(value):
    # SQLite drops timezone info; PostgreSQL retains it.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def valid(invitation):
    if (not invitation or invitation.status != "pending"
            or aware(invitation.expires_at) <= now()):
        raise HTTPException(410, "Invitation is invalid, expired, revoked, or already used.")


def expire_pending(db):
    db.query(Invitation).filter(Invitation.status == "pending",
                               Invitation.expires_at <= now()).update(
        {"status": "expired"}, synchronize_session=False)


@router.get("/", response_model=list[InvitationResponse])
def list_invitations(db: Session = Depends(get_db),
                     admin: Staff = Depends(require_admin)):
    expire_pending(db)
    db.commit()
    return db.query(Invitation).order_by(Invitation.invite_id.desc()).all()


@router.post("/", response_model=InvitationCreatedResponse, status_code=201)
def create_invitation(payload: InvitationCreate, response: Response, db: Session = Depends(get_db),
                      admin: Staff = Depends(require_admin)):
    expire_pending(db)
    if (db.query(Staff).filter(or_(Staff.cnic == payload.cnic,
                                  func.lower(Staff.email) == payload.email)).first()
            or db.query(Credentials).filter(
                func.lower(Credentials.account_id) == payload.email).first()):
        raise HTTPException(409, "Staff already exists with this email or CNIC.")
    if db.query(Invitation).filter(
            Invitation.status == "pending",
            or_(Invitation.invite_email == payload.email,
                Invitation.cnic == payload.cnic)).first():
        raise HTTPException(409, "A pending invitation already exists for this email or CNIC.")
    token = secrets.token_urlsafe(32)
    created = now()
    invitation = Invitation(
        invite_email=payload.email, name=payload.name, cnic=payload.cnic,
        phone_number=payload.phone_number, designation=payload.designation,
        token_hash=token_hash(token), inviting_admin=admin.id,
        status="pending", created_at=created,
        expires_at=created + timedelta(hours=24))
    db.add(invitation)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A conflicting staff member or invitation already exists.")
    url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    url += "/set-password#" + urlencode({"token": token})
    # Only the creating admin receives the raw link. Store its hash, never the URL.
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    result = InvitationResponse.model_validate(invitation).model_dump()
    return {**result, "setup_url": url}


@router.post("/validate")
def validate_invitation(payload: InvitationToken, db: Session = Depends(get_db)):
    invitation = db.query(Invitation).filter(
        Invitation.token_hash == token_hash(payload.token)).first()
    valid(invitation)
    return {"valid": True, "expires_at": invitation.expires_at}


@router.post("/complete")
def complete_invitation(payload: PasswordSetupRequest, db: Session = Depends(get_db)):
    # Hash before claiming the invitation, then check the deadline in SQL.
    password = get_password_hash(payload.password)
    digest = token_hash(payload.token)
    invitation = db.query(Invitation).filter(
        Invitation.token_hash == digest).with_for_update().first()
    valid(invitation)
    # Conditional UPDATE also prevents double consumption on SQLite.
    claimed = db.query(Invitation).filter(
        Invitation.invite_id == invitation.invite_id,
        Invitation.status == "pending", Invitation.expires_at > now()).update(
        {"status": "accepted", "accepted_at": now()}, synchronize_session=False)
    if claimed != 1:
        db.rollback()
        raise HTTPException(410, "Invitation is expired or already used.")
    if (db.query(Staff).filter(or_(Staff.cnic == invitation.cnic,
                    func.lower(Staff.email) == invitation.invite_email)).first()
            or db.query(Credentials).filter(
                func.lower(Credentials.account_id) == invitation.invite_email).first()):
        db.rollback()
        raise HTTPException(409, "Staff already exists with this email or CNIC.")
    try:
        staff = Staff(cnic=invitation.cnic, name=invitation.name,
                      phone_number=invitation.phone_number,
                      designation=invitation.designation, email=invitation.invite_email)
        db.add(staff)
        db.flush()
        db.add(Credentials(staff_id=staff.id, account_id=invitation.invite_email,
                           password=password))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Staff information conflicts with an existing account.")
    return {"message": "Password set successfully. You can now log in."}


@router.post("/{invite_id}/revoke")
def revoke_invitation(invite_id: int, db: Session = Depends(get_db),
                      admin: Staff = Depends(require_admin)):
    updated = db.query(Invitation).filter(
        Invitation.invite_id == invite_id, Invitation.status == "pending").update(
        {"status": "revoked"}, synchronize_session=False)
    if not updated:
        raise HTTPException(409, "Only pending invitations can be revoked.")
    db.commit()
    return {"message": "Invitation revoked."}
