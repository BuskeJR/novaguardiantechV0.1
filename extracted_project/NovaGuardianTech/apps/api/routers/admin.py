from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.security import get_current_admin_user, get_password_hash
from models.user import User
from models.client import Client
from models.location import Location
from models.audit_log import AuditLog
from schemas.user import UserCreate, UserUpdate, UserResponse
from schemas.client import ClientCreate, ClientUpdate, ClientResponse
from schemas.location import LocationCreate, LocationUpdate, LocationResponse
from schemas.audit_log import AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).all()
    return [UserResponse.from_orm(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.from_orm(new_user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_data.email
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)
    if user_data.role is not None:
        user.role = user_data.role
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own user account")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return None


@router.get("/clients", response_model=List[ClientResponse])
async def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    clients = db.query(Client).all()
    return [ClientResponse.from_orm(c) for c in clients]


@router.post("/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy import func
    
    # Check for duplicate slug (case-insensitive)
    slug_normalized = client_data.slug.lower().strip()
    existing = db.query(Client).filter(func.lower(Client.slug) == slug_normalized).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Client with slug '{client_data.slug}' already exists")
    
    new_client = Client(
        name=client_data.name,
        slug=slug_normalized,
        is_active=client_data.is_active
    )
    db.add(new_client)
    
    try:
        db.commit()
        db.refresh(new_client)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Client with this slug already exists")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating client")
    
    return ClientResponse.from_orm(new_client)


@router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy import func
    
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check for duplicate slug if being updated (case-insensitive)
    if client_data.slug:
        slug_normalized = client_data.slug.lower().strip()
        if slug_normalized != client.slug.lower():
            existing = db.query(Client).filter(
                func.lower(Client.slug) == slug_normalized,
                Client.id != client_id
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Client with slug '{client_data.slug}' already exists")
            client.slug = slug_normalized
    
    if client_data.name is not None:
        client.name = client_data.name
    if client_data.is_active is not None:
        client.is_active = client_data.is_active
    
    try:
        db.commit()
        db.refresh(client)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Client with this slug already exists")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error updating client")
    
    return ClientResponse.from_orm(client)


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    from models.domain_rule import DomainRule
    from models.ip_whitelist import IpWhitelist
    from models.pihole_instance import PiholeInstance
    from sqlalchemy.exc import IntegrityError
    
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check for dependencies
    dependencies = []
    
    users_count = db.query(User).filter(User.client_id == client_id).count()
    if users_count > 0:
        dependencies.append(f"{users_count} user(s)")
    
    domains_count = db.query(DomainRule).filter(DomainRule.client_id == client_id).count()
    if domains_count > 0:
        dependencies.append(f"{domains_count} domain rule(s)")
    
    whitelist_count = db.query(IpWhitelist).filter(IpWhitelist.client_id == client_id).count()
    if whitelist_count > 0:
        dependencies.append(f"{whitelist_count} whitelist entry/entries")
    
    pihole_count = db.query(PiholeInstance).filter(PiholeInstance.client_id == client_id).count()
    if pihole_count > 0:
        dependencies.append(f"{pihole_count} Pi-hole instance(s)")
    
    audit_count = db.query(AuditLog).filter(AuditLog.client_id == client_id).count()
    if audit_count > 0:
        dependencies.append(f"{audit_count} audit log(s)")
    
    if dependencies:
        raise HTTPException(
            status_code=409, 
            detail=f"Cannot delete client. It has: {', '.join(dependencies)}. Please remove these first."
        )
    
    try:
        db.delete(client)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot delete client due to existing references")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting client")
    
    return None


@router.get("/locations", response_model=List[LocationResponse])
async def list_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    locations = db.query(Location).all()
    return [LocationResponse.from_orm(l) for l in locations]


@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    new_location = Location(**location_data.dict())
    
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    
    return LocationResponse.from_orm(new_location)


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(location)
    db.commit()
    
    return None


@router.get("/audit", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    from sqlalchemy.orm import joinedload
    
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    if user_id:
        query = query.filter(AuditLog.actor_user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if client_id:
        query = query.filter(AuditLog.client_id == client_id)
    
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return [AuditLogResponse.from_orm(log) for log in logs]
