# 🚀 Guia de Deploy - NovaGuardianTech no DigitalOcean

## Passo 1: Preparar o Repositório GitHub

```bash
# No seu repositório local
git add .
git commit -m "Adicionar configuração para deploy DigitalOcean"
git push origin main
```

## Passo 2: Criar Conta e Configurar DigitalOcean

1. Acesse https://www.digitalocean.com
2. Crie uma conta (se não tiver)
3. Vá para **API** > **Tokens/Keys** e crie um Personal Access Token com permissões completas
4. Guarde o token para o próximo passo

## Passo 3: Criar Banco de Dados PostgreSQL

1. No Dashboard do DigitalOcean, vá para **Databases**
2. Clique em **Create Database**
3. Configure:
   - **Engine**: PostgreSQL
   - **Version**: 15+
   - **Cluster Name**: `novaguardian-db`
   - **Region**: Mesmo da sua App (recomendado: NYC3 ou SFO3)
   - **Database name**: `novaguardian`
   - **Users**: `novaguardian` (mantenha a senha segura!)
4. Anote a **Connection String** (aparecerá após criar)
5. Certifique-se de que a conexão está confiável antes de usar

## Passo 4: Preparar Secrets no GitHub

1. No seu repositório GitHub, vá para **Settings** > **Secrets and variables** > **Actions**
2. Crie os seguintes Secrets:

```
DIGITALOCEAN_ACCESS_TOKEN = [seu token do passo 2]
DIGITALOCEAN_REGISTRY_NAME = [seu username no DO]
```

## Passo 5: Criar App no DigitalOcean App Platform

### Opção A: Via Dashboard (Recomendado)

1. Vá para **Apps** > **Create App**
2. Selecione **GitHub** e conecte seu repositório `BuskeJR/Projeto_NovaTech`
3. Configure:
   - **Branch**: main
   - **Build command**: `npm run build`
   - **Run command**: `npm start`
   - **HTTP Port**: 5000

### Opção B: Via app.yaml (Automático)

Se carregar o arquivo `app.yaml` do repositório, a maioria das configurações acontecem automaticamente.

## Passo 6: Configurar Variáveis de Ambiente

No App Platform, vá para **Settings** e adicione estas variáveis:

```
NODE_ENV=production
DATABASE_URL=[connection string do banco de dados]
SESSION_SECRET=[gere uma string aleatória longa e segura]
SENDGRID_API_KEY=[sua chave SendGrid se tiver]
SENDGRID_FROM_EMAIL=noreply@[seu domínio].com
```

### Como gerar SESSION_SECRET segura:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Passo 7: Conectar Banco de Dados ao App

1. No DigitalOcean, selecione seu banco de dados
2. Vá para **Settings** > **Trust Connections**
3. Adicione seu App como conexão confiável
4. Copie a **Connection String**
5. Cole em `DATABASE_URL` no seu App Platform

## Passo 8: Fazer Deploy

### Primeira vez:
1. Clique em **Deploy** no App Platform
2. Aguarde a build e deployment (5-10 minutos)
3. Acompanhe os logs

### Próximas vezes:
Faça push no repositório:
```bash
git push origin main
```
O GitHub Actions fará deploy automático!

## Passo 9: Testar o Deploy

```bash
# Teste a saúde da app
curl https://[seu-app-url]/api/health

# Teste o Block Check API
curl "https://[seu-app-url]/api/block-check?domain=example.com&ip=1.2.3.4"
```

## 🔧 Troubleshooting

### App não inicia (Deploy falha)

Verifique:
1. **DATABASE_URL está correto**: `postgresql://user:password@host:5432/database`
2. **SESSION_SECRET existe**: Não pode estar vazio
3. **Logs da build**: Procure por erros de build nos logs do App Platform

### Conexão com banco de dados falha

```bash
# Teste a conexão (do seu computador)
psql [connection-string-do-DO]
# Deve conectar e mostrar "postgres=#"
```

### Variáveis de ambiente não carregam

1. Vá para **App Settings**
2. Remova e re-adicione as variáveis
3. Faça redeploy

## 📊 Monitoramento

1. App Platform > Logs: Ver logs em tempo real
2. Metrics: CPU, Memória, Requisições
3. Health Checks: Verifica se app está saudável

## 🔐 Segurança

- ✅ Use HTTPS (DigitalOcean fornece automaticamente)
- ✅ Mantenha SESSION_SECRET seguro (regenere regularmente)
- ✅ Não comite secrets no GitHub
- ✅ Use variáveis de ambiente para tudo sensível
- ✅ Backup de banco de dados: Configure no DigitalOcean

## 📝 Próximas Etapas

- [ ] Configurar domínio customizado (se tiver)
- [ ] Configurar backup automático de BD
- [ ] Monitorar e testar em produção
- [ ] Configurar alerta de downtime
- [ ] Documentar planos de manutenção

---

**Suporte**: Para mais info, visite https://docs.digitalocean.com/products/app-platform/
