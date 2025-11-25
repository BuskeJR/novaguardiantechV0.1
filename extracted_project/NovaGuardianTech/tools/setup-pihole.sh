#!/bin/bash
# Setup script para configurar Pi-hole após docker-compose up
# Execute: bash tools/setup-pihole.sh

set -e

echo "🔧 Configurando Pi-hole demo..."

# Esperar Pi-hole estar pronto
echo "Aguardando Pi-hole iniciar..."
sleep 10

# Configurar senha admin
echo "✓ Configurando senha admin..."
docker exec pihole-demo pihole -a -p novaguardian123

# Configurar upstream DNS
echo "✓ Configurando upstream DNS..."
docker exec pihole-demo pihole -a setdns 1.1.1.1 8.8.8.8

# Habilitar query logging
echo "✓ Habilitando query logging..."
docker exec pihole-demo pihole logging on

# Configurar blocking mode para NXDOMAIN
echo "✓ Configurando blocking mode..."
docker exec pihole-demo pihole -a -b nxdomain

# Testar configuração
echo "✓ Testando configuração..."
docker exec pihole-demo pihole status

echo ""
echo "✅ Pi-hole configurado com sucesso!"
echo ""
echo "📋 Informações:"
echo "   Web UI:  http://localhost:8081/admin"
echo "   Senha:   novaguardian123"
echo "   DNS:     localhost:5353 (via dnsdist)"
echo ""
echo "🧪 Teste o bloqueio:"
echo "   dig @127.0.0.1 -p 5353 instagram.com"
echo ""
