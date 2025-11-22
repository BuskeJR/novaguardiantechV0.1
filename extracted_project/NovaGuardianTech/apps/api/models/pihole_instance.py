from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import enum


class PiholeMode(str, enum.Enum):
    NXDOMAIN = "NXDOMAIN"
    NULL = "NULL"


class PiholeInstance(Base):
    __tablename__ = "pihole_instances"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    container_name = Column(String(255), nullable=False)
    internal_ip = Column(String(45), nullable=True)
    public_ip = Column(String(45), nullable=True)
    dns_port = Column(Integer, default=53)
    web_port = Column(Integer, nullable=True)
    admin_password = Column(String(255), nullable=True)
    status = Column(String(50), default="unknown")
    upstream_dns1 = Column(String(45), default="1.1.1.1")
    upstream_dns2 = Column(String(45), default="8.8.8.8")
    mode = Column(Enum(PiholeMode), default=PiholeMode.NXDOMAIN, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    client = relationship("Client", back_populates="pihole_instances")
