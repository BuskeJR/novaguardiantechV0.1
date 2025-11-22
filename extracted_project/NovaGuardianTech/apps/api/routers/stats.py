from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.client import Client
from models.domain_rule import DomainRule
from models.ip_whitelist import IpWhitelist

router = APIRouter(tags=["stats"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get system statistics for dashboard"""
    
    clients_count = db.query(Client).count()
    domains_count = db.query(DomainRule).count()
    whitelist_count = db.query(IpWhitelist).count()
    
    pihole_instances_count = 0
    try:
        import docker
        client = docker.from_env()
        containers = client.containers.list(filters={"name": "pihole_client_"})
        pihole_instances_count = len(containers)
    except:
        pass
    
    return {
        "clients_count": clients_count,
        "domains_count": domains_count,
        "whitelist_count": whitelist_count,
        "pihole_instances_count": pihole_instances_count,
    }
