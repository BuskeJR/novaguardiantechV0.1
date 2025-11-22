from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaGuardianTech"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str
    
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600
    
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8080
    API_RELOAD: bool = True
    
    CORS_ORIGINS: str = "http://localhost:5000"
    
    ENVIRONMENT: str = "development"
    
    DOCKER_NETWORK: str = "novaguardian"
    PIHOLE_BASE_PORT: int = 8081
    PIHOLE_IMAGE: str = "pihole/pihole:latest"
    PIHOLE_SUBNET: str = "172.20.0.0/16"
    PIHOLE_IP_START: int = 10
    
    DNSDIST_CONFIG_PATH: str = "/etc/dnsdist/dnsdist.conf"
    DNSDIST_CONTAINER: str = "novaguardian-dnsdist"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
