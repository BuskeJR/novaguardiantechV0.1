# 🖱️ CONFIGURAR LOGIN - GUIA PASSO-A-PASSO VISUAL

## 🚀 RESUMO RÁPIDO
```
O login não funciona em produção porque:
❌ SESSION_SECRET não existe
❌ DATABASE_URL não está configurada

SOLUÇÃO: Adicionar 7 variáveis em 2 lugares
⏱️ Tempo: ~5 minutos
```

---

# 📍 PASSO 1: GITHUB SECRETS (2 minutos)

### Onde?
```
https://github.com/BuskeJR/novaguardiantechV0.1/settings/secrets/actions
```

### Como Abrir?
1. Vá para seu **repositório no GitHub**
2. Clique em **⚙️ Settings** (menu superior direita)
3. No menu esquerdo, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret** (botão verde)

---

## Secret 1️⃣: DIGITALOCEAN_ACCESS_TOKEN

### Obter o Token
```
1. Abra: https://cloud.digitalocean.com/account/api/tokens
2. Clique em "Generate New Token"
3. Nome: "GitHub Deploy"
4. Selecione "Full access"
5. Clique "Generate Token"
6. COPIE o token (⚠️ só aparece uma vez!)
```

### Adicionar no GitHub
```
Field: Name
Value: DIGITALOCEAN_ACCESS_TOKEN

Field: Secret
Value: (Cole o token que copiou)

Clique: Add secret
```

---

## Secret 2️⃣: DIGITALOCEAN_REGISTRY_NAME

### Obter o Nome
```
1. Abra: https://cloud.digitalocean.com/account/kubernetes/registries
2. Copie o "Registry Name" (ex: busker-registry)
   Deve ser algo como: xxxx-xxxxx
```

### Adicionar no GitHub
```
Field: Name
Value: DIGITALOCEAN_REGISTRY_NAME

Field: Secret
Value: (Cole o registry name, ex: busker-registry)

Clique: Add secret
```

---

## Secret 3️⃣: DATABASE_URL

### Obter a Connection String
```
1. Abra: https://cloud.digitalocean.com/databases
2. Clique no seu banco "novaguardian-db"
3. Aba "Connection Details"
4. Copie "Connection string"
   Deve parecer com:
   postgresql://doadmin:xxxxx@db-12345-do-user-1.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### Adicionar no GitHub
```
Field: Name
Value: DATABASE_URL

Field: Secret
Value: (Cole a connection string inteira)

Clique: Add secret
```

---

## ✅ GitHub Secrets Completo

```
✅ DIGITALOCEAN_ACCESS_TOKEN = abc123def456...
✅ DIGITALOCEAN_REGISTRY_NAME = seu-registry
✅ DATABASE_URL = postgresql://doadmin:...
```

**Resultado esperado no GitHub:**
```
[🔒] DIGITALOCEAN_ACCESS_TOKEN
[🔒] DIGITALOCEAN_REGISTRY_NAME
[🔒] DATABASE_URL
```

---

---

# 📱 PASSO 2: DIGITALOCEAN ENVIRONMENT VARIABLES (3 minutos)

### Onde?
```
https://cloud.digitalocean.com/apps
→ Clique em sua app (novaguardian-tech)
→ Settings (aba superior)
→ Environment Variables
```

### Como Abrir?
```
1. Abra: https://cloud.digitalocean.com/apps
2. Clique na sua app: "novaguardian-tech"
3. Clique na aba "Settings" (menu superior)
4. Procure "Environment Variables"
5. Clique em "Edit" ou "Add Variable"
```

---

## Variável 1️⃣: NODE_ENV

```
Key: NODE_ENV
Value: production
Scope: RUN_TIME

Clique: Save
```

---

## Variável 2️⃣: DATABASE_URL ⚠️ CRÍTICA

```
Key: DATABASE_URL
Value: (COPIE IGUAL AO GITHUB)
       postgresql://doadmin:xxxxx@db-12345-do-user-1.db.ondigitalocean.com:25060/defaultdb?sslmode=require
Scope: RUN_TIME

Clique: Save
```

---

## Variável 3️⃣: SESSION_SECRET ⚠️ CRÍTICA

### Gerar uma String Segura

**Opção A: Online (Mais fácil)**
```
1. Abra: https://www.uuidgenerator.net/
2. Gere um UUID
3. Remova hífens: "a3f7c9e2b1d4f6a8e5c3b2d1f4a7e9c2"
   Ou use 32 caracteres aleatórios
```

**Opção B: Pelo Terminal (Seu computador)**
```bash
openssl rand -hex 32
# Resultado: a3f7c9e2b1d4f6a8e5c3b2d1f4a7e9c2
```

### Adicionar no DigitalOcean
```
Key: SESSION_SECRET
Value: a3f7c9e2b1d4f6a8e5c3b2d1f4a7e9c2
       (uma string aleatória com 32 caracteres)
Scope: RUN_TIME

