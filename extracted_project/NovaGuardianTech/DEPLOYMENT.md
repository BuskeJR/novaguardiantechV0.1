# NovaGuardianTech - Guia de Deployment

## 📋 Pré-requisitos

### Ambiente de Produção
- Python 3.11+
- Node.js 18+
- PostgreSQL 16
- Docker & Docker Compose
- 4GB RAM mínimo
- 20GB disco

### Secrets Necessários
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<gerar com: openssl rand -hex 32>
SESSION_SECRET=<gerar com: openssl rand -hex 32>
```

## 🚀 Deploy no Replit

### 1. Configurar Environment Variables

No painel Replit, adicione as seguintes secrets:

```bash
# Database (usar Neon PostgreSQL)
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=<secret-gerado>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Environment
ENVIRONMENT=production

# API
API_HOST=0.0.0.0
API_PORT=8080
API_RELOAD=false

# CORS (adicionar domínios de produção)
CORS_ORIGINS=https://seu-dominio.repl.co,https://seu-dominio.com

# Database Pool (produção)
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600

# Docker
DOCKER_NETWORK=novaguardian
PIHOLE_BASE_PORT=8081
```

### 2. Deploy Automático

O Replit está configurado para deploy automático. O build faz:

```bash
1. Frontend: npm install && npm run build
2. Backend: pip install -r requirements.txt
3. Migrations: Executadas automaticamente no startup
```

### 3. Verificar Deploy

```bash
# Health check
curl https://seu-app.repl.co/health

# API docs
https://seu-app.repl.co/docs

# Frontend
https://seu-app.repl.co/
```

## 🐳 Deploy com Docker (Self-Hosted)

### 1. Build das Imagens

```bash
# Build do backend
docker build -t novaguardian-api:latest -f apps/api/Dockerfile .

# Build do frontend
docker build -t novaguardian-web:latest -f apps/web/Dockerfile .
```

### 2. Deploy Completo

```bash
# Subir infraestrutura
docker-compose -f docker-compose.prod.yml up -d

# Executar migrations
docker exec novaguardian-api python /app/tools/migrate.py

# Verificar status
docker-compose ps
```

### 3. Setup Inicial

```bash
# Popular banco com dados iniciais
docker exec -it novaguardian-api python /app/tools/seed.py

# Criar primeiro admin
docker exec -it novaguardian-api python -c "
from tools.create_admin import create_admin
create_admin('admin@example.com', 'senha-forte-aqui', 'Admin Name')
"
```

## 🗄️ Database Management

### Backups Automáticos

```bash
# Backup manual
./tools/backup_database.sh .backups

# Configurar cron para backup diário (3AM)
0 3 * * * /path/to/tools/backup_database.sh /backups
```

### Restore de Backup

```bash
./tools/restore_database.sh .backups/novaguardian_backup_20251113_030000.sql
```

### Migrations

```bash
# Desenvolvimento: Criar nova migration
cd apps/api
alembic revision --autogenerate -m "Descrição da mudança"

# Produção: Aplicar migrations
python tools/migrate.py
```

## 🔧 Multi-Instance Pi-hole Setup

### Provisionar Primeira Instância

```bash
# 1. Obter token de admin
TOKEN=$(curl -X POST https://seu-app/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=senha" \
  | jq -r '.access_token')

# 2. Provisionar Pi-hole para cliente
curl -X POST https://seu-app/admin/pihole/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "public_ip": "203.0.113.10",
    "password": "pihole-senha-cliente-1"
  }'

# 3. Atualizar dnsdist config
curl -X POST https://seu-app/admin/pihole/dnsdist/update-config \
  -H "Authorization: Bearer $TOKEN"

# 4. Sincronizar regras DNS
curl -X POST https://seu-app/dns/sync \
  -H "Authorization: Bearer $TOKEN"
```

### Listar Todas as Instâncias

```bash
curl -X GET https://seu-app/admin/pihole/list \
  -H "Authorization: Bearer $TOKEN"
```

### Deprovision Instância

```bash
curl -X DELETE https://seu-app/admin/pihole/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Monitoramento

