from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from models.domain_rule import DomainKind, DomainStatus


class DomainRuleBase(BaseModel):
    domain: str = Field(..., min_length=3, max_length=500)
    kind: DomainKind = DomainKind.EXACT
    status: DomainStatus = DomainStatus.ACTIVE
    reason: Optional[str] = None


class DomainRuleCreate(DomainRuleBase):
    client_id: Optional[int] = None


class DomainRuleUpdate(BaseModel):
    domain: Optional[str] = Field(None, min_length=3, max_length=500)
    kind: Optional[DomainKind] = None
    status: Optional[DomainStatus] = None
    reason: Optional[str] = None


class DomainRuleResponse(DomainRuleBase):
    id: int
    client_id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
