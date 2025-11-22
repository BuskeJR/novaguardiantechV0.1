from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class LocationBase(BaseModel):
    label: str = Field(..., min_length=2, max_length=255)
    public_ip: Optional[str] = Field(None, max_length=45)
    is_active: bool = True


class LocationCreate(LocationBase):
    client_id: int


class LocationUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=2, max_length=255)
    public_ip: Optional[str] = Field(None, max_length=45)
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: int
    client_id: int
    created_at: datetime

    class Config:
        from_attributes = True
