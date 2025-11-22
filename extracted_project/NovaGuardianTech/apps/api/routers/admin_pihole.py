from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from core.database import get_db
from core.security import get_current_user
from models.user import User, UserRole
from services.pihole_manager import PiholeManager
from pydantic import BaseModel

router = APIRouter(prefix="/admin/pihole", tags=["Admin - Pi-hole"])


class ProvisionRequest(BaseModel):
    client_id: int
    public_ip: str
    password: str = "novaguardian123"


class ProvisionResponse(BaseModel):
    id: int
    client_id: int
    client_name: str
    container_name: str
    internal_ip: str
    public_ip: str
    dns_port: int
    web_port: int
    web_url: str
    status: str
    container_id: str


class DeprovisionResponse(BaseModel):
    success: bool
    message: str
    container_name: str


class InstanceStatusResponse(BaseModel):
    status: str
    running: bool
    health: str | None = None
    container_id: str | None = None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/provision", response_model=ProvisionResponse)
async def provision_pihole_instance(
    request: ProvisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        manager = PiholeManager()
        if not manager.docker_available:
            raise HTTPException(
                status_code=503, 
                detail="Docker is not available. Pi-hole provisioning requires Docker to be running."
            )
        result = manager.provision_instance(
            db=db,
            client_id=request.client_id,
            public_ip=request.public_ip,
            password=request.password
        )
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to provision instance: {str(e)}")


@router.delete("/{client_id}", response_model=DeprovisionResponse)
async def deprovision_pihole_instance(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        manager = PiholeManager()
        if not manager.docker_available:
            raise HTTPException(
                status_code=503,
                detail="Docker is not available. Cannot deprovision Pi-hole instances."
            )
        result = manager.deprovision_instance(db=db, client_id=client_id)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deprovision instance: {str(e)}")


@router.get("/list")
async def list_pihole_instances(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        manager = PiholeManager()
        instances = manager.list_instances(db=db)
        return {
            "total": len(instances),
            "instances": instances
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list instances: {str(e)}")


@router.post("/{container_name}/restart")
async def restart_pihole_instance(
    container_name: str,
    current_user: User = Depends(require_admin)
):
    try:
        manager = PiholeManager()
        if not manager.docker_available:
            raise HTTPException(
                status_code=503,
                detail="Docker is not available. Cannot restart Pi-hole instances."
            )
        result = manager.restart_instance(container_name=container_name)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restart instance: {str(e)}")


@router.get("/{container_name}/status", response_model=InstanceStatusResponse)
async def get_instance_status(
    container_name: str,
    current_user: User = Depends(require_admin)
):
    try:
        manager = PiholeManager()
        status = manager.get_instance_status(container_name=container_name)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.post("/dnsdist/update-config")
async def update_dnsdist_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        manager = PiholeManager()
        if not manager.docker_available:
            raise HTTPException(
                status_code=503,
                detail="Docker is not available. Cannot update dnsdist configuration."
            )
        result = manager.update_dnsdist_config(db=db)
        return {
            "success": True,
            "instances_count": result["instances_count"],
            "pools": result["pools"],
            "message": f"dnsdist config generated for {result['instances_count']} instances",
            "config_preview": result["config"][:500] + "...",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update config: {str(e)}")
