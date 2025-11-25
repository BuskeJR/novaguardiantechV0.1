# 🌱 Guia: Popular Banco de Dados com Dados Iniciais

## ✅ O que vai ser adicionado:

```
📊 Dados Iniciais:
├─ 1 Admin User (admin@novaguardian.com)
├─ 1 Regular User (user@example.com)
├─ 1 Tenant (Demo Company)
├─ 3 Domínios Bloqueados
│  ├─ facebook.com
│  ├─ instagram.com
│  └─ *.gambling.* (regex)
├─ 2 IPs Whitelist
│  ├─ 192.168.1.1 (Office Router)
│  └─ 10.0.0.1 (VPN Gateway)
└─ 1 Log de Auditoria (seed completo)
```

---

# 🚀 FORMA 1: Rodar Seed via Endpoint (MAIS FÁCIL)

## Passo 1: Certifique-se que app está rodando
- Vá para seu dashboard do DigitalOcean
- Sua app `novaguardian-tech` deve estar **Running** (verde)

## Passo 2: Copie a URL da sua app
Exemplo:
```
https://novaguardian-xxxxx.ondigitalocean.app
```

## Passo 3: Chamar o endpoint de seed
Abra seu navegador e vá para:
```
https://novaguardian-xxxxx.ondigitalocean.app/api/admin/seed
```

## Passo 4: Você vai ver:
```json
{
  "message": "Database seeded successfully!",
  "timestamp": "2025-11-24T...",
  "data": {
    "admin": "admin@novaguardian.com",
    "user": "user@example.com",
    "tenant": "Demo Company",
    "domains": 3,
    "ips": 2
  }
}
```

✅ **Pronto!** Dados adicionados!

---

# 🔐 Verificar o que foi adicionado

Agora você pode testar:

## 1. Tentar fazer login com usuário de teste:
```
Email: user@example.com
Senha: (use Replit Auth - não tem senha normal)
```

Ou com admin:
```
Email: admin@novaguardian.com
```

## 2. Testar Block Check API
```
https://novaguardian-xxxxx.ondigitalocean.app/api/block-check?domain=facebook.com&ip=192.168.1.1
```

Resposta esperada:
```json
{
  "success": true,
  "domain": "facebook.com",
  "ip": "192.168.1.1",
  "blocked": true,
  "message": "Domínio facebook.com está bloqueado para este IP"
}
```

---

# 🚀 FORMA 2: Rodar Seed Localmente (para DEVs)

Se quiser testar localmente antes:

## Passo 1: Clonar repo
```bash
git clone https://github.com/BuskeJR/Projeto_NovaTech.git
cd Projeto_NovaTech
```

## Passo 2: Instalar dependências
```bash
npm install
```

## Passo 3: Puxar DATABASE_URL de produção
Vá em DigitalOcean > Seu Banco > Connection Details
Copie a Connection String

## Passo 4: Criar arquivo `.env.local`
```bash
DATABASE_URL="postgresql://username:password@host:5432/novaguardian"
```

⚠️ **NUNCA commit esse arquivo!**

## Passo 5: Rodar seed
```bash
npm run db:seed
```

Você vai ver:
```
🌱 Seeding database...
✅ Admin user created: admin@novaguardian.com
✅ Regular user created: user@example.com
✅ Tenant created: Demo Company
✅ Sample domains added
✅ Sample IP whitelist added
✅ Audit log created
```

---

# 📊 Dados que vão ser criados

## Usuários
| Email | Senha | Tipo |
|-------|-------|------|
| admin@novaguardian.com | Via Replit Auth | Admin |
| user@example.com | Via Replit Auth | User |

## Tenant
| Campo | Valor |
|-------|-------|
| Nome | Demo Company |
| Slug | demo-company |
| IP Público | 203.0.113.10 |
| Status | Active |
| Plano | trial |

## Domínios Bloqueados
| Domínio | Tipo | Motivo |
|---------|------|--------|
| facebook.com | Exact | Social media blocking policy |
| instagram.com | Exact | Social media blocking policy |
| .*\.gambling\..* | Regex | Block all gambling sites |

## IPs Whitelist
| IP | Label |
|----|-------|
| 192.168.1.1 | Office Router |
| 10.0.0.1 | VPN Gateway |

---

# ❌ Se algo der errado

### Erro: "404 Not Found" ao chamar endpoint
- Espere 1-2 min pois o deploy pode estar em andamento
- Verifique se a app está "Running" (verde)
- Tente recarregar a página

### Erro: "Seed já foi executado"
- Seed é idempotente (seguro rodar múltiplas vezes)
- Se não funcionar, contate admin

### Erro: "DATABASE_URL not found"
- Volte a App > Resources
- Verifique se banco está conectado
- Clique em "Save and Deploy"

---

# 🧪 Teste Rápido Completo

1. ✅ Acesse: `https://seu-app.ondigitalocean.app/api/admin/seed`
2. ✅ Vá para: `https://seu-app.ondigitalocean.app`
3. ✅ Tente fazer login com `user@example.com`
4. ✅ Teste: `/api/health`
5. ✅ Teste: `/api/block-check?domain=facebook.com&ip=192.168.1.1`

Se tudo funcionar, **banco está 100% pronto!** 🎉

---

# 📝 Para Adicionar Mais Dados Depois

Você pode:
1. **Via UI**: Fazer login e adicionar manualmente
2. **Via API**: POST requests para endpoints
3. **Criar novo seed**: Editar `server/seed.ts` e executar novamente

Se quiser adicionar mais dados depois, me avise e criarei um seed mais completo!
