from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any

class UserBasic(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    client_id: Optional[int] = None
    action: str
    payload_json: Optional[Any] = None
    created_at: datetime
    user: Optional[UserBasic] = None
    
    class Config:
        from_attributes = True
