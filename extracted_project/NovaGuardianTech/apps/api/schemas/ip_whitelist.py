from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
import re


class IpWhitelistBase(BaseModel):
    ip_address: str = Field(..., min_length=7, max_length=45)
    label: Optional[str] = Field(None, max_length=255)

    @field_validator('ip_address')
    @classmethod
    def validate_ip(cls, v):
        ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        ipv6_pattern = r'^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$'
        
        if not (re.match(ipv4_pattern, v) or re.match(ipv6_pattern, v)):
            raise ValueError('Invalid IP address format')
        
        return v


class IpWhitelistCreate(IpWhitelistBase):
    client_id: Optional[int] = None


class IpWhitelistResponse(IpWhitelistBase):
    id: int
    client_id: int
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
