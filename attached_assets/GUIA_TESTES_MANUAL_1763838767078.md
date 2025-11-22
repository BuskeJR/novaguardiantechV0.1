# 📋 GUIA COMPLETO DE TESTES MANUAIS - NovaGuardianTech

## 🎯 Objetivo

Este guia te ajudará a testar **todas as funcionalidades** do painel administrativo NovaGuardianTech, página por página, com instruções detalhadas para desenvolvedores júniors.

---

## ✅ PRÉ-REQUISITOS

Antes de começar, certifique-se de que:

1. **✅ Workflows rodando**: Frontend (porta 5000) e API devem estar com status `RUNNING`
2. **✅ Banco de dados**: PostgreSQL conectado e com tabelas criadas
3. **✅ Usuário admin existe**: Já existe um admin no sistema

### 🔐 Credenciais de Acesso

**Email**: `admin@novaguardian.com`  
**Senha**: `admin123`  
**Role**: `ADMIN` (acesso total)

---

## 📖 ROTEIRO DE TESTES

### PASSO 1: Acessar o Frontend

1. Abra o webview do Replit (deve estar mostrando a porta 5000)
2. Você deve ver a **tela de login**
3. Se estiver em outra página, clique em "Logout" no menu lateral

**Resultado esperado**: Tela de login com campos Email e Password

---

### PASSO 2: Fazer Login 🔑

1. Digite no campo **Email**: `admin@novaguardian.com`
2. Digite no campo **Password**: `admin123`
3. Clique no botão **"Entrar"** ou aperte Enter

**Resultado esperado**:
- ✅ Redirecionamento para `/dashboard`
- ✅ Menu lateral visível com 8 opções (Dashboard, Clients, Domains, Whitelist, Pi-hole Instances, Users, Audit Logs, Settings)
- ✅ Nome do usuário "Administrador" no topo do menu
- ✅ Badge "ADMIN" visível

**Se der erro**:
- Verifique no console do navegador (F12) se há erros 401 ou 403
- Verifique se a API está rodando nos logs do workflow "api"

---

### PASSO 3: Testar Dashboard 📊

**O que faz**: Exibe estatísticas em tempo real do sistema

**Como testar**:

1. Você já deve estar no Dashboard (`/dashboard`)
2. Observe 4 cards de estatísticas:
   - 📂 Total de Clientes
   - 🚫 Total de Domínios Bloqueados
   - ✅ Total de IPs Whitelistados
   - 🐳 Total de Instâncias Pi-hole

**Resultado esperado**:
- ✅ Os números aparecem (podem ser todos 0 se o banco está vazio)
- ✅ Após 30 segundos, os números atualizam automaticamente (auto-refresh)

**Teste de auto-refresh**:
1. Anote os números atuais
2. Aguarde 30 segundos
3. Os números devem recarregar (você verá um breve loading)

**Se der erro**:
- Erro 404 em `/stats`: O endpoint não existe (verifique se adicionei corretamente)
- Números não aparecem: Abra DevTools e veja se há erro na chamada `/api/stats`

---

### PASSO 4: Testar Gerenciamento de Clientes 🏢

**O que faz**: CRUD completo de clientes (empresas que usarão o sistema)

#### 4.1 Listar Clientes

1. Clique em **"Clients"** no menu lateral
2. Você verá uma tabela (pode estar vazia inicialmente)

**Resultado esperado**:
- ✅ Tabela com colunas: Nome, Slug, Status, Data de Criação, Ações
- ✅ Botão "Novo Cliente" no topo

#### 4.2 Criar Novo Cliente

1. Clique no botão **"Novo Cliente"**
2. Um modal (janela pop-up) deve abrir
3. Preencha os campos:
   - **Nome**: `ACME Corporation`
   - **Slug**: `acme-corp` (identificador único, será convertido para minúsculas)
   - **Ativo**: ✅ (checkbox marcado)
4. Clique em **"Salvar"**

**Resultado esperado**:
- ✅ Modal fecha
- ✅ Cliente aparece na tabela
- ✅ Mensagem de sucesso no topo (se tiver implementada)
- ✅ Dashboard agora mostra "1" em Total de Clientes

**Teste de validação**:
1. Tente criar outro cliente com o mesmo slug `acme-corp`
2. Deve dar **erro 409** dizendo que já existe

#### 4.3 Editar Cliente

1. Na linha do cliente "ACME Corporation", clique no ícone **✏️ Editar**
2. Modal abre com dados preenchidos
3. Altere o nome para: `ACME Corporation - Atualizado`
4. Clique em **"Salvar"**

**Resultado esperado**:
- ✅ Modal fecha
- ✅ Nome atualizado na tabela

#### 4.4 Criar Segundo Cliente (para testes multi-tenant)

