import {
  Shield,
  LayoutDashboard,
  Globe,
  Network,
  Users,
  FileText,
  Cloud,
  LogOut,
  Cable,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const userMenuItems = [
  {
    title: "Painel de Controle",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Domínios Bloqueados",
    url: "/domains",
    icon: Globe,
  },
  {
    title: "Configuração de Rede",
    url: "/whitelist",
    icon: Network,
  },
  {
    title: "Configuração de Proxy",
    url: "/proxy-setup",
    icon: Cable,
  },
  {
    title: "Configurar Cloudflare",
    url: "/cloudflare-setup",
    icon: Cloud,
  },
];

const adminMenuItems = [
  {
    title: "Gerenciar Clientes",
    url: "/admin/clients",
    icon: Users,
  },
  {
    title: "Gerenciar Usuários",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Registros de Auditoria",
    url: "/admin/audit",
    icon: FileText,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();

  const menuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6">
            <Shield className="h-8 w-8 text-primary" data-testid="logo-icon" />
            <div>
              <h1 className="text-lg font-bold" data-testid="text-brand-name">NovaGuardian</h1>
              <p className="text-xs text-muted-foreground">Proteção de DNS</p>
            </div>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 p-4 border-t">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "Usuário"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName || user?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.location.href = "/api/logout")}
            data-testid="button-logout"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
