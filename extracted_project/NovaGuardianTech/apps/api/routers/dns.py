from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from core.database import get_db
from core.security import get_current_user
from models.user import User, UserRole
from models.domain_rule import DomainRule, DomainStatus
from models.pihole_instance import PiholeInstance
from services.pihole import PiholeService
from pydantic import BaseModel
import time

router = APIRouter(prefix="/dns", tags=["DNS"])


class DnsApplyResponse(BaseModel):
    ok: bool
    applied_count: int
    took_ms: int
    message: str


class DnsSyncResponse(BaseModel):
    ok: bool
    client_id: int
    container_name: str
    added: List[Dict[str, Any]]
    failed: List[Dict[str, Any]]
    total: int
    took_ms: int
    message: str


@router.get("/my-ip")
async def get_my_ip(request: Request):
    client_host = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("X-Forwarded-For")
    real_ip = request.headers.get("X-Real-IP")
    
    return {
        "ip": forwarded_for or real_ip or client_host,
        "headers": {
            "X-Forwarded-For": forwarded_for,
            "X-Real-IP": real_ip,
            "client_host": client_host
        }
    }


@router.post("/apply", response_model=DnsApplyResponse)
async def apply_dns_rules(
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_time = time.time()
    
    if current_user.role == UserRole.ADMIN:
        if client_id is None:
            if current_user.client_id is not None:
                client_id = current_user.client_id
            else:
                raise HTTPException(status_code=400, detail="Admin must specify client_id or have a default client")
    else:
        if current_user.client_id is None:
            raise HTTPException(status_code=400, detail="User not assigned to any client")
        client_id = current_user.client_id
    
    active_domains = db.query(DomainRule).filter(
        DomainRule.client_id == client_id,
        DomainRule.status == DomainStatus.ACTIVE
    ).all()
    
    took_ms = int((time.time() - start_time) * 1000)
    
    return DnsApplyResponse(
        ok=True,
        applied_count=len(active_domains),
        took_ms=took_ms,
        message=f"Applied {len(active_domains)} domain rules for client {client_id}. Use /dns/sync to sync with Pi-hole."
    )


@router.post("/sync", response_model=DnsSyncResponse)
async def sync_dns_rules_to_pihole(
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_time = time.time()
    
    if current_user.role == UserRole.ADMIN:
        if client_id is None:
            if current_user.client_id is not None:
                client_id = current_user.client_id
            else:
                raise HTTPException(status_code=400, detail="Admin must specify client_id or have a default client")
    else:
        if current_user.client_id is None:
            raise HTTPException(status_code=400, detail="User not assigned to any client")
        client_id = current_user.client_id
    
    pihole_instance = db.query(PiholeInstance).filter(
        PiholeInstance.client_id == client_id
    ).first()
    
    if not pihole_instance:
        raise HTTPException(
            status_code=404,
            detail=f"No Pi-hole instance found for client {client_id}"
        )
    
    active_domains = db.query(DomainRule).filter(
        DomainRule.client_id == client_id,
        DomainRule.status == DomainStatus.ACTIVE
    ).all()
    
    pihole_service = PiholeService(pihole_instance.container_name)
    
    if not pihole_service.is_running():
        raise HTTPException(
            status_code=503,
            detail=f"Pi-hole container '{pihole_instance.container_name}' is not running"
        )
    
    sync_result = pihole_service.sync_domains(active_domains)
    
    took_ms = int((time.time() - start_time) * 1000)
    
    return DnsSyncResponse(
        ok=len(sync_result["failed"]) == 0,
        client_id=client_id,
        container_name=pihole_instance.container_name,
        added=sync_result["added"],
        failed=sync_result["failed"],
        total=sync_result["total"],
        took_ms=took_ms,
        message=f"Synced {len(sync_result['added'])}/{sync_result['total']} domains to Pi-hole"
    )
