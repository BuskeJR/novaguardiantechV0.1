from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
from models.user import User, UserRole
from models.ip_whitelist import IpWhitelist
from models.client import Client
from schemas.ip_whitelist import IpWhitelistCreate, IpWhitelistResponse

router = APIRouter(prefix="/whitelist", tags=["IP Whitelist"])


def get_user_client_id(user: User, client_id: int = None) -> int:
    if user.role == UserRole.ADMIN:
        if client_id is not None:
            return client_id
        if user.client_id is not None:
            return user.client_id
        raise HTTPException(status_code=400, detail="Admin must specify client_id or have a default client")
    else:
        if user.client_id is None:
            raise HTTPException(status_code=400, detail="User not assigned to any client")
        return user.client_id


@router.get("", response_model=List[IpWhitelistResponse])
async def list_whitelist(
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = get_user_client_id(current_user, client_id)
    whitelist = db.query(IpWhitelist).filter(IpWhitelist.client_id == client_id).all()
    return [IpWhitelistResponse.from_orm(w) for w in whitelist]


@router.post("", response_model=IpWhitelistResponse, status_code=status.HTTP_201_CREATED)
async def create_whitelist_entry(
    whitelist_data: IpWhitelistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = get_user_client_id(current_user, whitelist_data.client_id)
    
    new_entry = IpWhitelist(
        client_id=client_id,
        ip_address=whitelist_data.ip_address,
        label=whitelist_data.label,
        created_by=current_user.id
    )
    
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return IpWhitelistResponse.from_orm(new_entry)


@router.delete("/{whitelist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_whitelist_entry(
    whitelist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(IpWhitelist).filter(IpWhitelist.id == whitelist_id).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Whitelist entry not found")
    
    if current_user.role != UserRole.ADMIN:
        if current_user.client_id != entry.client_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this entry")
    
    db.delete(entry)
    db.commit()
    
    return None
