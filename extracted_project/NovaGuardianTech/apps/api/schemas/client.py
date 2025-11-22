from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ClientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)
    is_active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=255)
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
