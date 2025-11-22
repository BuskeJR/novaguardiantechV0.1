# Pi-hole Configuration

## Configuração Inicial Manual

Após `docker-compose up`, execute uma vez:

```bash
# Configurar senha admin
docker exec pihole-demo pihole -a -p novaguardian123

# Configurar modo de bloqueio NXDOMAIN
docker exec pihole-demo pihole -a setdns 1.1.1.1 8.8.8.8

# Habilitar query logging
docker exec pihole-demo pihole logging on

# Configurar blocking mode para NXDOMAIN
docker exec pihole-demo pihole -a -b nxdomain
```

## Sincronização de Domínios

A API sincroniza domínios via endpoint `/dns/sync`:

1. Escreve domínios EXACT em `/etc/pihole/custom.list`
2. Escreve domínios REGEX em `/etc/pihole/regex.list`
3. Executa `pihole -g` para atualizar gravity database
4. Domínios persistem entre restarts

## Acesso Web

- URL: http://localhost:8081/admin
- Senha: `novaguardian123`

## Testar Bloqueio

```bash
# Via API (após adicionar domínio e sincronizar)
curl -X POST http://localhost:8080/dns/sync \
  -H "Authorization: Bearer <token>"

# Via DNS direto
dig @127.0.0.1 -p 5353 instagram.com  # Deve retornar NXDOMAIN se bloqueado
```
