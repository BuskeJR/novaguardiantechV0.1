#!/bin/bash
#
# NovaGuardianTech - Script de Backup do PostgreSQL (Replit Version)
# 
# Uso:
#   ./tools/backup_postgres_replit.sh              # Backup local
#   ./tools/backup_postgres_replit.sh --upload-s3  # Backup + upload para S3
#
# Configuração:
#   - Usa DATABASE_URL do ambiente Replit
#   - Para S3: configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
#

set -e

# Cores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuração
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/novaguard_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"
RETENTION_DAYS=7  # Manter backups por 7 dias

echo -e "${CYAN}💾 NovaGuardianTech - Backup do PostgreSQL${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""

# Cria diretório de backups
mkdir -p "$BACKUP_DIR"

# Verifica se DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não está configurado!${NC}"
    echo -e "${YELLOW}Execute: export DATABASE_URL='sua_connection_string'${NC}"
    exit 1
fi

# Extrai informações do DATABASE_URL
# Formato: postgresql://user:pass@host:port/dbname
DB_URL_CLEAN=$(echo "$DATABASE_URL" | sed 's/postgresql+psycopg/postgresql/')

echo -e "${CYAN}📦 Criando backup via pg_dump...${NC}"

# Executa backup usando pg_dump com a URL de conexão
if command -v pg_dump &> /dev/null; then
    pg_dump "$DB_URL_CLEAN" > "$BACKUP_FILE"
else
    echo -e "${RED}❌ pg_dump não está instalado!${NC}"
    echo -e "${YELLOW}Instale PostgreSQL client: sudo apt install postgresql-client${NC}"
    exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Falha ao criar backup!${NC}"
    exit 1
fi

# Comprime backup
echo -e "${CYAN}🗜️  Comprimindo backup...${NC}"
gzip "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
echo -e "${GREEN}✅ Backup criado: $BACKUP_COMPRESSED ($BACKUP_SIZE)${NC}"

# Upload para S3 (opcional)
if [ "$1" == "--upload-s3" ]; then
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${YELLOW}⚠️  S3_BUCKET não configurado. Pulando upload.${NC}"
    else
        echo -e "${CYAN}☁️  Fazendo upload para S3...${NC}"
        
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_COMPRESSED" "s3://$S3_BUCKET/backups/postgres/" \
                --storage-class STANDARD_IA \
                --metadata "database=novaguard,timestamp=$TIMESTAMP"
            
            echo -e "${GREEN}✅ Upload concluído: s3://$S3_BUCKET/backups/postgres/$(basename $BACKUP_COMPRESSED)${NC}"
        else
            echo -e "${RED}❌ AWS CLI não instalado. Instale com: pip install awscli${NC}"
        fi
    fi
fi

# Limpeza de backups antigos
echo -e "${CYAN}🧹 Removendo backups com mais de $RETENTION_DAYS dias...${NC}"
find "$BACKUP_DIR" -name "novaguard_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/novaguard_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Total de backups locais: $BACKUP_COUNT${NC}"

# Lista backups recentes
echo ""
echo -e "${CYAN}📋 Backups recentes:${NC}"
ls -lh "$BACKUP_DIR"/novaguard_*.sql.gz 2>/dev/null | tail -n 5 | awk '{print "   " $9 " (" $5 ")"}' || echo "   Nenhum backup anterior"

echo ""
echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
echo -e "${YELLOW}💡 Para restaurar: gunzip -c $BACKUP_COMPRESSED | psql \$DATABASE_URL${NC}"