### Health Checks

```bash
# Script automático
./tools/health_check.sh

# Manual
curl https://seu-app/health
```

### Métricas Importantes

- **API Response Time**: < 200ms (p95)
- **Database Connections**: < 80% do pool
- **Pi-hole Containers**: Todos "running"
- **DNS Query Rate**: Monitorar via dnsdist:8053

### Logs

```bash
# API logs
docker logs -f novaguardian-api

# Frontend logs
docker logs -f novaguardian-web

# Pi-hole específico
docker logs -f pihole-client-1

# dnsdist logs
docker logs -f novaguardian-dnsdist
```

## 🔒 Segurança

### SSL/TLS

```bash
# Com Traefik (recomendado)
docker-compose -f docker-compose.traefik.yml up -d

# Ou com Nginx + Certbot
certbot --nginx -d seu-dominio.com
```

### Firewall

```bash
# Permitir apenas portas necessárias
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5353/udp  # DNS (apenas rede interna)
ufw enable
```

### Rate Limiting

Configurado automaticamente:
- `/auth/login`: 5 req/min por IP
- `/dns/sync`: 10 req/min por token
- `/domains`: 100 req/min por token

## 🔄 Rollback

### Rollback Completo

```bash
# 1. Parar serviços
docker-compose down

# 2. Restaurar backup
./tools/restore_database.sh .backups/novaguardian_backup_TIMESTAMP.sql

# 3. Voltar para versão anterior (Git)
git checkout <commit-hash-anterior>

# 4. Rebuild e restart
docker-compose build
docker-compose up -d
```

### Rollback de Código (Manter DB)

```bash
# Usar Replit Rollback
# Ou Git:
git revert <commit-hash>
git push
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Aumentar réplicas da API
docker-compose up -d --scale api=3

# Load balancer (Nginx)
upstream novaguardian_api {
    server api1:8080;
    server api2:8080;
    server api3:8080;
}
```

### Database Scaling

```bash
# Neon auto-scale (recomendado)
# Ou PostgreSQL Read Replicas:
DATABASE_WRITE_URL=postgresql://master/db
DATABASE_READ_URL=postgresql://replica/db
```

### Pi-hole Scaling

- 1 instância por cliente (já implementado)
- dnsdist distribui automaticamente
- Limite: ~100 instâncias por servidor (4GB RAM cada)

## 🆘 Troubleshooting

### API não inicia

```bash
# 1. Verificar logs
docker logs novaguardian-api

# 2. Verificar database
./tools/health_check.sh

# 3. Verificar secrets
env | grep DATABASE_URL
```

### Pi-hole não provisiona

```bash
# 1. Verificar Docker
docker ps

# 2. Verificar network
docker network inspect novaguardian

# 3. Verificar logs
docker logs pihole-client-X
```

### Frontend não carrega

```bash
# 1. Verificar build
cd apps/web && npm run build

# 2. Verificar API connection
curl http://localhost:8080/health

# 3. Verificar CORS
# Adicionar origem no CORS_ORIGINS
```

## 📞 Support Checklist

Antes de reportar problemas, executar:

```bash
# 1. Health check
./tools/health_check.sh

# 2. Coletar logs
docker-compose logs > logs.txt

# 3. Verificar versões
docker --version
python --version
node --version

# 4. Verificar recursos
df -h
free -h
docker stats --no-stream
```

## 🎯 Production Checklist

- [ ] DATABASE_URL configurado (Neon PostgreSQL)
- [ ] JWT_SECRET gerado e configurado
- [ ] CORS_ORIGINS com domínios de produção
- [ ] SSL/TLS configurado
- [ ] Backups automáticos configurados
- [ ] Health checks funcionando
- [ ] Rate limiting testado
- [ ] Logs centralizados
- [ ] Monitoramento configurado
- [ ] Firewall configurado
- [ ] DNS roteamento testado
- [ ] Multi-instância Pi-hole testada
- [ ] Rollback procedure testada
- [ ] Documentação de runbook criada
