#!/bin/bash
#
# NovaGuardianTech - Script de Backup do PostgreSQL
# 
# Uso:
#   ./tools/backup_postgres.sh                    # Backup local via Docker
#   ./tools/backup_postgres.sh --upload-s3       # Backup + upload para S3
#
# Configuração:
#   - Define DATABASE_URL ou vars POSTGRES_* no .env
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

# Carrega .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuração do banco
DB_NAME="${POSTGRES_DB:-novaguard}"
DB_USER="${POSTGRES_USER:-novaguard}"
DB_CONTAINER="${POSTGRES_CONTAINER:-postgres}"

echo -e "${CYAN}💾 NovaGuardianTech - Backup do PostgreSQL${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""

# Cria diretório de backups
mkdir -p "$BACKUP_DIR"

# Verifica se Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    exit 1
fi

# Verifica se container do PostgreSQL existe
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}❌ Container PostgreSQL '$DB_CONTAINER' não está rodando!${NC}"
    echo -e "${YELLOW}Execute: docker-compose up -d${NC}"
    exit 1
fi

# Executa backup
echo -e "${CYAN}📦 Criando backup do banco '$DB_NAME'...${NC}"
docker-compose exec -T "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

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
                --metadata "database=$DB_NAME,timestamp=$TIMESTAMP"
            
            echo -e "${GREEN}✅ Upload concluído: s3://$S3_BUCKET/backups/postgres/$(basename $BACKUP_COMPRESSED)${NC}"
        else
            echo -e "${RED}❌ AWS CLI não instalado. Instale com: pip install awscli${NC}"
        fi
    fi
fi

# Limpeza de backups antigos
echo -e "${CYAN}🧹 Removendo backups com mais de $RETENTION_DAYS dias...${NC}"
find "$BACKUP_DIR" -name "novaguard_*.sql.gz" -mtime +$RETENTION_DAYS -delete

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/novaguard_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Total de backups locais: $BACKUP_COUNT${NC}"

# Lista backups recentes
echo ""
echo -e "${CYAN}📋 Backups recentes:${NC}"
ls -lh "$BACKUP_DIR"/novaguard_*.sql.gz 2>/dev/null | tail -n 5 | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
echo -e "${YELLOW}💡 Para restaurar: gunzip -c $BACKUP_COMPRESSED | docker-compose exec -T postgres psql -U $DB_USER -d $DB_NAME${NC}"
