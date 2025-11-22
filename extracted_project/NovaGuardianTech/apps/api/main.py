from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from core.config import settings
from core.database import get_db
from routers import auth, domains, whitelist, dns, admin, admin_pihole, stats, my_ip

app = FastAPI(
    title="NovaGuardianTech API",
    description="API for DNS blocking management with multi-client support",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(domains.router)
app.include_router(whitelist.router)
app.include_router(dns.router)
app.include_router(admin.router)
app.include_router(admin_pihole.router)
app.include_router(stats.router)
app.include_router(my_ip.router)


@app.get("/")
async def root():
    return {
        "message": "NovaGuardianTech API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "ok"
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint - verifica status da API e dependências
    """
    from datetime import datetime
    import time
    
    start_time = time.time()
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Verifica database
    try:
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = {"status": "up", "message": "PostgreSQL connected"}
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["services"]["database"] = {"status": "down", "error": str(e)}
    
    # Verifica Docker (PiholeManager)
    try:
        from services.pihole_manager import PiholeManager
        manager = PiholeManager()
        if manager.docker_available:
            health_status["services"]["docker"] = {"status": "up", "message": "Docker daemon connected"}
        else:
            health_status["services"]["docker"] = {"status": "unavailable", "message": "Docker not available (expected in Replit)"}
    except Exception as e:
        health_status["services"]["docker"] = {"status": "error", "error": str(e)}
    
    # Tempo de resposta
    response_time = round((time.time() - start_time) * 1000, 2)
    health_status["response_time_ms"] = response_time
    
    return health_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )
