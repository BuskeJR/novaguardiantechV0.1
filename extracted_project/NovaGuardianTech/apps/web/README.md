# NovaGuardianTech - Frontend

Frontend React do sistema NovaGuardianTech - SaaS de bloqueio DNS multi-cliente.

## Tecnologias

- **React 18** - Biblioteca UI
- **Vite 5** - Build tool e dev server
- **TanStack Query v5** - State management e cache
- **React Router DOM v6** - Roteamento
- **Tailwind CSS 3** - Estilização
- **Axios** - HTTP client
- **Lucide React** - Ícones

## Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_API_URL=http://localhost:8080
VITE_USE_MOCK=false
VITE_BRAND_NAME=NovaGuardianTech
```

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5000`

## Build para Produção

```bash
# Gerar build otimizado
npm run build

# Preview do build
npm run preview
```

## Estrutura de Pastas

```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes de UI base
│   └── Layout.jsx   # Layout principal
├── pages/           # Páginas da aplicação
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Domains.jsx
│   ├── Whitelist.jsx
│   └── Settings.jsx
├── lib/             # Utilitários e configurações
│   ├── api.js       # Cliente Axios
│   ├── queryClient.js
│   └── utils.js
├── hooks/           # React hooks customizados
│   └── useAuth.js   # Hook de autenticação
├── App.jsx          # Componente raiz
├── main.jsx         # Entry point
└── index.css        # Estilos globais
```

## Rotas

- `/login` - Página de login
- `/` - Dashboard (protegida)
- `/domains` - Gerenciamento de domínios bloqueados (protegida)
- `/whitelist` - Gerenciamento de whitelist de IPs (protegida)
- `/settings` - Configurações do sistema (protegida)

## Autenticação

O sistema usa JWT Bearer tokens armazenados no localStorage. O interceptor do Axios adiciona automaticamente o token em todas as requisições.

Se uma requisição retornar 401 (Unauthorized), o usuário é redirecionado para `/login`.

## Configuração do Vite

O alias `@` está configurado para apontar para `./src`:

```javascript
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
```

## Servidor de Desenvolvimento

O Vite está configurado para:
- Escutar em `0.0.0.0:5000` (acessível externamente)
- HMR (Hot Module Replacement) com WebSocket Secure (wss)
- Porta fixa 5000
- `allowedHosts: true` para funcionar com proxy do Replit

**Configuração HMR para Replit:**
```javascript
hmr: {
  protocol: 'wss',        // WebSocket Secure
  host: undefined,        // Usa host atual
  clientPort: 443,        // Porta HTTPS do Replit
  timeout: 30000,         // 30s timeout
}
```

## Erros Comuns e Soluções

### "No QueryClient set"

**Erro**: `No QueryClient set, use QueryClientProvider to set one`

**Solução**: Verifique que o `App.jsx` está envolvendo a aplicação com `<QueryClientProvider client={queryClient}>`.

### Imports quebrados com "@/"

**Erro**: `Cannot find module '@/components/...'`

**Solução**: 
1. Verifique que `vite.config.js` tem o alias configurado
2. Verifique que `jsconfig.json` existe e tem a configuração de paths

### Porta 5000 já em uso

**Erro**: `Port 5000 is already in use`

**Solução**: 
```bash
# Encontrar processo usando a porta
lsof -i :5000

# Matar o processo
kill -9 <PID>

# Ou alterar a porta no vite.config.js
```

### Página recarregando constantemente

**Erro**: `[vite] server connection lost. Polling for restart...` em loop

**Solução**: Já corrigido! O `vite.config.js` está configurado com HMR WebSocket Secure (wss) para funcionar com o proxy do Replit. Se ainda ocorrer, force um hard refresh (Ctrl+Shift+R).

### Erro de CORS

**Erro**: `Access to XMLHttpRequest at 'http://localhost:8080/...' from origin 'http://localhost:5000' has been blocked by CORS`

**Solução**: Configure o CORS no backend FastAPI para aceitar requisições de `http://localhost:5000`.

## Credenciais de Demonstração

Após a API estar configurada, use:

- **Admin**: `admin@novaguardian.com` / `admin123`
- **Usuário**: `user@example.com` / `user123`

## Próximos Passos

1. Configure a API FastAPI (pasta `apps/api/`)
2. Inicie o Docker Compose com PostgreSQL
3. Execute as migrations do banco
4. Popule o banco com dados de seed
5. Teste o login e funcionalidades
