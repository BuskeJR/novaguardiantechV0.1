from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
from models.user import User, UserRole
from models.domain_rule import DomainRule
from models.client import Client
from schemas.domain_rule import DomainRuleCreate, DomainRuleUpdate, DomainRuleResponse

router = APIRouter(prefix="/domains", tags=["Domain Rules"])


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


@router.get("", response_model=List[DomainRuleResponse])
async def list_domains(
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = get_user_client_id(current_user, client_id)
    domains = db.query(DomainRule).filter(DomainRule.client_id == client_id).all()
    return [DomainRuleResponse.from_orm(d) for d in domains]


@router.post("", response_model=DomainRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_domain(
    domain_data: DomainRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = get_user_client_id(current_user, domain_data.client_id)
    
    new_domain = DomainRule(
        client_id=client_id,
        domain=domain_data.domain,
        kind=domain_data.kind,
        status=domain_data.status,
        reason=domain_data.reason,
        created_by=current_user.id
    )
    
    db.add(new_domain)
    db.commit()
    db.refresh(new_domain)
    
    return DomainRuleResponse.from_orm(new_domain)


@router.patch("/{domain_id}", response_model=DomainRuleResponse)
async def update_domain(
    domain_id: int,
    domain_data: DomainRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    domain = db.query(DomainRule).filter(DomainRule.id == domain_id).first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain rule not found")
    
    if current_user.role != UserRole.ADMIN:
        if current_user.client_id != domain.client_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this domain")
    
    if domain_data.domain is not None:
        domain.domain = domain_data.domain
    if domain_data.kind is not None:
        domain.kind = domain_data.kind
    if domain_data.status is not None:
        domain.status = domain_data.status
    if domain_data.reason is not None:
        domain.reason = domain_data.reason
    
    db.commit()
    db.refresh(domain)
    
    return DomainRuleResponse.from_orm(domain)


@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    domain = db.query(DomainRule).filter(DomainRule.id == domain_id).first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain rule not found")
    
    if current_user.role != UserRole.ADMIN:
        if current_user.client_id != domain.client_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this domain")
    
    db.delete(domain)
    db.commit()
    
    return None
