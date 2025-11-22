# NovaGuardianTech - Security Considerations

## 🔒 Docker Socket Exposure

### Current Implementation

The API container requires access to `/var/run/docker.sock` to manage Pi-hole containers dynamically. This is implemented in `docker-compose.prod.yml`:

```yaml
api:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

### Security Implications

**Risk**: Full host Docker control if API is compromised.

An attacker who gains code execution in the API container could:
- Create/destroy any containers on the host
- Access volumes from other containers
- Escalate privileges to host root
- Mine cryptocurrencies
- Launch attacks from the host

### Mitigation Strategies

#### 1. Rootless Docker (Recommended for Production)

```bash
# Install rootless Docker
dockerd-rootless-setuptool.sh install

# Run containers as non-root user
systemctl --user enable docker
systemctl --user start docker
```

**Pros**: Isolates Docker daemon from root
**Cons**: Some features limited (networking, cgroups)

#### 2. Dedicated Docker-in-Docker Sidecar

```yaml
services:
  docker-proxy:
    image: bobrik/socat
    container_name: docker-proxy
    command: "TCP4-LISTEN:2375,fork,reuseaddr UNIX-CONNECT:/var/run/docker.sock"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    expose:
      - 2375
    networks:
      - novaguardian
  
  api:
    environment:
      DOCKER_HOST: tcp://docker-proxy:2375
```

**Pros**: Limits blast radius
**Cons**: Additional complexity, still trusts proxy

#### 3. Constrained API Surface (Current + Future)

**Current**:
- ✅ Admin-only endpoints (require_admin decorator)
- ✅ JWT authentication required
- ✅ Input validation (Pydantic models)
- ✅ Client ID scoping (multi-tenant isolation)

**Future Enhancements**:
- [ ] Rate limiting per user/IP
- [ ] Audit logging for all Docker operations
- [ ] Container resource limits (CPU/memory quotas)
- [ ] Network policies (limit container connectivity)
- [ ] Image signing/verification
- [ ] Docker socket proxy with ACL

#### 4. Production-Ready Alternative: Kubernetes Operators

For large-scale production deployments:

```yaml
# Use Kubernetes Operator instead of Docker socket
apiVersion: novaguardian.tech/v1
kind: PiholeInstance
metadata:
  name: client-1-pihole
spec:
  clientId: 1
  publicIP: "203.0.113.10"
  password: <secret-ref>
```

**Pros**: Built-in RBAC, resource quotas, network policies
**Cons**: Requires Kubernetes infrastructure

### Current Risk Assessment

**Development**: ✅ **Acceptable** - Docker socket access OK for local development

**Production**: ⚠️ **Medium Risk** - Acceptable with mitigations:
1. Run API as non-root user
2. Enable audit logging
3. Implement rate limiting
4. Use rootless Docker
5. Network segmentation (API in DMZ)
6. Regular security updates
7. Container image scanning

### Recommended Production Setup

```yaml
# docker-compose.prod-secure.yml
services:
  api:
    user: "1000:1000"  # Non-root user
    read_only: true    # Read-only filesystem
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
      - apparmor=docker-default
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro  # Read-only
    environment:
      DOCKER_SECURITY_OPT: "no-new-privileges:true"
```

### Monitoring & Detection

**Recommended Alerts**:
- Unusual Docker API calls (create/destroy spikes)
- Containers created outside normal patterns
- Resource exhaustion (CPU/memory)
- Failed authentication attempts
- Privilege escalation attempts

**Audit Logging**:
```python
# Log all Docker operations
@router.post("/admin/pihole/provision")
async def provision_pihole_instance(...):
    audit_log(
        user=current_user.email,
        action="pihole_provision",
        client_id=request.client_id,
        ip=request.client.host,
        timestamp=datetime.now()
    )
    # ... provision logic
```

### Action Items

**Before Production Deployment**:
- [ ] Enable audit logging for all Docker operations
- [ ] Implement rate limiting (10 provisions/hour per user)
- [ ] Set up alerts for anomalous container creation
- [ ] Review and approve all Docker operations
- [ ] Test with rootless Docker
- [ ] Document incident response for compromised API
- [ ] Regular penetration testing
- [ ] Container image vulnerability scanning

### References

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Rootless Docker](https://docs.docker.com/engine/security/rootless/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

**Last Updated**: 2025-11-13
**Next Review**: Before production deployment
**Owner**: Infrastructure Team