1. Crie mais um cliente:
   - **Nome**: `TechStart LTDA`
   - **Slug**: `techstart`
   - **Ativo**: ✅
2. Salve

**Resultado esperado**:
- ✅ Agora você tem 2 clientes na tabela
- ✅ Dashboard mostra "2" em Total de Clientes

#### 4.5 Tentar Deletar Cliente (deve falhar se tiver dependências)

1. Clique no ícone **🗑️ Excluir** do cliente "TechStart LTDA"
2. Confirme a exclusão

**Resultado esperado**:
- ✅ Cliente é removido (se não tiver usuários, domínios, whitelist associados)
- ❌ Se tiver dependências, mostra erro 409 com mensagem clara

**Não delete o cliente ACME ainda** - vamos usá-lo nos próximos testes!

---

### PASSO 5: Testar Gerenciamento de Domínios Bloqueados 🚫

**O que faz**: Permite adicionar domínios para bloqueio (ex: ads.example.com)

#### 5.1 Acessar Página de Domínios

1. Clique em **"Domains"** no menu lateral
2. Você verá um **dropdown** para selecionar cliente

**Resultado esperado**:
- ✅ Dropdown com os clientes criados (ACME Corporation, TechStart)
- ✅ Mensagem "Selecione um cliente para gerenciar domínios"

#### 5.2 Selecionar Cliente

1. No dropdown, selecione **"ACME Corporation"**
2. Aguarde carregar

**Resultado esperado**:
- ✅ Tabela de domínios aparece (vazia inicialmente)
- ✅ Botão "Adicionar Domínio" habilitado

#### 5.3 Adicionar Domínio

1. Clique em **"Adicionar Domínio"**
2. Modal abre
3. Preencha:
   - **Domínio**: `ads.doubleclick.net`
   - **Tipo**: `EXACT` (bloqueio exato)
   - **Motivo**: `Rastreamento de anúncios` (opcional)
4. Clique em **"Salvar"**

**Resultado esperado**:
- ✅ Domínio aparece na tabela
- ✅ Dashboard agora mostra "1" em Total de Domínios Bloqueados

#### 5.4 Adicionar Domínio com REGEX

1. Adicione outro domínio:
   - **Domínio**: `^ad[sz]?\\..*` (regex para bloquear ad.*, ads.*, adz.*)
   - **Tipo**: `REGEX`
   - **Motivo**: `Bloqueio de ads via regex`
2. Salve

**Resultado esperado**:
- ✅ 2 domínios na tabela
- ✅ Badge "REGEX" visível no segundo domínio

#### 5.5 Sincronizar com Pi-hole

1. Clique no botão **"Sincronizar com Pi-hole"**
2. Aguarde

**Resultado esperado**:
- ⚠️ **Pode dar erro 404** se não houver instância Pi-hole provisionada para este cliente
- ✅ Se houver instância, mostra "X domínios sincronizados"

#### 5.6 Testar Multi-Tenant

1. No dropdown, troque para **"TechStart LTDA"**
2. A tabela deve **ficar vazia** (cada cliente tem seus próprios domínios)
3. Adicione um domínio diferente para TechStart:
   - **Domínio**: `tracker.example.com`
   - **Tipo**: `EXACT`
4. Volte para **"ACME Corporation"** no dropdown
5. Deve mostrar apenas os 2 domínios do ACME (não o do TechStart)

**Resultado esperado**:
- ✅ **Isolamento perfeito** entre clientes
- ✅ Cache invalidation funcionando

#### 5.7 Deletar Domínio

1. Com ACME selecionado, delete o domínio `ads.doubleclick.net`
2. Confirme

**Resultado esperado**:
- ✅ Domínio removido da tabela
- ✅ Total de Domínios no Dashboard diminui

---

### PASSO 6: Testar Gerenciamento de Whitelist 📋

**O que faz**: Permite adicionar IPs que NÃO serão bloqueados

#### 6.1 Acessar Whitelist

1. Clique em **"Whitelist"** no menu lateral
2. Dropdown para selecionar cliente

#### 6.2 Adicionar IP Whitelistado

1. Selecione **"ACME Corporation"**
2. Clique em **"Adicionar IP"**
3. Preencha:
   - **Endereço IP**: `192.168.1.100`
   - **Label**: `Servidor de Produção`
4. Salve

**Resultado esperado**:
- ✅ IP aparece na tabela
- ✅ Dashboard mostra "1" em Total de IPs Whitelistados

#### 6.3 Teste de Validação de IP

1. Tente adicionar um IP inválido: `999.999.999.999`
2. Deve dar erro de validação

#### 6.4 Testar Multi-Tenant

1. Troque para **"TechStart"**
2. Tabela fica vazia (isolamento por cliente)
3. Adicione um IP para TechStart: `10.0.0.50`
4. Volte para ACME - deve ver apenas o IP do ACME

#### 6.5 Deletar IP

