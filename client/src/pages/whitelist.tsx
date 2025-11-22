import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import type { IpWhitelist, InsertIpWhitelist } from "@shared/schema";

export default function Whitelist() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState<Partial<InsertIpWhitelist>>({
    ipAddress: "",
    label: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: whitelist = [], isLoading } = useQuery<IpWhitelist[]>({
    queryKey: ["/api/whitelist"],
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Partial<InsertIpWhitelist>) => {
      await apiRequest("POST", "/api/whitelist", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      toast({
        title: "Success",
        description: "IP address whitelisted successfully",
      });
      setIsAddDialogOpen(false);
      setNewIp({ ipAddress: "", label: "" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to add IP",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/whitelist/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      toast({
        title: "Success",
        description: "IP removed from whitelist",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to remove IP",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <WhitelistSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">IP Whitelist</h1>
          <p className="text-muted-foreground mt-1">
            Manage authorized IP addresses for DNS access
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-ip">
          <Plus className="h-4 w-4 mr-2" />
          Add IP
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Whitelisted IPs ({whitelist.length})</CardTitle>
          <CardDescription>
            Only these IP addresses can access your DNS protection service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {whitelist.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No IP addresses whitelisted yet</p>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First IP
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelist.map((ip) => (
                  <TableRow key={ip.id} data-testid={`row-ip-${ip.id}`}>
                    <TableCell className="font-medium font-mono" data-testid={`text-ip-${ip.id}`}>
                      {ip.ipAddress}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ip.label || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ip.createdAt ? new Date(ip.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(ip.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${ip.id}`}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP to Whitelist</DialogTitle>
            <DialogDescription>
              Allow this IP address to access your DNS protection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address *</Label>
              <Input
                id="ipAddress"
                placeholder="192.168.1.1"
                value={newIp.ipAddress}
                onChange={(e) => setNewIp({ ...newIp, ipAddress: e.target.value })}
                data-testid="input-ip-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                placeholder="Office Network"
                value={newIp.label}
                onChange={(e) => setNewIp({ ...newIp, label: e.target.value })}
                data-testid="input-label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addMutation.mutate(newIp)}
              disabled={!newIp.ipAddress || addMutation.isPending}
              data-testid="button-submit"
            >
              {addMutation.isPending ? "Adding..." : "Add IP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WhitelistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
