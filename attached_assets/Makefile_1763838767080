.PHONY: help install dev stop restart logs health seed backup clean test-dns test-api db-shell api-shell pihole-shell

# Cores para output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m

help:
        @echo "$(CYAN)NovaGuardianTech - Comandos Disponiveis$(NC)"
        @echo ""
        @echo "$(GREEN)Desenvolvimento:$(NC)"
        @echo "  make install      - Instala dependencias (frontend + backend)"
        @echo "  make dev          - Inicia ambiente completo (Docker Compose)"
        @echo "  make stop         - Para todos os servicos"
        @echo "  make restart      - Reinicia todos os servicos"
        @echo "  make logs         - Exibe logs de todos os containers"
        @echo ""
        @echo "$(GREEN)Database:$(NC)"
        @echo "  make seed         - Popula banco com dados demo"
        @echo "  make backup       - Cria backup do PostgreSQL"
        @echo "  make db-shell     - Abre shell do PostgreSQL"
        @echo ""
        @echo "$(GREEN)Testes:$(NC)"
        @echo "  make test-dns     - Testa bloqueio DNS (dig)"
        @echo "  make test-api     - Testa endpoints da API"
        @echo "  make health       - Verifica status de todos os servicos"
        @echo ""
        @echo "$(GREEN)Shell / Debug:$(NC)"
        @echo "  make api-shell    - Abre bash no container da API"
        @echo "  make pihole-shell - Abre bash no container Pi-hole"
        @echo ""
        @echo "$(GREEN)Manutencao:$(NC)"
        @echo "  make clean        - Remove containers e volumes (WARNING perde dados)"
        @echo ""

install:
        @echo "$(CYAN)Instalando dependencias do frontend...$(NC)"
        cd apps/web && npm install
        @echo "$(CYAN)Instalando dependencias do backend...$(NC)"
        cd apps/api && pip install -e .
        @echo "$(GREEN)Dependencias instaladas!$(NC)"

dev:
        @echo "$(CYAN)Iniciando NovaGuardianTech...$(NC)"
        docker-compose up -d
        @echo ""
        @echo "$(GREEN)Servicos iniciados!$(NC)"
        @echo "$(YELLOW)   Frontend:    http://localhost:5000$(NC)"
        @echo "$(YELLOW)   API:         http://localhost:8080$(NC)"
        @echo "$(YELLOW)   PostgreSQL:  localhost:5432$(NC)"
        @echo "$(YELLOW)   DNS:         127.0.0.1:5353$(NC)"
        @echo "$(YELLOW)   dnsdist Web: http://localhost:8053$(NC)"
        @echo "$(YELLOW)   Pi-hole:     http://localhost:8081/admin$(NC)"
        @echo ""
        @echo "$(CYAN)Credenciais demo:$(NC)"
        @echo "  Admin: admin@novaguardian.com / admin123"
        @echo "  User:  user@example.com / user123"
        @echo ""
        @echo "Execute $(YELLOW)make test-dns$(NC) para testar bloqueio DNS"

stop:
        @echo "$(CYAN)Parando todos os servicos...$(NC)"
        docker-compose down
        @echo "$(GREEN)Servicos parados!$(NC)"

restart:
        @echo "$(CYAN)Reiniciando ambiente...$(NC)"
        docker-compose restart
        @echo "$(GREEN)Ambiente reiniciado!$(NC)"

logs:
        docker-compose logs -f

health:
        @echo "$(CYAN)Verificando status dos servicos...$(NC)"
        @echo ""
        @echo "$(YELLOW)API Backend:$(NC)"
        @curl -s http://localhost:8080/health 2>/dev/null | grep -q "healthy" && echo "$(GREEN)  Online$(NC)" || echo "$(RED)  Offline$(NC)"
        @echo "$(YELLOW)Frontend:$(NC)"
        @curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null | grep -q 200 && echo "$(GREEN)  Online$(NC)" || echo "$(RED)  Offline$(NC)"
        @echo "$(YELLOW)PostgreSQL:$(NC)"
        @curl -s http://localhost:8080/health 2>/dev/null | grep -q '"database":{"status":"up"' && echo "$(GREEN)  Online$(NC)" || echo "$(RED)  Offline$(NC)"

seed:
        @echo "$(CYAN)Populando banco de dados...$(NC)"
        cd apps/api && python tools/seed.py
        @echo "$(GREEN)Dados demo criados!$(NC)"
        @echo "$(YELLOW)Admin: admin@novaguardian.com / admin123$(NC)"
        @echo "$(YELLOW)User:  user@example.com / user123$(NC)"

backup:
        @echo "$(CYAN)Criando backup do PostgreSQL...$(NC)"
        @./tools/backup_postgres.sh

test-dns:
        @echo "$(CYAN)Testando bloqueio DNS...$(NC)"
        @echo ""
        @echo "$(YELLOW)1. Dominio bloqueado (instagram.com) - deve retornar NXDOMAIN:$(NC)"
        @dig @127.0.0.1 -p 5353 instagram.com +short 2>&1 || echo "$(GREEN)   Bloqueado (NXDOMAIN)$(NC)"
        @echo ""
        @echo "$(YELLOW)2. Dominio permitido (google.com) - deve resolver:$(NC)"
        @dig @127.0.0.1 -p 5353 google.com +short | head -n 1
        @echo "$(GREEN)   Resolvido$(NC)"
        @echo ""

test-api:
        @echo "$(CYAN)Testando endpoints da API...$(NC)"
        @echo ""
        @echo "$(YELLOW)Health Check:$(NC)"
        @curl -s http://localhost:8080/health | grep -q "healthy" && echo "$(GREEN)  OK$(NC)" || echo "$(RED)  Falhou$(NC)"
        @echo ""
        @echo "$(YELLOW)Login:$(NC)"
        @curl -s -X POST http://localhost:8080/auth/login -d "username=admin@novaguardian.com&password=admin123" -H "Content-Type: application/x-www-form-urlencoded" | grep -q "access_token" && echo "$(GREEN)  OK$(NC)" || echo "$(RED)  Falhou$(NC)"
        @echo ""

db-shell:
        @echo "$(CYAN)Abrindo shell do PostgreSQL...$(NC)"
        docker-compose exec postgres psql -U novaguard -d novaguard

api-shell:
        @echo "$(CYAN)Abrindo shell no container da API...$(NC)"
        docker-compose exec api bash

pihole-shell:
        @echo "$(CYAN)Abrindo shell no Pi-hole...$(NC)"
        docker-compose exec pihole-demo bash

clean:
        @echo "$(RED)ATENCAO: Isso vai remover TODOS os dados!$(NC)"
        @echo "$(RED)Pressione Ctrl+C nos proximos 3 segundos para cancelar...$(NC)"
        @sleep 3
        @echo "$(CYAN)Limpando ambiente...$(NC)"
        docker-compose down -v
        @echo "$(GREEN)Limpeza concluida!$(NC)"