1. Delete o IP `192.168.1.100` do ACME
2. Dashboard atualiza o contador

---

### PASSO 7: Testar Gerenciamento de Instâncias Pi-hole 🐳

**O que faz**: Provisiona, remove e gerencia containers Docker do Pi-hole

⚠️ **ATENÇÃO**: Esta funcionalidade requer **Docker** rodando. No Replit, pode não funcionar completamente.

#### 7.1 Acessar Pi-hole Instances

1. Clique em **"Pi-hole Instances"** no menu lateral
2. Tabela com instâncias (vazia inicialmente)

#### 7.2 Provisionar Nova Instância

1. Clique em **"Provisionar Nova Instância"**
2. Modal abre
3. Selecione cliente: **"ACME Corporation"**
4. Clique em **"Provisionar"**

**Resultado esperado**:
- ✅ Se Docker estiver disponível: Instância criada, status "running"
- ❌ Se Docker não estiver disponível: Erro claro

#### 7.3 Listar Instâncias

**Resultado esperado**:
- ✅ Tabela mostra: Container Name, Client, Status, IP, Port

#### 7.4 Restart de Instância

1. Clique em **"Restart"** na linha da instância
2. Aguarde

**Resultado esperado**:
- ✅ Container reinicia (se Docker funcionar)

#### 7.5 Atualizar Configuração dnsdist

1. Clique em **"Atualizar dnsdist Config"**
2. Aguarde

**Resultado esperado**:
- ✅ Configuração Lua regenerada e aplicada

#### 7.6 Deprovision (Remover Instância)

1. Clique em **"Deprovision"** na instância
2. Confirme

**Resultado esperado**:
- ✅ Container Docker removido
- ✅ Instância some da tabela

---

### PASSO 8: Testar Gerenciamento de Usuários 👥

**O que faz**: CRUD de usuários do sistema (ADMIN ou USER)

⚠️ **Esta página só aparece para usuários ADMIN**

#### 8.1 Acessar Users

1. Clique em **"Users"** no menu lateral
2. Tabela com usuários

**Resultado esperado**:
- ✅ Pelo menos 1 usuário (Administrador)
- ✅ Colunas: Nome, Email, Role, Cliente Associado, Ações

#### 8.2 Criar Novo Usuário

1. Clique em **"Novo Usuário"**
2. Preencha:
   - **Nome**: `João Silva`
   - **Email**: `joao@acme.com`
   - **Password**: `senha123`
   - **Role**: `USER` (não admin)
   - **Cliente**: `ACME Corporation` (opcional)
3. Salve

**Resultado esperado**:
- ✅ Usuário aparece na tabela
- ✅ Badge "USER" visível

#### 8.3 Criar Usuário ADMIN

1. Crie outro usuário:
   - **Nome**: `Maria Admin`
   - **Email**: `maria@novaguardian.com`
   - **Password**: `admin456`
   - **Role**: `ADMIN`
   - **Cliente**: (deixe vazio)
2. Salve

**Resultado esperado**:
- ✅ Badge "ADMIN" visível

#### 8.4 Editar Usuário

1. Edite o usuário João Silva
2. Altere o nome para: `João Silva - Gerente`
3. Salve

**Resultado esperado**:
- ✅ Nome atualizado

#### 8.5 Testar Proteção de Auto-Delete

1. Tente deletar o usuário **Administrador** (você mesmo, logado)
2. Clique em excluir

**Resultado esperado**:
- ❌ **Deve dar erro 400** dizendo "Você não pode deletar sua própria conta"

#### 8.6 Deletar Outro Usuário

1. Delete o usuário João Silva
2. Confirme

**Resultado esperado**:
- ✅ Usuário removido da tabela

---

### PASSO 9: Testar Logs de Auditoria 📜

**O que faz**: Mostra todas as ações realizadas no sistema (quem fez o quê e quando)

#### 9.1 Acessar Audit Logs

1. Clique em **"Audit Logs"** no menu lateral
2. Tabela com logs

**Resultado esperado**:
- ✅ Todos os logs das ações que você fez aparecem
- ✅ Colunas: ID, Usuário (nome), Ação, Detalhes, Data/Hora

#### 9.2 Verificar Nome do Ator

**Muito importante!** Cada log deve mostrar o **nome do usuário** que executou a ação (ex: "Administrador"), **não** apenas o user_id.

**Resultado esperado**:
- ✅ Coluna "Usuário" mostra: "Administrador"
- ❌ Se mostrar "Sistema" ou "ID:1", há um erro no relacionamento SQL

#### 9.3 Filtrar por Ação

1. No campo de busca/filtro de Ação, digite: `CREATE`
2. Aperte Enter ou clique em Filtrar

**Resultado esperado**:
- ✅ Mostra apenas logs de criação (CREATE_CLIENT, CREATE_USER, etc.)

