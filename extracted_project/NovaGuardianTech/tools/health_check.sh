#!/bin/bash
# Health check script for NovaGuardianTech
# Returns 0 if all services are healthy, 1 otherwise

set -e

API_URL="${API_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5000}"
TIMEOUT=5

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f -m $TIMEOUT "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
        return 0
    else
        echo "❌ $name is DOWN"
        return 1
    fi
}

check_database() {
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not set"
        return 1
    fi
    
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo "✅ Database is healthy"
        return 0
    else
        echo "❌ Database is DOWN"
        return 1
    fi
}

check_docker() {
    if docker ps > /dev/null 2>&1; then
        RUNNING=$(docker ps --format "{{.Names}}" | grep -c "pihole\|dnsdist" || true)
        echo "✅ Docker is healthy ($RUNNING containers running)"
        return 0
    else
        echo "❌ Docker is DOWN"
        return 1
    fi
}

echo "🔍 NovaGuardianTech Health Check"
echo "================================"

FAILURES=0

check_service "API" "$API_URL/health" || ((FAILURES++))
check_service "Frontend" "$FRONTEND_URL" || ((FAILURES++))
check_database || ((FAILURES++))
check_docker || ((FAILURES++))

echo ""
if [ $FAILURES -eq 0 ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "❌ $FAILURES service(s) failed health check"
    exit 1
fi
