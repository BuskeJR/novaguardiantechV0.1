import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Pricing from "@/pages/pricing";
import Home from "@/pages/home";
import Domains from "@/pages/domains";
import Whitelist from "@/pages/whitelist";
import AdminClients from "@/pages/admin-clients";
import AdminUsers from "@/pages/admin-users";
import AdminAudit from "@/pages/admin-audit";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated users get the dashboard with sidebar
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-4 border-b px-6 py-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/domains" component={Domains} />
              <Route path="/whitelist" component={Whitelist} />
              <Route path="/admin/clients" component={AdminClients} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/audit" component={AdminAudit} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="novaguardian-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