#### 9.4 Paginação

Se houver mais de 50 logs:
1. Navegue para a próxima página
2. Volte para a primeira

**Resultado esperado**:
- ✅ Paginação funcionando

---

### PASSO 10: Testar Configurações ⚙️

**O que faz**: Página placeholder para configurações futuras

#### 10.1 Acessar Settings

1. Clique em **"Settings"** no menu lateral

**Resultado esperado**:
- ✅ Página de configurações aparece
- ✅ Pode ser apenas um placeholder dizendo "Em construção"

---

## 🎯 CHECKLIST FINAL DE VALIDAÇÃO

Marque cada item após testar:

### Dashboard
- [ ] Estatísticas carregam corretamente
- [ ] Auto-refresh funciona (30s)
- [ ] Números aumentam/diminuem conforme ações

### Clients
- [ ] Criar cliente funciona
- [ ] Editar cliente funciona
- [ ] Deletar cliente (sem dependências) funciona
- [ ] Deletar cliente (com dependências) bloqueia com erro 409
- [ ] Slug duplicado dá erro 409

### Domains
- [ ] Selecionar cliente funciona
- [ ] Adicionar domínio EXACT funciona
- [ ] Adicionar domínio REGEX funciona
- [ ] Deletar domínio funciona
- [ ] Multi-tenant (isolamento por cliente) funciona
- [ ] Sincronizar com Pi-hole (se Docker disponível)

### Whitelist
- [ ] Adicionar IP funciona
- [ ] Validação de IP inválido funciona
- [ ] Deletar IP funciona
- [ ] Multi-tenant funciona

### Pi-hole Instances
- [ ] Provisionar instância funciona (se Docker disponível)
- [ ] Listar instâncias funciona
- [ ] Restart instância funciona
- [ ] Deprovision funciona
- [ ] Atualizar dnsdist config funciona

### Users
- [ ] Listar usuários funciona
- [ ] Criar usuário USER funciona
- [ ] Criar usuário ADMIN funciona
- [ ] Editar usuário funciona
- [ ] Deletar outro usuário funciona
- [ ] Proteção de auto-delete funciona (erro ao tentar deletar a si mesmo)

### Audit Logs
- [ ] Listar logs funciona
- [ ] Nomes dos atores aparecem (não apenas IDs)
- [ ] Filtrar por ação funciona
- [ ] Paginação funciona (se > 50 logs)

### Autenticação
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Menu adapta-se ao role (ADMIN vê Users, USER não)
- [ ] Redirecionamento para /login se não autenticado

---

## 🐛 ERROS COMUNS E SOLUÇÕES

### "404 Not Found" em `/admin/clients`
**Solução**: Verifique se o endpoint existe em `apps/api/routers/admin.py`

### "403 Forbidden" em `/admin/audit`
**Solução**: Usuário logado não tem role ADMIN. Faça logout e login com `admin@novaguardian.com`

### "Audit Logs mostra 'Sistema' em vez do nome"
**Solução**: Relacionamento SQL faltando. Verifique `AuditLog.user = relationship("User")`

### "Dashboard não atualiza automaticamente"
**Solução**: TanStack Query não configurado para refetch. Verifique `refetchInterval: 30000`

### "Multi-tenant não funciona (domínios de todos os clientes aparecem)"
**Solução**: Query keys do TanStack Query não parametrizadas. Verifique `queryKey: ['domains', clientId]`

### "CORS error" no console
**Solução**: Vite proxy não configurado. Verifique `vite.config.js` tem `/api` proxy

---

## ✅ RESULTADO ESPERADO FINAL

Após completar todos os testes:

1. ✅ **Dashboard**: Mostra estatísticas reais e atualiza a cada 30s
2. ✅ **7 páginas funcionais**: Clients, Domains, Whitelist, Pi-hole, Users, Audit Logs, Settings
3. ✅ **CRUD completo**: Criar, ler, atualizar, deletar em todas as entidades
4. ✅ **Multi-tenant**: Isolamento perfeito entre clientes
5. ✅ **RBAC**: Admin vê tudo, User vê apenas sua área
6. ✅ **Validações**: Erros claros e informativos
7. ✅ **Performance**: Loading states, cache invalidation automática
8. ✅ **Audit trail**: Todos os logs com nomes de usuários

---

## 📝 PRÓXIMOS PASSOS

Após validar tudo:

1. **Documentar bugs encontrados**: Liste qualquer erro que encontrou
2. **Deploy**: Use o botão "Deploy" do Replit para publicar
3. **Testes E2E automatizados**: Considere criar testes com Playwright/Cypress
4. **Monitoramento**: Adicione Sentry ou similar para rastrear erros em produção

---

**Boa sorte com os testes! 🚀**

Se encontrar qualquer problema, me avise que eu corrijo imediatamente.
