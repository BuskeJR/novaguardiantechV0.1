# 🚀 TESTE AGORA - ENCONTRAR O PROBLEMA

## Passo 1: Abra o Console (F12)

```
1. Vá para: https://seu-app.ondigitalocean.app
2. Pressione: F12 (ou Cmd+Option+I no Mac)
3. Clique na aba: "Console"
4. Cole isto:
```

```javascript
fetch('/api/health').then(r => r.json()).then(d => console.log('HEALTH:', d)).catch(e => console.log('ERRO HEALTH:', e))
```

**Você vai ver:**
```
HEALTH: {status: 'ok', ...}     ✅ Servidor responde
ou
ERRO HEALTH: ...                ❌ Servidor não responde
```

**Copie o que apareceu e envie** 📸

---

## Passo 2: Teste Login (veja o erro)

```
1. No Console (F12), vá na aba: "Network"
2. Clique no ícone de lixo (limpar)
3. Tente fazer login normalmente
4. Na aba Network, procure por: POST /api/auth/login-password
5. CLIQUE nela
6. Na aba "Response" (direita), veja o erro
7. COPIE e envie 📸
```

---

## Passo 3: Verifique DATABASE_URL no DigitalOcean

```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Settings
→ Environment Variables
→ DATABASE_URL

✅ Está lá?
✅ Começa com "postgresql://"?
✅ Tem "sslmode=require" no final?
```

**Se não tiver ou estiver errada:**
```
1. Vá em: https://cloud.digitalocean.com/databases
2. Clique: novaguardian-db
3. Aba: Connection details
4. COPIE a connection string (inteira com sslmode=require)
5. Volta em: https://cloud.digitalocean.com/apps
6. novaguardian-tech → Settings → Environment Variables
7. Clique em DATABASE_URL (editar)
8. Cole a connection string inteira
9. Clique Save
10. Redeploy
```

---

## Passo 4: Verifique SESSION_SECRET

```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Settings
→ Environment Variables

✅ SESSION_SECRET existe?

Se NÃO existe:
1. Clique "Add Variable"
2. Key: SESSION_SECRET
3. Value: a3f7c9e2b1d4f6a8e5c3b2d1f4a7e9c2
   (ou qualquer string de 32 caracteres)
4. Click Save
5. Redeploy
```

---

## Passo 5: Redeploy

```
https://cloud.digitalocean.com/apps
→ novaguardian-tech
→ Clique "Redeploy"
→ Aguarde 10 minutos
```

---

## 📊 Checklist

- [ ] /api/health retorna {"status":"ok",...}
- [ ] DATABASE_URL está preenchida
- [ ] DATABASE_URL começa com "postgresql://"
- [ ] DATABASE_URL tem "sslmode=require"
- [ ] SESSION_SECRET está preenchida
- [ ] Deploy foi feito
- [ ] Tentei login de novo

**Se TODOS marcados, login deve funcionar!**

---

## 🆘 SE NÃO FUNCIONAR

Me envie SCREENSHOTS de:
1. Console F12 (resultado do /api/health)
2. Network F12 (resposta do login)
3. Environment Variables (DATABASE_URL e SESSION_SECRET)

Aí consigo resolver! 📸
