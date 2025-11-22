# NovaGuardianTech - Guia Rápido de Início

## 🚀 Início Rápido (5 minutos)

### Pré-requisitos
- Docker e Docker Compose instalados
- Python 3.11+
- Node.js 18+

### 1. Iniciar Infraestrutura DNS

```bash
# Subir todos os containers
make dev

# Aguardar 30 segundos para Pi-hole inicializar
sleep 30

# Configurar Pi-hole (executar UMA vez)
bash tools/setup-pihole.sh
```

### 2. Iniciar Backend

```bash
cd apps/api

# Instalar dependências
pip install -r requirements.txt

# Popular banco de dados
cd ../tools
python seed.py

# Iniciar API
cd ../apps/api
python main.py
```

A API estará em: http://localhost:8080

### 3. Iniciar Frontend

```bash
cd apps/web

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

O frontend estará em: http://localhost:5000

## 🔐 Login

**Credenciais Admin**:
- Email: `admin@novaguardian.com`
- Senha: `admin123`

**Credenciais User**:
- Email: `user@example.com`
- Senha: `user123`

## 🧪 Testar Bloqueio DNS

### Via API

```bash
# 1. Fazer login e obter token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@novaguardian.com&password=admin123"

# Copiar o "access_token" da resposta

# 2. Adicionar domínio para bloquear
curl -X POST http://localhost:8080/domains \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "instagram.com",
    "kind": "EXACT",
    "description": "Bloqueio de rede social"
  }'

# 3. Sincronizar com Pi-hole
curl -X POST http://localhost:8080/dns/sync \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 4. Testar bloqueio
dig @127.0.0.1 -p 5353 instagram.com
# Deve retornar NXDOMAIN (bloqueado)

dig @127.0.0.1 -p 5353 google.com
# Deve retornar IP normal (permitido)
```

### Via Interface Web

1. Acesse http://localhost:5000
2. Faça login com admin@novaguardian.com / admin123
3. Vá em "Domains" → "Add Domain"
4. Adicione: `facebook.com` (EXACT)
5. Clique em "Sync DNS" (ícone de refresh)
6. Teste: `dig @127.0.0.1 -p 5353 facebook.com`

## 📊 Interfaces Web

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Frontend | http://localhost:5000 | admin@novaguardian.com / admin123 |
| API Docs | http://localhost:8080/docs | - |
| Pi-hole | http://localhost:8081/admin | Password: novaguardian123 |
| dnsdist | http://localhost:8053 | admin / novaguardian-dnsdist-2024 |

## 🔧 Comandos Úteis

```bash
# Ver logs de todos os containers
make logs

# Parar todos os serviços
make stop

# Limpar volumes e recomeçar
make clean
make dev

# Testar DNS automaticamente
make dns-test

# Ver status do dnsdist
make dns-status
```

## 📁 Estrutura Rápida

```
NovaGuardianTech/
├── apps/
│   ├── web/          # Frontend React (porta 5000)
│   └── api/          # Backend FastAPI (porta 8080)
├── infra/
│   ├── dnsdist/      # Config dnsdist
│   └── pihole/       # Config Pi-hole
├── tools/
│   ├── seed.py       # Popular BD
│   └── setup-pihole.sh  # Configurar Pi-hole
├── docker-compose.yml
└── Makefile
```

## ❓ Troubleshooting

### Pi-hole não bloqueia

```bash
# 1. Verificar se container está rodando
docker ps | grep pihole-demo

# 2. Reconfigurar Pi-hole
bash tools/setup-pihole.sh

# 3. Verificar gravity database
docker exec pihole-demo sqlite3 /etc/pihole/gravity.db \
  "SELECT * FROM domainlist WHERE comment='NovaGuardian';"
```

### API retorna 401 Unauthorized

- Token JWT expirou (válido por 24h)
- Faça login novamente para obter novo token
- Verifique se está enviando header: `Authorization: Bearer TOKEN`

### Frontend não conecta na API

- Verifique se API está rodando: http://localhost:8080/docs
- Verifique proxy Vite em `apps/web/vite.config.js`
- Limpe cache do browser (Ctrl+Shift+R)

### Docker não sobe

```bash
# Verificar portas em uso
sudo lsof -i :5353  # dnsdist
sudo lsof -i :8081  # Pi-hole
sudo lsof -i :5432  # PostgreSQL

# Limpar tudo e recomeçar
make clean
docker system prune -a
make dev
```

## 📚 Próximos Passos

1. ✅ Explorar interface web
2. ✅ Adicionar múltiplos domínios
3. ✅ Testar bloqueios DNS reais
4. ✅ Configurar regex patterns
5. ✅ Adicionar IPs na whitelist
6. ✅ Ver logs de auditoria (em desenvolvimento)
7. 📋 Deploy em produção (Fase D)

## 🆘 Suporte

- Documentação completa: `replit.md`
- Documentação da API: http://localhost:8080/docs
- Documentação Pi-hole: `infra/pihole/README.md`
