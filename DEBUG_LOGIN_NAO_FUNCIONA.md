# 🔧 DEBUG - LOGIN NÃO FUNCIONA

## 🎯 ENCONTRAR O PROBLEMA

### Passo 1: Abra o DigitalOcean Logs
```
https://cloud.digitalocean.com/apps
→ Clique "novaguardian-tech"
→ Aba "Logs"
→ Procure por erro
```

**Copie aqui a mensagem de erro que vê:**
```
[COLE AQUI O ERRO DO LOG]
```

---

## ❌ ERROS COMUNS E SOLUÇÕES

### ❌ Erro: "Cannot find module"
```
Mensagem: Error: Cannot find module '@shared/schema'
Solução:
  1. Remova node_modules (DigitalOcean rebuild)
  2. Limpe cache: npm cache clean --force
  3. Faça novo deploy
```

### ❌ Erro: "DATABASE_URL not defined"
```
Mensagem: Error: DATABASE_URL is not defined
Solução:
  1. Vá em: https://cloud.digitalocean.com/apps → novaguardian-tech → Settings → Environment
  2. Procure por DATABASE_URL
  3. Se não estiver lá:
     - Clique "Add Variable"
     - Key: DATABASE_URL
     - Value: postgresql://doadmin:...
  4. Clique Deploy novamente
```

### ❌ Erro: "Cannot connect to database"
```
Mensagem: Error: connect ECONNREFUSED
          or: password authentication failed
Solução:
  1. Copie CONNECTION STRING novamente de:
     https://cloud.digitalocean.com/databases
     → novaguardian-db → Connection Details
  2. Certifique-se que copiou INTEIRA com ?sslmode=require
  3. Atualize em:
     https://cloud.digitalocean.com/apps
     → novaguardian-tech → Settings → Environment
     → DATABASE_URL
  4. Redeploy
```

### ❌ Erro: "ENOENT: no such file or directory"
```
Mensagem: ENOENT: no such file or directory, open '/app/dist/public/index.html'
Solução:
  Build não completou corretamente
  1. GitHub Actions não rodou
  2. Ou app.yaml tem comando build errado
  
  Solução:
  1. Vá em: https://github.com/BuskeJR/novaguardiantechV0.1/actions
  2. Procure último workflow
  3. Se falhou: veja o erro e corrija
  4. Ou faça deploy manual no DigitalOcean
```

### ❌ Erro: "Login trava"
```
Mensagem: (nenhuma mensagem, página fica carregando)
Solução: Pode ser vários problemas. Veja próxima seção.
```

---

## 🔍 COMO DEBUGAR "LOGIN TRAVA"

### Passo 1: Abrir Developer Tools
```
No navegador (Chrome/Firefox):
1. Pressione: F12
2. Vá em: Aba "Console"
3. Procure por mensagens vermelhas de erro
4. Se tiver erro, COPIE AQUI:

[COLE AQUI]
```

### Passo 2: Verificar Network (requisições)
```
1. F12 → Aba "Network"
2. Limpe os logs (ícone de lixo)
3. Tente fazer login
4. Veja as requisições que aparecem
5. Procure por:
   - POST /api/auth/login-password
   - GET /api/auth/user
   
Qualquer uma em vermelho? CLIQUE nela.
Veja a Response (aba Response)
COPIE AQUI O ERRO:

[COLE AQUI]
```

### Passo 3: Testar Health Check
```
No navegador, abra:
https://seu-app.ondigitalocean.app/api/health

Deve retornar:
{
  "status": "ok",
  "timestamp": "2025-11-25T...",
  "environment": "production"
}

Se retornar erro, COPIE AQUI:

[COLE AQUI]
```

---

## 🛠️ SOLUÇÃO PASSO A PASSO (Se Ainda Não Funcionar)

### 1️⃣ Limpar Cache e Redeploy
```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Settings
→ Clique "Redeploy" (botão azul)

Aguarde 10 minutos para completar
```

### 2️⃣ Verificar se Banco Está Conectado
```
No DigitalOcean, vá em:
https://cloud.digitalocean.com/databases

Procure por: novaguardian-db
Deve estar em status: "Running" (verde)

Se estiver em outro status, aguarde
```

### 3️⃣ Verificar Connection String
```
Seu banco:
→ novaguardian-db
→ "Connection details"
→ Copie INTEIRA a "Connection string"

Deve parecer com:
postgresql://doadmin:xxxxxxxxxxxxx@db-xxxxx-do-user-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require
                      ^password^                                                                           ^importante^
```

### 4️⃣ Atualizar DATABASE_URL
```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Settings
→ Environment Variables
→ Clique DATABASE_URL (editar)
→ Cole o connection string INTEIRO
→ Clique Save
```

### 5️⃣ Verificar SESSION_SECRET
```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Settings
→ Environment Variables
→ SESSION_SECRET

Se não estiver lá:
→ Clique "Add Variable"
→ Key: SESSION_SECRET
→ Value: (32 caracteres aleatórios)
  Ex: a3f7c9e2b1d4f6a8e5c3b2d1f4a7e9c2
→ Click Save
```

### 6️⃣ Redeploy Final
```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Clique "Redeploy"
→ Aguarde 10 minutos
→ Status deve ser "Active"
```

---

## 📋 CHECKLIST ANTES DE TESTAR

- [ ] /api/health retorna status "ok"
- [ ] DATABASE_URL configurada e correta
- [ ] SESSION_SECRET configurada (32+ caracteres)
- [ ] NODE_ENV = production
- [ ] SENDGRID_API_KEY configurada (ou vazia, se não usar)
- [ ] App está em "Active" status
- [ ] Banco está "Running"

---

## 🧪 TESTAR DE NOVO

```
1. Limpe cache do navegador
   → Ctrl+Shift+Delete
   → Clear all
   
2. Acesse site de novo:
   https://seu-app.ondigitalocean.app

3. Tente login
   → Deve entrar SEM TRAVA

4. Se funcionar: 🎉 Pronto!
   Se não funcionar: Envie os erros do console/logs
```

---

## 📞 SE AINDA NÃO FUNCIONAR

Me envie:
1. **Screenshot dos logs DigitalOcean** (Apps → Logs)
2. **Mensagem de erro do console** (F12 → Console)
3. **Resultado do /api/health**

Com isso consigo resolver! 📸
