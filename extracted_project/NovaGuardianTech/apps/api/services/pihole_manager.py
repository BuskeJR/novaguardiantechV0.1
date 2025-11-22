import docker
from docker.models.containers import Container
from docker.errors import DockerException, NotFound, APIError
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from models.pihole_instance import PiholeInstance
from models.client import Client
from core.config import settings
import ipaddress


class PiholeManager:
    def __init__(self):
        try:
            self.client = docker.from_env()
            self.docker_available = True
        except DockerException as e:
            self.client = None
            self.docker_available = False
    
    def _get_next_ip(self, db: Session) -> str:
        instances = db.query(PiholeInstance).all()
        used_ips = {inst.internal_ip for inst in instances if inst.internal_ip}
        
        base_network = ipaddress.ip_network(settings.PIHOLE_SUBNET)
        start_ip = int(ipaddress.ip_address(f"172.20.0.{settings.PIHOLE_IP_START}"))
        
        for i in range(settings.PIHOLE_IP_START, 255):
            candidate_ip = str(ipaddress.ip_address(f"172.20.0.{i}"))
            if candidate_ip not in used_ips:
                return candidate_ip
        
        raise Exception("No available IPs in subnet")
    
    def _get_next_web_port(self, db: Session) -> int:
        instances = db.query(PiholeInstance).all()
        used_ports = {inst.web_port for inst in instances if inst.web_port}
        
        port = settings.PIHOLE_BASE_PORT
        while port in used_ports:
            port += 1
            if port > 9999:
                raise Exception("No available ports")
        
        return port
    
    def provision_instance(
        self,
        db: Session,
        client_id: int,
        public_ip: str,
        password: str = "novaguardian123"
    ) -> Dict[str, Any]:
        if not self.docker_available:
            raise ValueError("Docker is not available. Cannot provision Pi-hole instances.")
        
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        existing = db.query(PiholeInstance).filter(
            PiholeInstance.client_id == client_id
        ).first()
        if existing:
            raise ValueError(f"Pi-hole instance already exists for client {client_id}")
        
        container_name = f"pihole-client-{client_id}"
        internal_ip = self._get_next_ip(db)
        web_port = self._get_next_web_port(db)
        
        try:
            network = self.client.networks.get(settings.DOCKER_NETWORK)
        except NotFound:
            raise Exception(f"Docker network '{settings.DOCKER_NETWORK}' not found. Run 'docker-compose up' first.")
        
        try:
            container = self.client.containers.run(
                settings.PIHOLE_IMAGE,
                name=container_name,
                hostname=container_name,
                detach=True,
                environment={
                    "TZ": "America/Sao_Paulo",
                    "WEBPASSWORD": password,
                    "FTLCONF_LOCAL_IPV4": internal_ip,
                    "PIHOLE_DNS_": "1.1.1.1;8.8.8.8",
                    "DNSMASQ_LISTENING": "all",
                    "DNSSEC": "false",
                    "REV_SERVER": "false",
                    "BLOCKING_ENABLED": "true",
                },
                volumes={
                    f"pihole_client_{client_id}_etc": {"bind": "/etc/pihole", "mode": "rw"},
                    f"pihole_client_{client_id}_dnsmasq": {"bind": "/etc/dnsmasq.d", "mode": "rw"},
                },
                ports={
                    "80/tcp": web_port,
                },
                dns=["127.0.0.1", "1.1.1.1"],
                cap_add=["NET_ADMIN"],
                restart_policy={"Name": "unless-stopped"},
            )
            
            network.connect(container, ipv4_address=internal_ip)
            
        except APIError as e:
            raise Exception(f"Failed to create container: {str(e)}")
        
        pihole_instance = PiholeInstance(
            client_id=client_id,
            container_name=container_name,
            internal_ip=internal_ip,
            public_ip=public_ip,
            dns_port=53,
            web_port=web_port,
            admin_password=password,
            status="running",
        )
        
        db.add(pihole_instance)
        db.commit()
        db.refresh(pihole_instance)
        
        return {
            "id": pihole_instance.id,
            "client_id": client_id,
            "client_name": client.name,
            "container_name": container_name,
            "internal_ip": internal_ip,
            "public_ip": public_ip,
            "dns_port": 53,
            "web_port": web_port,
            "web_url": f"http://localhost:{web_port}/admin",
            "status": "running",
            "container_id": container.id,
        }
    
    def deprovision_instance(self, db: Session, client_id: int) -> Dict[str, Any]:
        if not self.docker_available:
            raise ValueError("Docker is not available. Cannot deprovision Pi-hole instances.")
        
        instance = db.query(PiholeInstance).filter(
            PiholeInstance.client_id == client_id
        ).first()
        
        if not instance:
            raise ValueError(f"No Pi-hole instance found for client {client_id}")
        
        try:
            container = self.client.containers.get(instance.container_name)
            container.stop(timeout=10)
            container.remove(v=True)
        except NotFound:
            pass
        except APIError as e:
            raise Exception(f"Failed to remove container: {str(e)}")
        
        db.delete(instance)
        db.commit()
        
        return {
            "success": True,
            "message": f"Pi-hole instance for client {client_id} removed",
            "container_name": instance.container_name,
        }
    
    def get_instance_status(self, container_name: str) -> Dict[str, Any]:
        if not self.docker_available:
            return {
                "status": "docker_unavailable",
                "running": False,
            }
        
        try:
            container = self.client.containers.get(container_name)
            return {
                "status": container.status,
                "health": container.attrs.get("State", {}).get("Health", {}).get("Status"),
                "running": container.status == "running",
                "container_id": container.id,
            }
        except NotFound:
            return {
                "status": "not_found",
                "running": False,
            }
    
    def list_instances(self, db: Session) -> List[Dict[str, Any]]:
        instances = db.query(PiholeInstance).all()
        result = []
        
        for instance in instances:
            # If Docker is not available, mark all as unavailable
            if not self.docker_available:
                status = {"status": "docker_unavailable", "running": False}
            else:
                status = self.get_instance_status(instance.container_name)
            
            client = db.query(Client).filter(Client.id == instance.client_id).first()
            
            result.append({
                "id": instance.id,
                "client_id": instance.client_id,
                "client_name": client.name if client else "Unknown",
                "container_name": instance.container_name,
                "internal_ip": instance.internal_ip,
                "public_ip": instance.public_ip,
                "dns_port": instance.dns_port,
                "web_port": instance.web_port,
                "web_url": f"http://localhost:{instance.web_port}/admin" if instance.web_port else "N/A",
                "status": status["status"],
                "running": status["running"],
            })
            # Note: admin_password is intentionally NOT exposed in the response for security
        
        return result
    
    def restart_instance(self, container_name: str) -> Dict[str, Any]:
        if not self.docker_available:
            raise ValueError("Docker is not available. Cannot restart Pi-hole instances.")
        
        try:
            container = self.client.containers.get(container_name)
            container.restart(timeout=10)
            return {
                "success": True,
                "message": f"Container {container_name} restarted",
                "status": container.status,
            }
        except NotFound:
            raise ValueError(f"Container {container_name} not found")
        except APIError as e:
            raise Exception(f"Failed to restart container: {str(e)}")
    
    def update_dnsdist_config(self, db: Session) -> Dict[str, Any]:
        if not self.docker_available:
            raise ValueError("Docker is not available. Cannot update dnsdist configuration.")
        
        instances = db.query(PiholeInstance).filter(
            PiholeInstance.status == "running"
        ).all()
        
        pools_config = []
        routing_rules = []
        
        for instance in instances:
            pool_name = f"client_{instance.client_id}"
            
            pools_config.append(
                f'newServer({{address="{instance.internal_ip}:53", name="{instance.container_name}", pool="{pool_name}"}})'
            )
            
            routing_rules.append(
                f'addAction(NetmaskGroupRule(newNMG({{"{instance.public_ip}/32"}})), PoolAction("{pool_name}"))'
            )
        
        config_template = f"""-- dnsdist configuration for multi-client DNS routing
-- Auto-generated by NovaGuardianTech

-- Listen on all interfaces, port 5353
setLocal("0.0.0.0:5353")

-- Logging
setVerbose(true)

-- Backend Pi-hole instances
{chr(10).join(pools_config)}

-- Default fallback (Google DNS)
newServer({{address="8.8.8.8:53", name="google-dns", pool="default"}})

-- Routing rules based on source IP
{chr(10).join(routing_rules)}

-- All other IPs use default pool (Google DNS)
addAction(AllRule(), PoolAction("default"))

-- Statistics and web interface
webserver("0.0.0.0:8053")
setWebserverConfig({{password="novaguardian-dnsdist-2024", apiKey="novaguardian-api-key"}})

-- Health checks
setServerPolicy(firstAvailable)

-- Cache settings
pc = newPacketCache(10000, {{maxTTL=86400, minTTL=0}})
{chr(10).join([f'getPool("client_{i.client_id}"):setCache(pc)' for i in instances])}

print("dnsdist configured with {len(instances)} Pi-hole instances")
"""
        
        return {
            "instances_count": len(instances),
            "config": config_template,
            "pools": [f"client_{i.client_id}" for i in instances],
        }
