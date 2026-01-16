import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, Package, Tag, UserCog, Pencil, Trash2, Plus, Loader2 } from "lucide-react";

const ADMIN_PASSWORD_KEY = "admin_password";

function getAdminPassword(): string | null {
  return localStorage.getItem(ADMIN_PASSWORD_KEY);
}

function setAdminPassword(password: string) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

function clearAdminPassword() {
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const password = getAdminPassword();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (password) {
    headers["x-admin-password"] = password;
  }
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid password");
      }
      setAdminPassword(password);
      toast({ title: "Success", description: "Logged in as admin" });
      onLogin();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Enter the admin password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                data-testid="input-admin-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface Player {
  id: number;
  name: string;
  position: string;
  team: string | null;
  height: string | null;
  jerseyNumber: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  prices: Array<{
    id: string;
    unit_amount: number | null;
    currency: string;
    recurring: { interval: string } | null;
    active: boolean;
  }>;
}

interface Coupon {
  id: string;
  name: string;
  percent_off: number | null;
  duration: string;
  duration_in_months: number | null;
  valid: boolean;
}

interface User {
  id: string;
  email: string | null;
  role: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  createdAt: string | null;
}

function RosterTab() {
  const { toast } = useToast();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState({ name: "", position: "", team: "", height: "", jerseyNumber: "" });

  const { data, isLoading, refetch } = useQuery<{ players: Player[] }>({
    queryKey: ["/api/admin/players"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/players");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Player> }) => {
      const res = await adminFetch(`/api/admin/players/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Player updated" });
      setEditingPlayer(null);
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/players/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Player deleted" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      position: player.position,
      team: player.team || "",
      height: player.height || "",
      jerseyNumber: player.jerseyNumber?.toString() || "",
    });
  };

  const handleSave = () => {
    if (!editingPlayer) return;
    updateMutation.mutate({
      id: editingPlayer.id,
      updates: {
        name: editForm.name,
        position: editForm.position,
        team: editForm.team || null,
        height: editForm.height || null,
        jerseyNumber: editForm.jerseyNumber ? parseInt(editForm.jerseyNumber) : null,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const players = data?.players || [];

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Height</TableHead>
            <TableHead>Jersey #</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id} data-testid={`row-player-${player.id}`}>
              <TableCell>{player.id}</TableCell>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell>{player.team || "-"}</TableCell>
              <TableCell>{player.height || "-"}</TableCell>
              <TableCell>{player.jerseyNumber ?? "-"}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(player)} data-testid={`button-edit-player-${player.id}`}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete ${player.name}?`)) {
                      deleteMutation.mutate(player.id);
                    }
                  }}
                  data-testid={`button-delete-player-${player.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {players.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No players found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-player-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-position">Position</Label>
              <Select value={editForm.position} onValueChange={(v) => setEditForm({ ...editForm, position: v })}>
                <SelectTrigger data-testid="select-edit-player-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guard">Guard</SelectItem>
                  <SelectItem value="Wing">Wing</SelectItem>
                  <SelectItem value="Big">Big</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-team">Team</Label>
              <Input
                id="edit-team"
                value={editForm.team}
                onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                data-testid="input-edit-player-team"
              />
            </div>
            <div>
              <Label htmlFor="edit-height">Height</Label>
              <Input
                id="edit-height"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                placeholder="e.g. 6'5"
                data-testid="input-edit-player-height"
              />
            </div>
            <div>
              <Label htmlFor="edit-jersey">Jersey Number</Label>
              <Input
                id="edit-jersey"
                type="number"
                value={editForm.jerseyNumber}
                onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                data-testid="input-edit-player-jersey"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-player">
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductsTab() {
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/products");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await adminFetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product updated" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const products = data?.products || [];

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Prices</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="max-w-xs truncate">{product.description || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.prices.map((price) => (
                    <Badge key={price.id} variant={price.active ? "default" : "secondary"}>
                      {formatPrice(price.unit_amount, price.currency)}
                      {price.recurring && ` / ${price.recurring.interval}`}
                    </Badge>
                  ))}
                  {product.prices.length === 0 && <span className="text-muted-foreground">No prices</span>}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={product.active}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, active: checked })}
                  data-testid={`switch-product-active-${product.id}`}
                />
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No products found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CouponsTab() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", percentOff: "", duration: "once", durationInMonths: "" });

  const { data, isLoading, refetch } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/admin/coupons"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/coupons");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (couponData: { name: string; percentOff: number; duration: string; durationInMonths?: number }) => {
      const res = await adminFetch("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(couponData),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Coupon created" });
      setCreateOpen(false);
      setForm({ name: "", percentOff: "", duration: "once", durationInMonths: "" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Coupon deleted" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    const percentOff = parseFloat(form.percentOff);
    if (isNaN(percentOff) || percentOff <= 0 || percentOff > 100) {
      toast({ title: "Error", description: "Percent off must be between 1 and 100", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: form.name,
      percentOff,
      duration: form.duration,
      durationInMonths: form.duration === "repeating" ? parseInt(form.durationInMonths) || undefined : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const coupons = data?.coupons || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-coupon">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
              <DialogDescription>Create a new discount coupon</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coupon-name">Name</Label>
                <Input
                  id="coupon-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. SUMMER20"
                  data-testid="input-coupon-name"
                />
              </div>
              <div>
                <Label htmlFor="coupon-percent">Percent Off</Label>
                <Input
                  id="coupon-percent"
                  type="number"
                  min="1"
                  max="100"
                  value={form.percentOff}
                  onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
                  placeholder="e.g. 20"
                  data-testid="input-coupon-percent"
                />
              </div>
              <div>
                <Label htmlFor="coupon-duration">Duration</Label>
                <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                  <SelectTrigger data-testid="select-coupon-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                    <SelectItem value="repeating">Repeating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.duration === "repeating" && (
                <div>
                  <Label htmlFor="coupon-months">Duration in Months</Label>
                  <Input
                    id="coupon-months"
                    type="number"
                    min="1"
                    value={form.durationInMonths}
                    onChange={(e) => setForm({ ...form, durationInMonths: e.target.value })}
                    placeholder="e.g. 3"
                    data-testid="input-coupon-months"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.percentOff} data-testid="button-submit-coupon">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id} data-testid={`row-coupon-${coupon.id}`}>
              <TableCell className="font-mono text-sm">{coupon.id}</TableCell>
              <TableCell className="font-medium">{coupon.name || "-"}</TableCell>
              <TableCell>{coupon.percent_off ? `${coupon.percent_off}%` : "-"}</TableCell>
              <TableCell>
                {coupon.duration}
                {coupon.duration === "repeating" && coupon.duration_in_months && ` (${coupon.duration_in_months} mo)`}
              </TableCell>
              <TableCell>
                <Badge variant={coupon.valid ? "default" : "secondary"}>{coupon.valid ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete coupon "${coupon.name || coupon.id}"?`)) {
                      deleteMutation.mutate(coupon.id);
                    }
                  }}
                  data-testid={`button-delete-coupon-${coupon.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {coupons.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No coupons found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function UsersTab() {
  const { data, isLoading } = useQuery<{ users: User[] }>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const users = data?.users || [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Subscription</TableHead>
          <TableHead>Stripe Customer</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user, idx) => (
          <TableRow key={user.id} data-testid={`row-user-${idx}`}>
            <TableCell className="font-medium">{user.email || "-"}</TableCell>
            <TableCell>
              {user.role ? (
                <Badge variant="outline">{user.role}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              {user.subscriptionStatus ? (
                <Badge variant={user.subscriptionStatus === "active" ? "default" : "secondary"}>
                  {user.subscriptionStatus}
                </Badge>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">{user.stripeCustomerId || "-"}</TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
          </TableRow>
        ))}
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={onLogout} data-testid="button-admin-logout">
            Logout
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="roster" data-testid="tab-roster">
              <UserCog className="w-4 h-4 mr-2" />
              Roster
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="coupons" data-testid="tab-coupons">
              <Tag className="w-4 h-4 mr-2" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <Card>
              <CardHeader>
                <CardTitle>Roster Management</CardTitle>
                <CardDescription>View, edit, and delete player profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <RosterTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Products</CardTitle>
                <CardDescription>Manage Stripe products and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>Deals & Coupons</CardTitle>
                <CardDescription>Create and manage discount coupons</CardDescription>
              </CardHeader>
              <CardContent>
                <CouponsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all registered users and subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const password = getAdminPassword();
    if (password) {
      fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
        .then((res) => {
          if (res.ok) {
            setAuthenticated(true);
          } else {
            clearAdminPassword();
          }
        })
        .catch(() => clearAdminPassword());
    }
  }, []);

  const handleLogin = () => setAuthenticated(true);

  const handleLogout = () => {
    clearAdminPassword();
    setAuthenticated(false);
    queryClient.clear();
  };

  if (!authenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
