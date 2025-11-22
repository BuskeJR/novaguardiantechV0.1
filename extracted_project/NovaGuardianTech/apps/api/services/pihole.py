import subprocess
from typing import List, Dict, Any
from models.domain_rule import DomainRule, DomainKind


class PiholeService:
    def __init__(self, container_name: str):
        self.container_name = container_name
    
    def exec_command(self, command: List[str]) -> Dict[str, Any]:
        try:
            full_command = ["docker", "exec", self.container_name] + command
            
            result = subprocess.run(
                full_command,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Command timed out after 30 seconds",
                "returncode": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1
            }
    
    def add_domain_to_blocklist(self, domain: str, kind: DomainKind) -> Dict[str, Any]:
        if kind == DomainKind.EXACT:
            command = ["pihole", "-b", domain]
        else:
            command = ["pihole", "-regex", domain]
        
        result = self.exec_command(command)
        return result
    
    def remove_domain_from_blocklist(self, domain: str, kind: DomainKind) -> Dict[str, Any]:
        if kind == DomainKind.EXACT:
            command = ["pihole", "-b", "-d", domain]
        else:
            command = ["pihole", "-regex", "-d", domain]
        
        result = self.exec_command(command)
        return result
    
    def sync_domains(self, domains: List[DomainRule]) -> Dict[str, Any]:
        results = {
            "added": [],
            "failed": [],
            "total": len(domains)
        }
        
        exact_domains = [d for d in domains if d.kind == DomainKind.EXACT]
        regex_domains = [d for d in domains if d.kind == DomainKind.REGEX]
        
        current_exact = self._get_current_blocklist()
        current_regex = self._get_current_regex()
        
        new_exact_set = {d.domain for d in exact_domains}
        new_regex_set = {d.domain for d in regex_domains}
        
        to_remove_exact = current_exact - new_exact_set
        to_add_exact = new_exact_set - current_exact
        
        to_remove_regex = current_regex - new_regex_set
        to_add_regex = new_regex_set - current_regex
        
        for domain in to_remove_exact:
            result = self.exec_command(["pihole", "-b", "-d", domain])
            if not result["success"]:
                results["failed"].append({
                    "domain": domain,
                    "kind": "EXACT",
                    "action": "remove",
                    "error": result["stderr"]
                })
        
        for domain in to_add_exact:
            result = self.exec_command(["pihole", "-b", domain, "--comment", "NovaGuardian"])
            if result["success"]:
                results["added"].append({"domain": domain, "kind": "EXACT"})
            else:
                results["failed"].append({
                    "domain": domain,
                    "kind": "EXACT",
                    "action": "add",
                    "error": result["stderr"]
                })
        
        for domain in to_remove_regex:
            result = self.exec_command(["pihole", "-regex", "-d", domain])
            if not result["success"]:
                results["failed"].append({
                    "domain": domain,
                    "kind": "REGEX",
                    "action": "remove",
                    "error": result["stderr"]
                })
        
        for domain in to_add_regex:
            result = self.exec_command(["pihole", "-regex", domain, "--comment", "NovaGuardian"])
            if result["success"]:
                results["added"].append({"domain": domain, "kind": "REGEX"})
            else:
                results["failed"].append({
                    "domain": domain,
                    "kind": "REGEX",
                    "action": "add",
                    "error": result["stderr"]
                })
        
        reload_result = self.exec_command(["pihole", "restartdns", "reload-lists"])
        
        if not reload_result["success"]:
            results["warning"] = "Domains updated but DNS reload failed"
        
        return results
    
    def _get_current_blocklist(self) -> set:
        result = self.exec_command([
            "sqlite3",
            "/etc/pihole/gravity.db",
            "SELECT domain FROM domainlist WHERE type=1 AND comment='NovaGuardian';"
        ])
        
        if result["success"] and result["stdout"]:
            return set(result["stdout"].strip().split("\n"))
        return set()
    
    def _get_current_regex(self) -> set:
        result = self.exec_command([
            "sqlite3",
            "/etc/pihole/gravity.db",
            "SELECT domain FROM domainlist WHERE type=3 AND comment='NovaGuardian';"
        ])
        
        if result["success"] and result["stdout"]:
            return set(result["stdout"].strip().split("\n"))
        return set()
    
    def clear_all_domains(self) -> Dict[str, Any]:
        clear_exact = self.exec_command(["pihole", "-b", "-l"])
        clear_regex = self.exec_command(["pihole", "-regex", "-l"])
        
        reload = self.exec_command(["pihole", "restartdns", "reload"])
        
        return {
            "success": clear_exact["success"] and clear_regex["success"],
            "message": "All domains cleared and DNS restarted"
        }
    
    def get_stats(self) -> Dict[str, Any]:
        result = self.exec_command(["pihole", "-c", "-j"])
        
        if result["success"]:
            import json
            try:
                stats = json.loads(result["stdout"])
                return {
                    "success": True,
                    "stats": stats
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse Pi-hole stats"
                }
        
        return {
            "success": False,
            "error": result["stderr"]
        }
    
    def is_running(self) -> bool:
        result = subprocess.run(
            ["docker", "ps", "--filter", f"name={self.container_name}", "--format", "{{.Names}}"],
            capture_output=True,
            text=True
        )
        
        return self.container_name in result.stdout
