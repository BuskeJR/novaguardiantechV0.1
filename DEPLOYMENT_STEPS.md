# ✅ Checklist de Deploy - NovaGuardianTech no DigitalOcean

## 🔧 Prerequisitos

- [x] Projeto no GitHub: `BuskeJR/Projeto_NovaTech`
- [x] Código está no branch `main`
- [ ] Conta DigitalOcean criada (https://www.digitalocean.com)
- [ ] Personal Access Token gerado

---

## 📋 PASSO 1: Preparar GitHub

```bash
# Clonar o repositório localmente (se não tiver)
git clone https://github.com/BuskeJR/Projeto_NovaTech.git
cd Projeto_NovaTech

# Fazer commit das mudanças de deployment
git add .
git commit -m "feat: adicionar configuração para deploy DigitalOcean"
git push origin main
```

### Arquivos adicionados:
- ✅ `app.yaml` - Configuração do App Platform
- ✅ `Dockerfile` - Para build em container
- ✅ `.github/workflows/deploy.yml` - CI/CD automático
- ✅ `DEPLOY_GUIDE.md` - Este guia detalhado
- ✅ `.env.production.example` - Template de variáveis
- ✅ Rota `/api/health` - Health check para DigitalOcean

---

## 🔑 PASSO 2: Gerar Tokens no DigitalOcean

### 2.1 - Personal Access Token

1. Login em https://cloud.digitalocean.com/
2. Vá para **API** (no menu lateral)
3. Clique em **Tokens/Keys**
4. Clique em **Generate New Token**
5. Configure:
   - **Token name**: `GitHub Actions`
   - **Scopes**: Marque **Full access**
   - **Expiration**: Nunca (ou 1 ano)
6. **Copie o token** (aparece uma única vez!)
7. Guarde em local seguro

### 2.2 - Registry Name (Docker Registry)

1. No DigitalOcean, vá para **Container Registry**
2. Clique em **Create Registry**
3. Escolha um **Name** (ex: `novaguardian`)
4. Copie o nome (será usado como `DIGITALOCEAN_REGISTRY_NAME`)

---

## 🔐 PASSO 3: Configurar GitHub Secrets

1. Acesse seu repositório: https://github.com/BuskeJR/Projeto_NovaTech
2. Vá para **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret** para cada um:

| Secret Name | Valor | Onde buscar |
|---|---|---|
| `DIGITALOCEAN_ACCESS_TOKEN` | Cole o token do passo 2.1 | DigitalOcean API |
| `DIGITALOCEAN_REGISTRY_NAME` | Nome do registry (ex: `novaguardian`) | DigitalOcean Container Registry |

---

## 💾 PASSO 4: Criar Banco de Dados

1. No DigitalOcean, vá para **Databases**
2. Clique em **Create Database Cluster**
3. Configure:
   - **Engine**: PostgreSQL
   - **Version**: 15 ou superior
   - **Cluster name**: `novaguardian-db`
   - **Region**: Escolha a mesma da app (NYC3 ou SFO3 recomendado)
   - **Database engine version**: Padrão (15+)
4. Clique em **Create Database Cluster**
5. **Aguarde a criação** (2-3 minutos)

### Após criar:
1. Vá para **Databases** > seu cluster `novaguardian-db`
2. Clique em **Connection details** ou **Connection String**
3. **Copie a Connection String** no formato:
   ```
   postgresql://username:password@host:5432/novaguardian
   ```
4. Guarde para o próximo passo

---

## 🚀 PASSO 5: Criar App no DigitalOcean App Platform

### Opção A: Criar manualmente via Dashboard

1. Vá para **Apps** (App Platform) no DigitalOcean
2. Clique em **Create App**
3. Selecione **GitHub** e conecte sua conta
4. Escolha o repositório: `BuskeJR/Projeto_NovaTech`
5. Configure:
   - **Branch**: `main`
   - **Source type**: `Dockerfile`
   - **Auto deploy**: Marque ✅ para deploy automático em cada push
6. Clique em **Next**

### Opção B: Usar `app.yaml` (mais rápido)

1. Na mesma tela acima, clique em **Advanced**
2. Cole o conteúdo do arquivo `app.yaml` do repositório
3. Clique em **Create App**

---

## 🔗 PASSO 6: Conectar Banco de Dados à App

1. Na App Platform, vá para sua app: **novaguardian-tech**
2. Clique em **Resources** (ou **Settings**)
3. Clique em **Add Database**
4. Escolha o banco que criou: `novaguardian-db`
5. Clique em **Add**

DigitalOcean vai **injetar automaticamente** a `DATABASE_URL` na sua app!

---

## ⚙️ PASSO 7: Configurar Variáveis de Ambiente

Na App Platform, vá para **Settings** > **Environment Variables**

Adicione estas variáveis:

### Variável 1: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Scope**: Run time

### Variável 2: SESSION_SECRET (IMPORTANTE!)
Gere uma chave segura:

**No seu computador, execute:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e adicione como variável:
- **Key**: `SESSION_SECRET`
- **Value**: `<resultado do comando acima>`
- **Scope**: Run time

### Variável 3: SENDGRID_API_KEY (opcional, agora)
Se tiver SendGrid configurado:
- **Key**: `SENDGRID_API_KEY`
- **Value**: `SG.seu_api_key_aqui`
- **Scope**: Run time

### Variável 4: SENDGRID_FROM_EMAIL (opcional)
- **Key**: `SENDGRID_FROM_EMAIL`
- **Value**: `noreply@seu-dominio.com`
- **Scope**: Run time

---

## ✅ PASSO 8: Fazer o Deploy

### Primeira vez:

1. Na App Platform, clique em **Deploy**
2. **Aguarde** a build e deployment (5-10 minutos):
   - Build imagem Docker
   - Push para Container Registry
   - Deploy na app
3. Acompanhe nos **Logs** (aba Logs)

### Próximas vezes (automático):

Apenas faça push no repositório:
```bash
git add .
git commit -m "sua mudança aqui"
git push origin main
```

GitHub Actions vai fazer tudo automaticamente! (veja em Actions > Workflows)

---

## 🧪 PASSO 9: Testar o Deploy

Quando o deploy terminar, teste:

```bash
# 1. Health check (deve retornar status ok)
curl https://your-app-url.ondigitalocean.app/api/health

# Resposta esperada:
# {
#   "status": "ok",
#   "timestamp": "2025-11-24T...",
#   "environment": "production"
# }

# 2. Block Check API
curl "https://your-app-url.ondigitalocean.app/api/block-check?domain=example.com&ip=203.0.113.1"

# Resposta esperada:
# {
#   "success": true,
#   "domain": "example.com",
#   "ip": "203.0.113.1",
#   "blocked": false/true,
#   "message": "..."
# }
```

Se ambos funcionarem, **está tudo ok!** 🎉

---

## 🔧 Se Algo Der Errado

### App não inicia / Deploy falha

1. **Verifique os logs:**
   - Na App Platform, aba **Logs**
   - Procure por `error` ou `failed`

2. **Problemas comuns:**

   **Erro: "DATABASE_URL not found"**
   - Verifique se o banco está conectado (passo 6)
   - Verifique o ambiente (deve estar em produção)

   **Erro: "SESSION_SECRET must be set"**
   - Adicione a variável SESSION_SECRET (passo 7)
   - Redeploy

   **Erro: "Cannot connect to database"**
   - Teste a conexão localmente com a string
   - Verifique IP whitelist no banco (DigitalOcean)

### Como fazer redeploy após corrigir

```bash
# Se alterou variáveis:
# Apenas vá para App Platform > Settings > Save & Redeploy

# Se alterou código:
git push origin main  # GitHub Actions faz automaticamente
```

---

## 📊 Monitoramento em Produção

1. **Logs em tempo real:**
   - App Platform > **Logs** tab
   - Procure por erros com frequência

2. **Métricas:**
   - App Platform > **Metrics** tab
   - CPU, Memória, Requisições

3. **Health checks:**
   - DigitalOcean monitora automaticamente
   - Desativa a app se `/api/health` falhar 3x seguidas

4. **Alertas:**
   - Vá para **Alerts** para configurar notificações

---

## 🔒 Segurança Importante

✅ **Fazer:**
- Manter `SESSION_SECRET` seguro (nunca commitar)
- Regenerar `SESSION_SECRET` regularmente (anualmente)
- Usar HTTPS (DigitalOcean fornece automaticamente)
- Fazer backup do banco (configure em Database > Backups)
- Usar secrets do GitHub para API keys (não no código!)

❌ **Não fazer:**
- Colocar secrets no `.env` commitado
- Reutilizar mesmas senhas
- Compartilhar Personal Access Token
- Deixar app em porta padrão em produção

---

## 🎯 Checklist Final

- [ ] GitHub secrets configurados (passo 3)
- [ ] Banco de dados PostgreSQL criado (passo 4)
- [ ] App conectada ao banco (passo 6)
- [ ] Variáveis de ambiente adicionadas (passo 7)
- [ ] Deploy realizado com sucesso (passo 8)
- [ ] Health check retorna "ok" (passo 9)
- [ ] Block Check API funciona (passo 9)

Se tudo estiver com ✅, **você está pronto para produção!**

---

## 📞 Suporte

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **GitHub Actions Docs**: https://docs.github.com/actions
- **PostgreSQL Connection**: https://docs.digitalocean.com/products/databases/postgresql/

**Boa sorte! 🚀**
