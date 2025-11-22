from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    locations = relationship("Location", back_populates="client", cascade="all, delete-orphan")
    pihole_instances = relationship("PiholeInstance", back_populates="client", cascade="all, delete-orphan")
    domain_rules = relationship("DomainRule", back_populates="client", cascade="all, delete-orphan")
    ip_whitelist = relationship("IpWhitelist", back_populates="client", cascade="all, delete-orphan")
