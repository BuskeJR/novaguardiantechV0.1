from fastapi import APIRouter, Request, Depends
from core.security import get_current_user
from models.user import User

router = APIRouter(prefix="/my-ip", tags=["IP Capture"])


@router.get("")
async def get_my_ip(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Captura o IP real do cliente atual.
    
    Útil para:
    - Descobrir o IP público do usuário
    - Adicionar rapidamente à whitelist
    - Troubleshooting de conectividade
    """
    
    # Tenta extrair o IP real de vários headers (proxy/load balancer)
    client_ip = (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or
        request.headers.get("X-Real-IP", "") or
        request.headers.get("CF-Connecting-IP", "") or  # Cloudflare
        request.client.host if request.client else "unknown"
    )
    
    # Informações adicionais sobre a request
    user_agent = request.headers.get("User-Agent", "unknown")
    
    return {
        "ip": client_ip,
        "user_agent": user_agent,
        "headers": {
            "x_forwarded_for": request.headers.get("X-Forwarded-For"),
            "x_real_ip": request.headers.get("X-Real-IP"),
            "cf_connecting_ip": request.headers.get("CF-Connecting-IP"),
        },
        "client_id": current_user.client_id
    }
