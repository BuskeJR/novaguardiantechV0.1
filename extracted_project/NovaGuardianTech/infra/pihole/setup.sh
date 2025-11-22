#!/bin/bash
# Pi-hole setup script
# Runs inside Pi-hole container on first boot

set -e

echo "🔧 Setting up Pi-hole for NovaGuardianTech..."

# Wait for Pi-hole to be ready
sleep 10

# Set admin password
echo "Setting admin password..."
pihole -a -p novaguardian123

# Configure upstream DNS
echo "Configuring upstream DNS servers..."
pihole -a setdns 1.1.1.1 8.8.8.8

# Set query logging
echo "Enabling query logging..."
pihole logging on

# Set privacy level to show everything
echo "Setting privacy level..."
pihole -a -l off

# Configure blocking mode to NXDOMAIN
echo "Setting blocking mode to NXDOMAIN..."
pihole -a -b nxdomain

echo "✅ Pi-hole setup complete!"
echo "📋 Admin interface: http://pihole-demo/admin"
echo "🔐 Password: novaguardian123"
