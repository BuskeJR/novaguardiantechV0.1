# 🚀 Guia de Deploy - NovaGuardianTech

**Checklist completo para deployment em produção**

---

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Preparação do Servidor](#-preparação-do-servidor)
3. [Configuração do Banco de Dados](#-configuração-do-banco-de-dados)
4. [Deploy da Aplicação](#-deploy-da-aplicação)
5. [Configuração DNS](#-configuração-dns)
6. [SSL/HTTPS](#-sslhttps)
7. [Monitoramento](#-monitoramento)
8. [Backups](#-backups)
9. [Troubleshooting](#-troubleshooting)

---

## ✅ Pré-requisitos

### Hardware Mínimo

- **CPU**: 2 cores
- **RAM**: 4GB (mínimo), 8GB (recomendado)
- **Disco**: 40GB SSD
- **Rede**: IP público fixo + porta 53 UDP/TCP aberta

### Software Necessário

- Ubuntu 22.04 LTS (ou Debian 11+)
- Docker 24.0+
- Docker Compose 2.20+
- Git
- Certbot (para SSL)

---

## 🖥️ Preparação do Servidor

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget htop ufw
```

### 2. Instalar Docker

```bash
# Remover versões antigas
sudo apt remove docker docker-engine docker.io containerd runc

# Adicionar repositório Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

### 3. Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir DNS (IMPORTANTE!)
sudo ufw allow 53/tcp
sudo ufw allow 53/udp

# Ativar firewall
sudo ufw enable
sudo ufw status
```

### 4. Criar Usuário Deploy

```bash
# Criar usuário dedicado
sudo adduser novaguard
sudo usermod -aG docker novaguard
sudo usermod -aG sudo novaguard

# Trocar para novo usuário
su - novaguard
```

---

## 🗄️ Configuração do Banco de Dados

### Opção A: PostgreSQL Gerenciado (Recomendado)

**Providers sugeridos:**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL + extras
- [DigitalOcean Managed DB](https://www.digitalocean.com/products/managed-databases-postgresql)
- [Railway](https://railway.app) - Deploy fácil

**Configuração:**

1. Crie uma instância PostgreSQL 16
2. Copie a `DATABASE_URL` fornecida
3. Configure backups automáticos (diários)
4. Ative SSL/TLS

**Exemplo de DATABASE_URL:**
```
postgresql://user:password@host.provider.com:5432/dbname?sslmode=require
```

### Opção B: PostgreSQL Self-Hosted

```bash
# Via Docker Compose (já incluído)
# O arquivo docker-compose.yml já tem PostgreSQL configurado

# OU instalar direto no servidor
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Criar database e usuário
sudo -u postgres psql
CREATE DATABASE novaguard;
CREATE USER novaguard WITH ENCRYPTED PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE novaguard TO novaguard;
\q
```

---

## 🚀 Deploy da Aplicação

### 1. Clonar Repositório

```bash
cd /home/novaguard
git clone https://github.com/seu-usuario/NovaGuardianTech.git
cd NovaGuardianTech
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar variáveis
nano .env
```

**Variáveis OBRIGATÓRIAS para produção:**

```env
# API
API_PORT=8080
JWT_SECRET=GERE_UM_SEGREDO_FORTE_AQUI  # openssl rand -hex 32
API_HOST=0.0.0.0
API_RELOAD=false

# Database (use URL do provider gerenciado)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# CORS (adicione seu domínio)
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Frontend
VITE_API_URL=https://api.seudominio.com
VITE_USE_MOCK=false
VITE_BRAND_NAME=NovaGuardianTech

# DNS (IMPORTANTE!)
PUBLIC_IP_DEMO=SEU_IP_PUBLICO
DNSDIST_LISTEN_PORT=53

# Segurança
ENVIRONMENT=production
DEBUG=false
```

**Gerar JWT_SECRET seguro:**
```bash
openssl rand -hex 32
```

### 3. Build das Imagens

```bash
# Build de todos os serviços
docker compose build

# OU build individual
docker compose build api
docker compose build web
```

### 4. Executar Migrations

```bash
# Popular banco com admin inicial
docker compose run --rm api python tools/seed.py
```

### 5. Iniciar Serviços

```bash
# Subir todos os containers
docker compose up -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

### 6. Verificar Saúde dos Serviços

```bash
# Via Makefile
make health

# OU manualmente
curl http://localhost:8080/health
curl http://localhost:5000
```

---

## 🌐 Configuração DNS

### 1. Apontamento de Domínios

Configure os seguintes registros DNS:

```
# Frontend
A     seudominio.com         -> SEU_IP_SERVIDOR
A     www.seudominio.com     -> SEU_IP_SERVIDOR

# API
A     api.seudominio.com     -> SEU_IP_SERVIDOR

# Servidor DNS (para clientes)
A     dns.seudominio.com     -> SEU_IP_SERVIDOR
```

### 2. Configurar Clientes para Usar o DNS

**Instruir clientes a configurar:**

#### Windows
```
Painel de Controle > Rede e Internet > Central de Rede e Compartilhamento
> Alterar configurações do adaptador > Propriedades > IPv4 > Propriedades
DNS preferencial: SEU_IP_SERVIDOR
```

#### macOS
```
Preferências do Sistema > Rede > Avançado > DNS
Adicionar: SEU_IP_SERVIDOR
```

#### Linux
```bash
# Editar /etc/resolv.conf
sudo nano /etc/resolv.conf

# Adicionar
nameserver SEU_IP_SERVIDOR
```

#### Roteadores
```
Configurações DHCP > DNS Primário: SEU_IP_SERVIDOR
```

---

## 🔒 SSL/HTTPS

### Usando Nginx + Certbot (Recomendado)

#### 1. Instalar Nginx

```bash
sudo apt install nginx
```

#### 2. Configurar Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/novaguardian
```

**Conteúdo:**

```nginx
# Frontend
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/novaguardian /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Instalar SSL com Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificados
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
sudo certbot --nginx -d api.seudominio.com

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

---

## 📊 Monitoramento

### 1. Health Checks Automáticos

**Criar script de monitoramento:**

```bash
#!/bin/bash
# /home/novaguard/monitor.sh

API_HEALTH=$(curl -s http://localhost:8080/health | jq -r '.status')

if [ "$API_HEALTH" != "healthy" ]; then
    echo "API unhealthy! Restarting..."
    cd /home/novaguard/NovaGuardianTech
    docker compose restart api
    
    # Enviar notificação (opcional)
    # curl -X POST https://hooks.slack.com/... -d '{"text":"API down!"}'
fi
```

```bash
chmod +x /home/novaguard/monitor.sh

# Adicionar ao crontab (executa a cada 5min)
crontab -e
```

```cron
*/5 * * * * /home/novaguard/monitor.sh
```

### 2. Logs Centralizados

```bash
# Rotação de logs
docker compose logs --tail=1000 > logs/app_$(date +%Y%m%d).log

# Limpar logs antigos (30 dias)
find logs/ -name "app_*.log" -mtime +30 -delete
```

---

## 💾 Backups

### 1. Backup Automático do PostgreSQL

```bash
# Configurar backup diário
crontab -e
```

```cron
# Backup diário às 2h da manhã
0 2 * * * cd /home/novaguard/NovaGuardianTech && make backup

# Limpar backups com +7 dias
0 3 * * * find /home/novaguard/NovaGuardianTech/backups -name "*.sql.gz" -mtime +7 -delete
```

### 2. Backup para S3/Spaces (Opcional)

```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure

# Adicionar ao script de backup
# (já incluído em tools/backup_postgres.sh)
```

### 3. Testar Restauração

```bash
# Restaurar backup
gunzip -c backups/novaguard_20241116_020000.sql.gz | \
  docker compose exec -T db psql -U novaguard -d novaguard
```

---

## 🔧 Troubleshooting

### Problema: Containers não iniciam

```bash
# Ver logs detalhados
docker compose logs api
docker compose logs db

# Reiniciar serviços
docker compose restart

# Recriar containers
docker compose down
docker compose up -d --force-recreate
```

### Problema: DNS não resolve

```bash
# Verificar dnsdist
docker compose logs dnsdist

# Testar manualmente
dig @127.0.0.1 -p 53 google.com

# Verificar portas
sudo netstat -tulpn | grep :53
```

### Problema: 502 Bad Gateway (Nginx)

```bash
# Verificar se API está rodando
curl http://localhost:8080/health

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Banco de dados desconectado

```bash
# Verificar PostgreSQL
docker compose exec db pg_isready -U novaguard

# Ver logs
docker compose logs db

# Conectar manualmente
docker compose exec db psql -U novaguard -d novaguard
```

---

## ✅ Checklist Final de Deploy

- [ ] Servidor configurado (firewall, usuários)
- [ ] Docker e Docker Compose instalados
- [ ] Banco de dados criado (gerenciado ou self-hosted)
- [ ] `.env` configurado com valores de produção
- [ ] `JWT_SECRET` gerado aleatoriamente
- [ ] Migrations executadas (`make seed`)
- [ ] Containers rodando (`docker compose ps`)
- [ ] Health check passa (`make health`)
- [ ] Domínios apontados corretamente
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS habilitado (Certbot)
- [ ] Backups automáticos configurados (cron)
- [ ] Monitoramento ativo
- [ ] Teste de DNS funcionando (`dig @SEU_IP dominio.com`)
- [ ] Clientes configurados para usar o DNS
- [ ] Documentação atualizada

---

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/NovaGuardianTech/issues
- **Email**: suporte@novaguardiantech.com

---

**Desenvolvido com ❤️ - NovaGuardianTech Team**
