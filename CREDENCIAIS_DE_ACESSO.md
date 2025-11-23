# 🔐 Credenciais de Acesso - NovaGuardian

## ⚠️ IMPORTANTE - INFORMAÇÕES CONFIDENCIAIS

Estas credenciais são **APENAS PARA DESENVOLVIMENTO**. Nunca compartilhe com usuários finais.

---

## 👨‍💼 ADMINISTRADOR

**ID do Usuário (Username):**
```
admin-user-123
```

**Email:**
```
admin@novaguardian.com
```

**Acesso:** `http://localhost:5000/login`

**Permissões:**
- ✅ Acesso a todas as páginas
- ✅ Painel administrativo completo
- ✅ Gerenciar todos os clientes
- ✅ Ver logs de auditoria

---

## 🧪 COMO CRIAR USUÁRIOS DE TESTE

Você pode criar quantos usuários de teste precisar usando **uma das 2 formas**:

### **Opção 1: Pelo Sistema (Recomendado)**

1. Acesse `http://localhost:5000/signup`
2. Preencha o formulário de cadastro
3. Nova conta criada automaticamente com plano gratuito

### **Opção 2: Diretamente no Banco de Dados**

```bash
psql $DATABASE_URL -c "
INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
VALUES 
  ('user-teste-1', 'teste1@suaempresa.com', 'Teste', 'Um', 'user', NOW(), NOW()),
  ('user-teste-2', 'teste2@suaempresa.com', 'Teste', 'Dois', 'user', NOW(), NOW());
"
```

---

## 🔑 Como Fazer Login

1. Acesse `http://localhost:5000/login`
2. Insira o **ID do Usuário**
3. Clique em **Entrar**

**Exemplo:**
- **ID do Usuário:** `admin-user-123`
- Clique em "Entrar"
- ✅ Você está dentro!

---

## 📋 Usuários Atuais no Sistema

| ID | Email | Tipo | Status |
|---|---|---|---|
| `admin-user-123` | admin@novaguardian.com | **ADMIN** | ✅ Ativo |
| (Vazio) | (Crie novos conforme necessário) | User | - |

---

## 🎯 Para Clientes que Vão Comprar

❌ **NÃO MOSTRAR ESSAS CREDENCIAIS**

A página de login foi simplificada para clientes:
- Sem opções pré-configuradas
- Apenas campo de entrada limpo
- Link para criar conta gratuita

---

## 💡 Exemplo de Fluxo de Cliente Novo

```
1. Cliente acessa http://localhost:5000
2. Clica em "Criar Conta"
3. Se cadastra com seus dados
4. Recebe plano gratuito automaticamente
5. Pode começar a usar o sistema
```

---

## 🔒 Segurança

- Sistema em **modo desenvolvimento**
- Sem validação de senha (login por ID)
- **NUNCA use em produção assim**
- Em produção: implementar autenticação OAuth2/OpenID

---

**Data:** 22 de Novembro de 2025  
**Versão:** 1.0
