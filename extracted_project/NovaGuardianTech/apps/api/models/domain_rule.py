from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import enum


class DomainKind(str, enum.Enum):
    EXACT = "EXACT"
    REGEX = "REGEX"


class DomainStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class DomainRule(Base):
    __tablename__ = "domain_rules"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(500), nullable=False)
    kind = Column(Enum(DomainKind), default=DomainKind.EXACT, nullable=False)
    status = Column(Enum(DomainStatus), default=DomainStatus.ACTIVE, nullable=False)
    reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    client = relationship("Client", back_populates="domain_rules")