Clique: Save
```

---

## Variável 4️⃣: SENDGRID_API_KEY

### Se Tiver SendGrid (Email)
```
1. Abra: https://app.sendgrid.com/settings/api_keys
2. Copie a API Key (criar uma se não tiver)
3. Cole aqui:
```

```
Key: SENDGRID_API_KEY
Value: SG.xxxxx...
Scope: RUN_TIME

Clique: Save
```

### Se Não Tiver SendGrid (Pule esta!)
```
Não é obrigatória para login funcionar
Pula e continua
```

---

## ✅ DigitalOcean Environment Completo

```
✅ NODE_ENV = production
✅ DATABASE_URL = postgresql://doadmin:...
✅ SESSION_SECRET = a3f7c9e2b1d4f6a8e5c3b2d1f4a7e9c2
✅ SENDGRID_API_KEY = SG.xxxxx... (opcional)
```

---

---

# 🔄 PASSO 3: FAZER DEPLOY (1 minuto)

## Opção A: Automático (GitHub Push) ⭐ RECOMENDADO

```bash
# No seu computador:
git add .
git commit -m "Configure production environment"
git push origin main

# Aguarde:
→ GitHub Actions vai executar
→ Docker build + push
→ DigitalOcean deploy automático
→ ~5 minutos para completar

# Monitorar:
https://github.com/BuskeJR/novaguardiantechV0.1/actions
(deve aparecer um workflow em execução)
```

---

## Opção B: Manual (DigitalOcean)

```
1. Abra: https://cloud.digitalocean.com/apps
2. Clique em "novaguardian-tech"
3. Clique no botão "Deploy" (ou "Trigger Deployment")
4. Aguarde a barra de progresso terminar (~5 minutos)
5. Status deve mudar para "Active"
```

---

---

# 🧪 TESTAR APÓS DEPLOY

## Teste 1: Health Check
```
Abra no navegador:
https://seu-app.ondigitalocean.app/api/health

Deve retornar:
{
  "status": "ok",
  "timestamp": "..."
}

Status: 200 OK ✅
```

---

## Teste 2: Login
```
Abra: https://seu-app.ondigitalocean.app
Clique: "Login"
Email: seu-email@example.com
Senha: sua-senha

Deve abrir o dashboard ✅
(SEM travamento, SEM loop de loading)
```

---

## Teste 3: Usar API
```
Abra no navegador:
https://seu-app.ondigitalocean.app/api/block-check?domain=facebook.com&ip=192.168.1.1

Deve retornar JSON ✅
```

---

---

# 🔍 CHECKLIST FINAL

Antes de testar login:

## GitHub ✓
- [ ] DIGITALOCEAN_ACCESS_TOKEN adicionado
- [ ] DIGITALOCEAN_REGISTRY_NAME adicionado
- [ ] DATABASE_URL adicionado

## DigitalOcean ✓
- [ ] NODE_ENV = production
- [ ] DATABASE_URL configurada
- [ ] SESSION_SECRET configurada (32 caracteres)
- [ ] SENDGRID_API_KEY (opcional)

## Deploy ✓
- [ ] GitHub Actions executou OR Manual deploy feito
- [ ] App está em status "Active"
- [ ] Health check retorna 200 OK

## Teste ✓
- [ ] /api/health funciona
- [ ] Login não trava
- [ ] Dashboard abre
- [ ] /api/block-check retorna JSON

---

---

# 🆘 TROUBLESHOOTING

## ❌ Login ainda trava?

### Verificar Logs
```
DigitalOcean → Apps → novaguardian-tech → Logs

Procure por:
- "DATABASE_URL"
- "SESSION_SECRET"
- "error"
- "Cannot connect"

Copie a mensagem de erro e envie para ajuda
```

### Resetar Tudo
```
1. Redeploy manual
   → DigitalOcean → Apps → novaguardian-tech → Redeploy

2. Ou limpar cache
   → Ctrl+Shift+Delete no navegador
   → Apagar cookies
   → Tentar novamente
```

---

## ❌ Não conseguiu encontrar as páginas?

### GitHub Secrets
```
https://github.com/BuskeJR/novaguardiantechV0.1/settings/secrets/actions
```

### DigitalOcean Apps
```
https://cloud.digitalocean.com/apps
```

### DigitalOcean Database
```
https://cloud.digitalocean.com/databases
```

### DigitalOcean Tokens
```
https://cloud.digitalocean.com/account/api/tokens
```

---

---

# 📊 RESUMO

| Etapa | Tempo | Status |
|-------|-------|--------|
| 1. GitHub Secrets | 2 min | ☐ |
| 2. DigitalOcean Env | 3 min | ☐ |
| 3. Deploy | 5 min | ☐ |
| 4. Testar Login | 2 min | ☐ |
| **TOTAL** | **~12 min** | ☐ |

---

## 🎉 PRONTO!

Após completar, o login vai funcionar! 

Se precisar de ajuda, tirar screenshot e mandar que eu confirmo! 📸
