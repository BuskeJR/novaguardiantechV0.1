# 🗄️ Guia PRÁTICO: Configurar Banco de Dados no DigitalOcean

## ✅ Você vai fazer 3 coisas:

1. **Criar o Banco** (PostgreSQL)
2. **Conectar à App**
3. **Pronto!** (migrations rodamautomaticamente)

---

# 📍 PASSO 1: Criar o Banco de Dados

### 1.1 - Acesse o DigitalOcean
- Vá para: https://cloud.digitalocean.com/
- Faça login com sua conta

### 1.2 - Abra Databases
Na barra lateral esquerda, procure por **Databases** (ou clique em Manage > Databases)

### 1.3 - Clique em "Create Database Cluster"
- Vai abrir uma tela com opções

### 1.4 - Escolha PostgreSQL
```
Engine: PostgreSQL ← CLIQUE AQUI
Version: 15 ou superior (padrão está bom)
```

### 1.5 - Configure o Cluster
Preencha assim:

```
Cluster name: novaguardian-db
├─ Database name: novaguardian
├─ Region: Escolha NYC3 ou SFO3 (mesma da app!)
├─ Cluster capacity: Padrão está bom
└─ Number of nodes: 1 node
```

### 1.6 - Clique em "Create Database Cluster"
- Aguarde 2-3 minutos enquanto cria

⏳ **Enquanto aguarda, vá para o PASSO 2**

---

# 🔑 PASSO 2: Pegar a Senha de Conexão

Quando o banco terminar de criar (você verá "Running"):

### 2.1 - Vá para a aba "Connection Details"
- Na tela do seu cluster, procure por **Connection Details** (abeta superior)

### 2.2 - Procure pela Connection String PostgreSQL
Você vai ver algo assim:

```
postgresql://username:password@host:5432/novaguardian
```

⚠️ **IMPORTANTE:** Copie TODA essa string (tem o username, password, host, etc.)

Guarde em um lugar seguro (Notepad, documento, etc.)

---

# 🔗 PASSO 3: Conectar Banco à App

Agora sua App vai saber onde está o banco!

### 3.1 - Volte para DigitalOcean App Platform
- Vá para: **Apps** (no menu lateral)
- Clique na sua app: `novaguardian-tech`

### 3.2 - Vá para a aba "Resources"
Na sua app, no topo tem várias abas:
```
Overview | Logs | Settings | Resources ← CLIQUE AQUI
```

### 3.3 - Clique em "Add Resource"
- Vai aparecer um botão verde "Add Resource" ou "+Database"

### 3.4 - Escolha seu banco
```
- Selecione a projeto onde está o banco
- Escolha: novaguardian-db (o banco que você criou)
- Clique em "Add Database"
```

✅ **Pronto!** DigitalOcean vai conectar automaticamente!

---

# 🚀 PASSO 4: Configurar Variáveis de Ambiente

Agora precisa de 2 coisas na App:

### 4.1 - Vá para Settings da App
Na sua app: **Settings** (aba no topo)

### 4.2 - Procure por "Environment Variables"
Você vai ver uma seção chamada "Environment Variables"

### 4.3 - Adicione NODE_ENV

Clique em **"Add Variable"**:

```
Scope: Runtime (deixe selecionado)
Key: NODE_ENV
Value: production
Clique em "Add Variable"
```

### 4.4 - Adicione SESSION_SECRET

Clique em **"Add Variable"** de novo:

**Primeiro, gere uma chave segura:**

Abra Terminal do seu computador e rode:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Vai aparecer algo tipo:
```
a7f3e9c2b4d1f6e8a9c2b4d1f6e8a9c2b4d1f6e8a9c2b4d1f6e8
```

Copie isso e cole na variável:

```
Scope: Runtime
Key: SESSION_SECRET
Value: <Cole o resultado do comando acima>
Clique em "Add Variable"
```

---

# 🔄 PASSO 5: Fazer Deploy

### 5.1 - Na App, clique em "Deploy"
- Lá em cima tem um botão **"Deploy"** (branco/cinza)

### 5.2 - Confirme "Deploy Changes"
- Vai aparecer um popup
- Clique em **"Deploy"**

### 5.3 - Aguarde o Deploy
- Acompanhe na aba **"Logs"**
- Você vai ver mensagens tipo:
  ```
  Building...
  Building image...
  Pushing to registry...
  Deploying...
  ✓ Deployment successful
  ```

⏳ Pode levar **5-10 minutos**

---

# ✅ PASSO 6: Testar se Funcionou

Quando terminar o deploy:

### 6.1 - Abra a URL da sua app
- Lá em cima tem a URL tipo: `https://novaguardian-xxxxx.ondigitalocean.app`
- **Clique nela** para abrir em nova aba

### 6.2 - Teste o Health Check
Cole na URL do navegador:
```
https://novaguardian-xxxxx.ondigitalocean.app/api/health
```

Deve aparecer:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T...",
  "environment": "production"
}
```

✅ Se aparecer isso, **banco está funcionando!**

### 6.3 - Teste o Login
Na URL: `https://novaguardian-xxxxx.ondigitalocean.app`
- Clique em **"Entrar"**
- Tente criar uma conta ou fazer login

Se conseguir, **está 100% funcionando!** 🎉

---

# 🚨 Se Algo Der Errado

### "Database connection failed"
1. Volte para App > Settings
2. Verifique se a variável `NODE_ENV` está como `production`
3. Clique em **"Save and Deploy"**

### "Deployment failed"
1. Clique em aba **"Logs"**
2. Procure por linhas com "error" em vermelho
3. Copie a mensagem de erro e tente entender

### "Health check falha"
1. Volte para **Resources**
2. Verifique se o banco `novaguardian-db` está conectado
3. Se não estiver, clique em **"Add Resource"** e conecte

---

# 📞 Links Úteis

- **DigitalOcean Dashboard**: https://cloud.digitalocean.com/
- **Sua App**: https://cloud.digitalocean.com/apps
- **Seus Bancos**: https://cloud.digitalocean.com/databases

---

## 🎯 Resumo do que você fez:

- ✅ Criou banco PostgreSQL no DigitalOcean
- ✅ Conectou o banco à sua app
- ✅ Configurou variáveis de ambiente
- ✅ Fez deploy com banco pronto
- ✅ Testou tudo funcionando

**Parabéns! 🚀 Sua app está em produção!**
