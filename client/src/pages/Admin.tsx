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
import { Lock, Users, Package, Tag, UserCog, Pencil, Trash2, Plus, Loader2, Award, Crown, Star, Shield, Sparkles, MapPin, Trophy, Globe, BarChart3, MessageSquare, GraduationCap, Download, Search, CheckCircle, XCircle, RefreshCw, Activity, TrendingUp, Gamepad2, Link2, Unlink, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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
          <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-accent" />
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
  state: string | null;
  stateRank: number | null;
  sport: "basketball" | "football";
}

// Sport filter component for admin tabs
function SportFilter({ value, onChange }: { value: "all" | "basketball" | "football"; onChange: (v: "all" | "basketball" | "football") => void }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-muted-foreground">Sport:</Label>
      <Select value={value} onValueChange={(v) => onChange(v as "all" | "basketball" | "football")}>
        <SelectTrigger className="w-[140px]" data-testid="select-sport-filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sports</SelectItem>
          <SelectItem value="basketball">Basketball</SelectItem>
          <SelectItem value="football">Football</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Sport badge component
function SportBadge({ sport }: { sport: "basketball" | "football" }) {
  return (
    <Badge 
      variant="outline" 
      className="border-accent/50 text-accent"
    >
      {sport === "football" ? "🏈" : "🏀"}
    </Badge>
  );
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
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  sport: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  coinBalance: number | null;
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

  const handleExportPlayers = () => {
    const exportData = players.map(p => ({
      id: p.id,
      name: p.name,
      sport: p.sport,
      position: p.position,
      team: p.team || '',
      height: p.height || '',
      jerseyNumber: p.jerseyNumber ?? '',
    }));
    downloadCSV(exportData, 'caliber-players.csv');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPlayers} data-testid="button-export-players">
          <Download className="w-4 h-4 mr-1" />
          Export CSV
        </Button>
      </div>
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
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    type: "one_time" as "one_time" | "subscription",
    interval: "month" as "month" | "year",
  });

  const { data, isLoading, isError, error, refetch } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/products");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const createMutation = useMutation({
    mutationFn: async (productData: { name: string; description: string; priceInCents: number; type: string; interval?: string }) => {
      const res = await adminFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product created in Stripe" });
      setCreateOpen(false);
      setForm({ name: "", description: "", price: "", type: "one_time", interval: "month" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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

  const handleCreate = () => {
    if (!form.name || !form.price) {
      toast({ title: "Error", description: "Name and price are required", variant: "destructive" });
      return;
    }
    const priceInCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast({ title: "Error", description: "Invalid price", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: form.name,
      description: form.description,
      priceInCents,
      type: form.type,
      interval: form.type === "subscription" ? form.interval : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading products: {(error as Error)?.message || "Unknown error"}</p>
        <Button onClick={() => refetch()} variant="outline">Retry</Button>
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
      <div className="flex justify-between items-center">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-product">
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>Add a new product to your Stripe account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Premium Plan"
                  data-testid="input-product-name"
                />
              </div>
              <div>
                <Label htmlFor="product-description">Description</Label>
                <Input
                  id="product-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description"
                  data-testid="input-product-description"
                />
              </div>
              <div>
                <Label htmlFor="product-price">Price (USD)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="9.99"
                  data-testid="input-product-price"
                />
              </div>
              <div>
                <Label htmlFor="product-type">Product Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "one_time" | "subscription" })}>
                  <SelectTrigger data-testid="select-product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time purchase</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "subscription" && (
                <div>
                  <Label htmlFor="product-interval">Billing Interval</Label>
                  <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v as "month" | "year" })}>
                    <SelectTrigger data-testid="select-product-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-save-product">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-products">
          Refresh Products
        </Button>
      </div>
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
                  {(product.prices || []).map((price) => (
                    <Badge key={price.id} variant={price.active ? "default" : "secondary"}>
                      {formatPrice(price.unit_amount, price.currency)}
                      {price.recurring && ` / ${price.recurring.interval}`}
                    </Badge>
                  ))}
                  {(!product.prices || product.prices.length === 0) && <span className="text-muted-foreground">No prices</span>}
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
                No products found. Click "Create Product" to add one.
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

function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function UsersTab() {
  const { toast } = useToast();
  const [giveCoinsOpen, setGiveCoinsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkCoinsOpen, setBulkCoinsOpen] = useState(false);
  const [bulkCoinAmount, setBulkCoinAmount] = useState("");
  const [bulkCoinReason, setBulkCoinReason] = useState("");
  const [sortBy, setSortBy] = useState<string>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, refetch } = useQuery<{ users: User[] }>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      return res.json();
    },
  });

  const giveCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const res = await adminFetch("/api/admin/give-coins", {
        method: "POST",
        body: JSON.stringify({ userId, amount, reason }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
      setGiveCoinsOpen(false);
      setSelectedUser(null);
      setCoinAmount("");
      setCoinReason("");
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await adminFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role updated" });
      setRoleChangeUser(null);
      setNewRole("");
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const bulkCoinsMutation = useMutation({
    mutationFn: async ({ userIds, amount, reason }: { userIds: string[]; amount: number; reason: string }) => {
      const results = await Promise.all(
        userIds.map(userId =>
          adminFetch("/api/admin/give-coins", {
            method: "POST",
            body: JSON.stringify({ userId, amount, reason }),
          }).then(r => r.json())
        )
      );
      return results;
    },
    onSuccess: () => {
      toast({ title: "Success", description: `Granted coins to ${selectedUsers.size} users` });
      setBulkCoinsOpen(false);
      setSelectedUsers(new Set());
      setBulkCoinAmount("");
      setBulkCoinReason("");
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleGiveCoins = () => {
    if (!selectedUser || !coinAmount) return;
    const amount = parseInt(coinAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Enter a valid positive amount", variant: "destructive" });
      return;
    }
    giveCoinsMutation.mutate({ userId: selectedUser.id, amount, reason: coinReason });
  };

  const handleBulkGiveCoins = () => {
    const amount = parseInt(bulkCoinAmount, 10);
    if (isNaN(amount) || amount <= 0 || selectedUsers.size === 0) {
      toast({ title: "Error", description: "Select users and enter a valid amount", variant: "destructive" });
      return;
    }
    bulkCoinsMutation.mutate({ userIds: Array.from(selectedUsers), amount, reason: bulkCoinReason });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllUsers = (users: User[]) => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const allUsers = data?.users || [];

  const filteredUsers = allUsers.filter(u => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || 
            u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q))) return false;
    }
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (subFilter === "active" && u.subscriptionStatus !== "active") return false;
    if (subFilter === "none" && u.subscriptionStatus) return false;
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "email": return dir * ((a.email || "").localeCompare(b.email || ""));
      case "role": return dir * ((a.role || "").localeCompare(b.role || ""));
      case "coins": return dir * ((a.coinBalance ?? 0) - (b.coinBalance ?? 0));
      case "created": return dir * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      default: return 0;
    }
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const handleExportUsers = () => {
    const exportData = filteredUsers.map(u => ({
      email: u.email || '',
      role: u.role || '',
      coins: u.coinBalance ?? 0,
      subscription: u.subscriptionStatus || 'none',
      created: u.createdAt || '',
    }));
    downloadCSV(exportData, 'caliber-users.csv');
    toast({ title: "Exported", description: `${exportData.length} users exported to CSV` });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-role-filter">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="recruiter">Recruiter</SelectItem>
              <SelectItem value="guardian">Guardian</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subFilter} onValueChange={setSubFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-sub-filter">
              <SelectValue placeholder="Subscription" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="none">No Sub</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportUsers} data-testid="button-export-users">
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          {selectedUsers.size > 0 && (
            <Button size="sm" onClick={() => setBulkCoinsOpen(true)} data-testid="button-bulk-coins">
              <Plus className="w-4 h-4 mr-1" />
              Give Coins to {selectedUsers.size} Users
            </Button>
          )}
          <span className="text-sm text-muted-foreground">{filteredUsers.length} of {allUsers.length} users</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedUsers.size === sortedUsers.length && sortedUsers.length > 0}
                  onCheckedChange={() => toggleAllUsers(sortedUsers)}
                  data-testid="checkbox-select-all-users"
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("email")} data-testid="sort-email">
                Email {sortBy === "email" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("role")} data-testid="sort-role">
                Role {sortBy === "role" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("coins")} data-testid="sort-coins">
                Coins {sortBy === "coins" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created")} data-testid="sort-created">
                Created {sortBy === "created" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user, idx) => (
              <TableRow key={user.id} data-testid={`row-user-${idx}`} className="cursor-pointer hover:bg-muted/50">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={() => toggleUserSelection(user.id)}
                    data-testid={`checkbox-user-${idx}`}
                  />
                </TableCell>
                <TableCell className="font-medium" onClick={() => setDetailUser(user)} data-testid={`cell-user-email-${idx}`}>
                  <div>
                    <p>{user.email || "-"}</p>
                    {(user.firstName || user.lastName) && (
                      <p className="text-xs text-muted-foreground">{[user.firstName, user.lastName].filter(Boolean).join(" ")}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => setDetailUser(user)}>
                  {user.role ? (
                    <Badge variant="outline">{user.role}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell onClick={() => setDetailUser(user)}>
                  <span className="font-medium text-yellow-500">{user.coinBalance ?? 0}</span>
                </TableCell>
                <TableCell onClick={() => setDetailUser(user)}>
                  {user.subscriptionStatus ? (
                    <Badge
                      variant="outline"
                      className={
                        user.subscriptionStatus === "active"
                          ? "border-green-500/50 text-green-500 bg-green-500/10"
                          : user.subscriptionStatus === "canceled"
                          ? "border-red-500/50 text-red-500 bg-red-500/10"
                          : "border-muted-foreground/50 text-muted-foreground"
                      }
                      data-testid={`badge-sub-status-${user.subscriptionStatus}`}
                    >
                      {user.subscriptionStatus}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground" data-testid="badge-sub-status-none">
                      None
                    </Badge>
                  )}
                </TableCell>
                <TableCell onClick={() => setDetailUser(user)}>{formatDate(user.createdAt)}</TableCell>
                <TableCell className="space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setGiveCoinsOpen(true);
                    }}
                    data-testid={`btn-give-coins-${idx}`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Coins
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRoleChangeUser(user);
                      setNewRole(user.role || "player");
                    }}
                    data-testid={`btn-change-role-${idx}`}
                  >
                    <UserCog className="w-3 h-3 mr-1" />
                    Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sortedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={giveCoinsOpen} onOpenChange={setGiveCoinsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Coins</DialogTitle>
            <DialogDescription>
              Grant coins to {selectedUser?.email || "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coin-amount">Amount</Label>
              <Input
                id="coin-amount"
                type="number"
                min="1"
                placeholder="100"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                data-testid="input-coin-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coin-reason">Reason (optional)</Label>
              <Input
                id="coin-reason"
                placeholder="Bonus for..."
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
                data-testid="input-coin-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiveCoinsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGiveCoins} 
              disabled={giveCoinsMutation.isPending}
              data-testid="btn-confirm-give-coins"
            >
              {giveCoinsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Give Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleChangeUser} onOpenChange={(open) => !open && setRoleChangeUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {roleChangeUser?.email || "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger data-testid="select-new-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeUser(null)}>Cancel</Button>
            <Button
              onClick={() => roleChangeUser && changeRoleMutation.mutate({ userId: roleChangeUser.id, role: newRole })}
              disabled={changeRoleMutation.isPending}
              data-testid="button-confirm-role-change"
            >
              {changeRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>{detailUser?.email || ""}</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium" data-testid="detail-user-name">
                    {[detailUser.firstName, detailUser.lastName].filter(Boolean).join(" ") || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono text-muted-foreground" data-testid="detail-user-id">{detailUser.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <Badge variant="outline" data-testid="detail-user-role">{detailUser.role || "none"}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Coins</p>
                  <p className="text-sm font-medium text-yellow-500" data-testid="detail-user-coins">{detailUser.coinBalance ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Subscription</p>
                  <Badge
                    variant="outline"
                    className={
                      detailUser.subscriptionStatus === "active"
                        ? "border-green-500/50 text-green-500 bg-green-500/10"
                        : detailUser.subscriptionStatus === "canceled"
                        ? "border-red-500/50 text-red-500 bg-red-500/10"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }
                    data-testid="detail-user-sub"
                  >
                    {detailUser.subscriptionStatus || "None"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="text-sm" data-testid="detail-user-joined">{formatDate(detailUser.createdAt)}</p>
                </div>
                {detailUser.sport && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Sport</p>
                    <Badge variant="outline" data-testid="detail-user-sport">{detailUser.sport}</Badge>
                  </div>
                )}
                {detailUser.subscriptionTier && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className="text-sm font-medium" data-testid="detail-user-tier">{detailUser.subscriptionTier}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailUser(null);
                    setSelectedUser(detailUser);
                    setGiveCoinsOpen(true);
                  }}
                  data-testid="detail-give-coins"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Give Coins
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailUser(null);
                    setRoleChangeUser(detailUser);
                    setNewRole(detailUser.role || "player");
                  }}
                  data-testid="detail-change-role"
                >
                  <UserCog className="w-3 h-3 mr-1" />
                  Change Role
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={bulkCoinsOpen} onOpenChange={setBulkCoinsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Grant Coins</DialogTitle>
            <DialogDescription>Grant coins to {selectedUsers.size} selected user(s)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-coin-amount">Amount per User</Label>
              <Input
                id="bulk-coin-amount"
                type="number"
                min="1"
                placeholder="100"
                value={bulkCoinAmount}
                onChange={(e) => setBulkCoinAmount(e.target.value)}
                data-testid="input-bulk-coin-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-coin-reason">Reason (optional)</Label>
              <Input
                id="bulk-coin-reason"
                placeholder="Bonus for..."
                value={bulkCoinReason}
                onChange={(e) => setBulkCoinReason(e.target.value)}
                data-testid="input-bulk-coin-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCoinsOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkGiveCoins}
              disabled={bulkCoinsMutation.isPending}
              data-testid="btn-confirm-bulk-coins"
            >
              {bulkCoinsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Grant to {selectedUsers.size} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CaliberBadge {
  id: number;
  playerId: number;
  category: string;
  reason: string | null;
  awardedAt: string;
  player?: {
    id: number;
    name: string;
    position: string;
  };
}

const CALIBER_CATEGORIES = [
  { value: "excellence", label: "Excellence", icon: Crown, color: "text-yellow-500" },
  { value: "dedication", label: "Dedication", icon: Star, color: "text-blue-500" },
  { value: "leadership", label: "Leadership", icon: Shield, color: "text-purple-500" },
  { value: "potential", label: "Potential", icon: Sparkles, color: "text-green-500" },
];

function CaliberBadgesTabWrapper() {
  const { toast } = useToast();
  const [awardOpen, setAwardOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState({ category: "excellence", reason: "" });
  const [sportFilter, setSportFilter] = useState<"all" | "basketball" | "football">("all");

  const { data: playersData, isLoading: playersLoading, isError: playersError } = useQuery<{ players: Player[] }>({
    queryKey: ["/api/admin/players", "caliber-badges-tab"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/players");
      return res.json();
    },
  });

  const { data: badgesData, isLoading: badgesLoading, isError: badgesError, refetch: refetchBadges } = useQuery<{ badges: CaliberBadge[] }>({
    queryKey: ["/api/caliber-badges"],
    queryFn: async () => {
      const res = await fetch("/api/caliber-badges");
      if (!res.ok) throw new Error("Failed to load badges");
      return res.json();
    },
  });

  const awardMutation = useMutation({
    mutationFn: async ({ playerId, category, reason }: { playerId: number; category: string; reason?: string }) => {
      const res = await fetch(`/api/players/${playerId}/caliber-badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to award badge");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: "Caliber badge awarded!" });
      setAwardOpen(false);
      setSelectedPlayer(null);
      setForm({ category: "excellence", reason: "" });
      refetchBadges();
      // Also invalidate the player-specific query for their profile
      queryClient.invalidateQueries({ queryKey: ["/api/players", variables.playerId, "caliber-badge"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await fetch(`/api/players/${playerId}/caliber-badge`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke badge");
      }
      return { playerId };
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Caliber badge revoked" });
      refetchBadges();
      // Also invalidate the player-specific query for their profile
      queryClient.invalidateQueries({ queryKey: ["/api/players", data.playerId, "caliber-badge"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openAwardDialog = (player: Player) => {
    setSelectedPlayer(player);
    setForm({ category: "excellence", reason: "" });
    setAwardOpen(true);
  };

  const handleAward = () => {
    if (!selectedPlayer) return;
    awardMutation.mutate({
      playerId: selectedPlayer.id,
      category: form.category,
      reason: form.reason || undefined,
    });
  };

  if (playersLoading || badgesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (playersError || badgesError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <p className="text-destructive">Failed to load data. Please try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const allPlayers = playersData?.players || [];
  const players = sportFilter === "all" ? allPlayers : allPlayers.filter(p => p.sport === sportFilter);
  const badges = badgesData?.badges || [];
  const badgeMap = new Map(badges.map(b => [b.playerId, b]));

  const getCategoryInfo = (category: string) => {
    return CALIBER_CATEGORIES.find(c => c.value === category) || CALIBER_CATEGORIES[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Award special Caliber badges to recognize outstanding players. Only you (the app owner) can award these badges.
        </p>
        <SportFilter value={sportFilter} onChange={setSportFilter} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CALIBER_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = badges.filter(b => b.category === cat.value).length;
          return (
            <Card key={cat.value} className="bg-card/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`p-2 rounded-lg bg-background ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{cat.label}</p>
                  <p className="text-sm text-muted-foreground">{count} awarded</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Current Badge</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => {
            const badge = badgeMap.get(player.id);
            const catInfo = badge ? getCategoryInfo(badge.category) : null;
            const CatIcon = catInfo?.icon;

            return (
              <TableRow key={player.id} data-testid={`row-caliber-player-${player.id}`}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell><SportBadge sport={player.sport} /></TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell>
                  {badge && CatIcon ? (
                    <div className="flex items-center gap-2">
                      <CatIcon className={`w-4 h-4 ${catInfo?.color}`} />
                      <span className="capitalize">{badge.category}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {badge?.reason || "-"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {badge ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Revoke Caliber badge from ${player.name}?`)) {
                          revokeMutation.mutate(player.id);
                        }
                      }}
                      disabled={revokeMutation.isPending}
                      data-testid={`button-revoke-badge-${player.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => openAwardDialog(player)}
                      data-testid={`button-award-badge-${player.id}`}
                    >
                      <Award className="w-4 h-4 mr-1" />
                      Award Badge
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {players.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No players found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={awardOpen} onOpenChange={(open) => !open && setAwardOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Caliber Badge</DialogTitle>
            <DialogDescription>
              Award a special recognition badge to {selectedPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="badge-category">Badge Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="select-badge-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CALIBER_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="badge-reason">Reason (optional)</Label>
              <Input
                id="badge-reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g., Outstanding leadership this season"
                data-testid="input-badge-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAward} disabled={awardMutation.isPending} data-testid="button-confirm-award">
              {awardMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Award Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface Accolade {
  id: number;
  playerId: number;
  type: string;
  title: string;
  description: string | null;
  season: string | null;
  dateEarned: string | null;
  verified: boolean;
  createdAt: string;
}

function StateRankingsTab() {
  const { toast } = useToast();
  const [rankOpen, setRankOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [stateRank, setStateRank] = useState("");
  const [countryRank, setCountryRank] = useState("");
  const [sportFilter, setSportFilter] = useState<"all" | "basketball" | "football">("all");

  const { data: playersData, isLoading: playersLoading, refetch: refetchPlayers } = useQuery<{ players: Player[] }>({
    queryKey: ["/api/admin/players", "rankings-tab"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/players");
      return res.json();
    },
  });

  const { data: rankingsData, refetch: refetchRankings } = useQuery<{ players: Array<{ id: number; name: string; position: string; state: string; team: string; stateRank: number | null; countryRank: number | null }> }>({
    queryKey: ["/api/state-rankings"],
    queryFn: async () => {
      const res = await fetch("/api/state-rankings");
      return res.json();
    },
  });

  const setStateRankMutation = useMutation({
    mutationFn: async ({ playerId, rankValue }: { playerId: number; rankValue: number }) => {
      const res = await fetch(`/api/players/${playerId}/state-rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rank: rankValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set state ranking");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Success", description: "State ranking set!" });
      refetchPlayers();
      refetchRankings();
      queryClient.invalidateQueries({ queryKey: ["/api/players/:id", variables.playerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const setCountryRankMutation = useMutation({
    mutationFn: async ({ playerId, rankValue }: { playerId: number; rankValue: number }) => {
      const res = await fetch(`/api/players/${playerId}/country-rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rank: rankValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set country ranking");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Success", description: "Country ranking set!" });
      refetchPlayers();
      refetchRankings();
      queryClient.invalidateQueries({ queryKey: ["/api/players/:id", variables.playerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeStateRankMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await fetch(`/api/players/${playerId}/state-rank`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove state ranking");
      }
      return res.json();
    },
    onSuccess: (_data, playerId) => {
      toast({ title: "Success", description: "State ranking removed!" });
      refetchPlayers();
      refetchRankings();
      queryClient.invalidateQueries({ queryKey: ["/api/players/:id", playerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeCountryRankMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await fetch(`/api/players/${playerId}/country-rank`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove country ranking");
      }
      return res.json();
    },
    onSuccess: (_data, playerId) => {
      toast({ title: "Success", description: "Country ranking removed!" });
      refetchPlayers();
      refetchRankings();
      queryClient.invalidateQueries({ queryKey: ["/api/players/:id", playerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openRankDialog = (player: Player) => {
    setSelectedPlayer(player);
    const currentRanking = rankingsData?.players.find(r => r.id === player.id);
    setStateRank(currentRanking?.stateRank?.toString() || "");
    setCountryRank(currentRanking?.countryRank?.toString() || "");
    setRankOpen(true);
  };

  const handleSaveRanks = () => {
    if (!selectedPlayer) return;
    
    const stateRankValue = stateRank ? parseInt(stateRank) : null;
    const countryRankValue = countryRank ? parseInt(countryRank) : null;
    
    if (stateRankValue !== null && (isNaN(stateRankValue) || stateRankValue < 1 || stateRankValue > 100)) {
      toast({ title: "Error", description: "State rank must be a number between 1 and 100", variant: "destructive" });
      return;
    }
    if (countryRankValue !== null && (isNaN(countryRankValue) || countryRankValue < 1 || countryRankValue > 500)) {
      toast({ title: "Error", description: "Country rank must be a number between 1 and 500", variant: "destructive" });
      return;
    }
    
    const currentRanking = rankingsData?.players.find(r => r.id === selectedPlayer.id);
    
    // Handle state rank
    if (stateRankValue !== null) {
      setStateRankMutation.mutate({ playerId: selectedPlayer.id, rankValue: stateRankValue });
    } else if (currentRanking?.stateRank) {
      removeStateRankMutation.mutate(selectedPlayer.id);
    }
    
    // Handle country rank
    if (countryRankValue !== null) {
      setCountryRankMutation.mutate({ playerId: selectedPlayer.id, rankValue: countryRankValue });
    } else if (currentRanking?.countryRank) {
      removeCountryRankMutation.mutate(selectedPlayer.id);
    }
    
    setRankOpen(false);
    setSelectedPlayer(null);
    setStateRank("");
    setCountryRank("");
  };

  if (playersLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const allPlayers = playersData?.players || [];
  const players = sportFilter === "all" ? allPlayers : allPlayers.filter(p => p.sport === sportFilter);
  const allRankedPlayers = rankingsData?.players || [];
  const rankedPlayers = sportFilter === "all" ? allRankedPlayers : allRankedPlayers.filter(p => {
    const playerData = allPlayers.find(ap => ap.id === p.id);
    return playerData?.sport === sportFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Assign state and country rankings to players.
        </p>
        <SportFilter value={sportFilter} onChange={setSportFilter} />
      </div>

      {rankedPlayers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5" style={{ color: '#D4AF37' }} />
            Current Rankings
          </h3>
          <div className="grid gap-2">
            {rankedPlayers.map((p) => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(10,10,10,0.3) 100%)',
                  borderColor: 'rgba(212,175,55,0.3)'
                }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {p.stateRank && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ 
                          background: '#0a0a0a', 
                          color: '#D4AF37',
                          border: '1px solid #D4AF37'
                        }}
                      >
                        #{p.stateRank} IN {p.state}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeStateRankMutation.mutate(p.id)}
                        disabled={removeStateRankMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                  {p.countryRank && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ 
                          background: '#0a0a0a', 
                          color: '#3B82F6',
                          border: '1px solid #3B82F6'
                        }}
                      >
                        #{p.countryRank} IN USA
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeCountryRankMutation.mutate(p.id)}
                        disabled={removeCountryRankMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline">{p.position}</Badge>
                  {p.team && <span className="text-sm text-muted-foreground">{p.team}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>State Rank</TableHead>
            <TableHead>Country Rank</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No players found
              </TableCell>
            </TableRow>
          ) : (
            players.map((player) => {
              const currentRanking = rankedPlayers.find(r => r.id === player.id);
              return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell><SportBadge sport={player.sport} /></TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>{player.state || "-"}</TableCell>
                  <TableCell>{player.team || "-"}</TableCell>
                  <TableCell>
                    {currentRanking?.stateRank ? (
                      <Badge 
                        variant="outline"
                        className="border-0"
                        style={{ 
                          background: '#0a0a0a', 
                          color: '#D4AF37',
                          border: '1px solid rgba(212,175,55,0.5)'
                        }}
                      >
                        <Crown className="w-3 h-3 mr-1" style={{ color: '#D4AF37' }} />
                        #{currentRanking.stateRank}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {currentRanking?.countryRank ? (
                      <Badge 
                        variant="outline"
                        className="border-0"
                        style={{ 
                          background: '#0a0a0a', 
                          color: '#3B82F6',
                          border: '1px solid rgba(59,130,246,0.5)'
                        }}
                      >
                        <Globe className="w-3 h-3 mr-1" style={{ color: '#3B82F6' }} />
                        #{currentRanking.countryRank}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRankDialog(player)}
                      className="gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Set Rankings
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={rankOpen} onOpenChange={setRankOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Rankings</DialogTitle>
            <DialogDescription>
              Set the state and/or country ranking for {selectedPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="flex items-center gap-2">
                <Crown className="w-4 h-4" style={{ color: '#D4AF37' }} />
                State Rank (1-100)
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={stateRank}
                onChange={(e) => setStateRank(e.target.value)}
                placeholder="e.g., 1 for #1 in state"
                className="mt-1"
              />
              {selectedPlayer?.state && (
                <p className="text-xs text-muted-foreground mt-1">
                  Displays as "#{stateRank || "X"} IN {selectedPlayer.state}" on the profile
                </p>
              )}
              {!selectedPlayer?.state && (
                <p className="text-xs text-accent mt-1">
                  Player has no state set - state rank won't display
                </p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" style={{ color: '#3B82F6' }} />
                Country Rank (1-500)
              </Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={countryRank}
                onChange={(e) => setCountryRank(e.target.value)}
                placeholder="e.g., 5 for #5 in USA"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Displays as "#{countryRank || "X"} IN USA" on the profile
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRankOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveRanks} 
              disabled={setStateRankMutation.isPending || setCountryRankMutation.isPending}
              className="gap-2"
            >
              {(setStateRankMutation.isPending || setCountryRankMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Rankings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StateAwardsTab() {
  const { toast } = useToast();
  const [awardOpen, setAwardOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState({ title: "", description: "", season: "" });
  const [sportFilter, setSportFilter] = useState<"all" | "basketball" | "football">("all");

  const { data: playersData, isLoading: playersLoading } = useQuery<{ players: Player[] }>({
    queryKey: ["/api/admin/players"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/players");
      return res.json();
    },
  });

  const awardMutation = useMutation({
    mutationFn: async ({ playerId, title, description, season }: { playerId: number; title: string; description?: string; season?: string }) => {
      const res = await fetch(`/api/players/${playerId}/accolades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          type: "state_award",
          title, 
          description: description || undefined,
          season: season || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to award state recognition");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "State award given!" });
      setAwardOpen(false);
      setSelectedPlayer(null);
      setForm({ title: "", description: "", season: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openAwardDialog = (player: Player) => {
    setSelectedPlayer(player);
    setForm({ title: "", description: "", season: "" });
    setAwardOpen(true);
  };

  const handleAward = () => {
    if (!selectedPlayer || !form.title) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    awardMutation.mutate({
      playerId: selectedPlayer.id,
      title: form.title,
      description: form.description || undefined,
      season: form.season || undefined,
    });
  };

  if (playersLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const allPlayers = playersData?.players || [];
  const players = sportFilter === "all" ? allPlayers : allPlayers.filter(p => p.sport === sportFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Award official state recognitions to players. Only you (the app owner) can give these awards.
        </p>
        <SportFilter value={sportFilter} onChange={setSportFilter} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id} data-testid={`row-state-player-${player.id}`}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell><SportBadge sport={player.sport} /></TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell>{(player as any).state || "-"}</TableCell>
              <TableCell>{player.team || "-"}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => openAwardDialog(player)}
                  data-testid={`button-state-award-${player.id}`}
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Give State Award
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {players.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No players found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={awardOpen} onOpenChange={(open) => !open && setAwardOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give State Award</DialogTitle>
            <DialogDescription>
              Award an official state recognition to {selectedPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="award-title">Award Title</Label>
              <Input
                id="award-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., All-State First Team, State Player of the Year"
                data-testid="input-state-award-title"
              />
            </div>
            <div>
              <Label htmlFor="award-description">Description (optional)</Label>
              <Textarea
                id="award-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Additional details about the award..."
                data-testid="input-state-award-description"
              />
            </div>
            <div>
              <Label htmlFor="award-season">Season (optional)</Label>
              <Input
                id="award-season"
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                placeholder="e.g., 2025-26"
                data-testid="input-state-award-season"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAward} disabled={awardMutation.isPending || !form.title} data-testid="button-confirm-state-award">
              {awardMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Give Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/analytics");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const CHART_COLORS = ["hsl(var(--accent))", "#22c55e", "#eab308", "#8b5cf6", "#ef4444"];

  const statCard = (icon: any, label: string, value: number | string, sub?: string, color?: string) => {
    const Icon = icon;
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`p-2.5 rounded-lg bg-background ${color || 'text-accent'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tabular-nums" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    );
  };

  const roleData = [
    { name: "Players", count: data.users.byRole.player || 0 },
    { name: "Coaches", count: data.users.byRole.coach || 0 },
    { name: "Recruiters", count: data.users.byRole.recruiter || 0 },
    { name: "Guardians", count: data.users.byRole.guardian || 0 },
  ];

  const weeklyGrowth = data.weeklyGrowth || [];
  const seasons = data.seasons || [];
  const topPerformers = (data.topPerformers || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCard(Users, "Total Users", data.users.total, `+${data.users.new7d} this week`)}
        {statCard(UserCog, "Total Players", data.users.players)}
        {statCard(Gamepad2, "Games Logged", data.games.total, `+${data.games.thisWeek} this week`)}
        {statCard(TrendingUp, "Avg Points", data.games.avgPoints || "N/A")}
        {statCard(Shield, "Guardians", data.users.byRole.guardian || 0, data.guardians ? `${data.guardians.pending} pending` : undefined, "text-purple-500")}
        {statCard(Link2, "Guardian Links", data.guardians?.totalLinks || 0, data.guardians ? `${data.guardians.approved} approved` : undefined, "text-blue-500")}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Growth</CardTitle>
            <CardDescription>Users and games over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="newUsers" stroke={CHART_COLORS[0]} name="Users" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="newGames" stroke={CHART_COLORS[1]} name="Games" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No weekly data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Distribution</CardTitle>
            <CardDescription>Users by account role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sport Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Basketball</span><span className="font-medium">{data.games.basketball} games</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Football</span><span className="font-medium">{data.games.football} games</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Active (7d)</span><span className="font-medium">{data.engagement.active7d} players</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">5+ Games</span><span className="font-medium">{data.engagement.fivePlusGames} players</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Feed Posts</span><span className="font-medium">{data.feed.totalPosts}</span></div>
            <div className="border-t pt-2 mt-2 flex justify-between"><span className="text-muted-foreground">New (30d)</span><span className="font-medium text-green-500">+{data.users.new30d}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Performers</CardTitle>
            <CardDescription>Most games logged</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <Table>
                <TableBody>
                  {topPerformers.map((p: any, i: number) => (
                    <TableRow key={p.playerId} data-testid={`row-top-performer-${i}`}>
                      <TableCell className="py-1.5 pl-0">
                        <span className="text-xs text-muted-foreground mr-2">#{i + 1}</span>
                        <span className="font-medium text-sm">{p.playerName}</span>
                      </TableCell>
                      <TableCell className="py-1.5 pr-0 text-right">
                        <Badge variant="secondary" className="text-xs">{p.totalGames} games</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {seasons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Games by Season</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={seasons}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="game_count" fill={CHART_COLORS[1]} name="Games" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recruiting Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xl font-bold">{data.recruiting.totalRecruiters}</p><p className="text-xs text-muted-foreground">Total Recruiters</p></div>
            <div><p className="text-xl font-bold text-green-500">{data.recruiting.verifiedRecruiters}</p><p className="text-xs text-muted-foreground">Verified</p></div>
            <div><p className="text-xl font-bold text-yellow-500">{data.recruiting.pendingRecruiters}</p><p className="text-xs text-muted-foreground">Pending</p></div>
            <div><p className="text-xl font-bold">{data.recruiting.totalInquiries}</p><p className="text-xs text-muted-foreground">Inquiries ({data.recruiting.unreadInquiries} unread)</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GuardianManagementTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/admin/guardian-links", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all"
        ? `/api/admin/guardian-links?status=${statusFilter}`
        : "/api/admin/guardian-links";
      const res = await adminFetch(url);
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminFetch(`/api/admin/guardian-links/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Guardian link status updated" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guardian-links"] });
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

  const links = Array.isArray(data) ? data : [];
  const stats = {
    total: links.length,
    approved: links.filter((l: any) => l.status === "approved").length,
    pending: links.filter((l: any) => l.status === "pending").length,
    revoked: links.filter((l: any) => l.status === "revoked").length,
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : "-";

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "approved": return "border-green-500/50 text-green-500 bg-green-500/10";
      case "pending": return "border-yellow-500/50 text-yellow-500 bg-yellow-500/10";
      case "revoked": return "border-red-500/50 text-red-500 bg-red-500/10";
      default: return "border-muted-foreground/50 text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2.5 rounded-lg bg-background text-accent"><Link2 className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold tabular-nums" data-testid="stat-total-links">{stats.total}</p><p className="text-sm text-muted-foreground">Total Links</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2.5 rounded-lg bg-background text-green-500"><CheckCircle className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold tabular-nums" data-testid="stat-approved-links">{stats.approved}</p><p className="text-sm text-muted-foreground">Approved</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2.5 rounded-lg bg-background text-yellow-500"><Loader2 className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold tabular-nums" data-testid="stat-pending-links">{stats.pending}</p><p className="text-sm text-muted-foreground">Pending</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2.5 rounded-lg bg-background text-red-500"><XCircle className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold tabular-nums" data-testid="stat-revoked-links">{stats.revoked}</p><p className="text-sm text-muted-foreground">Revoked</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm text-muted-foreground">Filter:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-guardian-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{links.length} links</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guardian</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Linked Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link: any) => (
            <TableRow key={link.id} data-testid={`row-guardian-link-${link.id}`}>
              <TableCell>
                <div>
                  <p className="font-medium">{link.guardianName || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{link.guardianEmail || ""}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">{link.playerName || "Unknown"}</TableCell>
              <TableCell>{link.relationship || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadgeClass(link.status)} data-testid={`badge-guardian-status-${link.id}`}>
                  {link.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(link.linkedAt)}</TableCell>
              <TableCell className="text-right space-x-1">
                {link.status !== "approved" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => updateStatusMutation.mutate({ id: link.id, status: "approved" })}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-approve-guardian-${link.id}`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                )}
                {link.status !== "revoked" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => updateStatusMutation.mutate({ id: link.id, status: "revoked" })}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-revoke-guardian-${link.id}`}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {links.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No guardian links found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SeasonManagementTab() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sport: "basketball", startDate: "", endDate: "", isCurrent: false });

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/seasons"],
    queryFn: async () => {
      const res = await adminFetch("/api/seasons");
      return res.json();
    },
  });

  const { data: analyticsData } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/analytics");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (seasonData: any) => {
      const res = await adminFetch("/api/admin/seasons", {
        method: "POST",
        body: JSON.stringify(seasonData),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Season created" });
      setCreateOpen(false);
      setForm({ name: "", sport: "basketball", startDate: "", endDate: "", isCurrent: false });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleCurrentMutation = useMutation({
    mutationFn: async ({ id, isCurrent }: { id: number; isCurrent: boolean }) => {
      const res = await adminFetch(`/api/admin/seasons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isCurrent }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Season updated" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!form.name || !form.sport || !form.startDate || !form.endDate) {
      toast({ title: "Error", description: "Name, sport, start date, and end date are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: form.name,
      sport: form.sport,
      startDate: form.startDate,
      endDate: form.endDate,
      isCurrent: form.isCurrent,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const seasons = Array.isArray(data) ? data : (data?.seasons || []);
  const seasonGameCounts = new Map(
    (analyticsData?.seasons || []).map((s: any) => [s.name, Number(s.game_count || s.gameCount || 0)])
  );

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : "-";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-season">
              <Plus className="w-4 h-4 mr-2" />
              Create Season
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Season</DialogTitle>
              <DialogDescription>Add a new season to the platform</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="season-name">Name</Label>
                <Input
                  id="season-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., 2025-26 Season"
                  data-testid="input-season-name"
                />
              </div>
              <div>
                <Label htmlFor="season-sport">Sport</Label>
                <Select value={form.sport} onValueChange={(v) => setForm({ ...form, sport: v })}>
                  <SelectTrigger data-testid="select-season-sport">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="season-start">Start Date</Label>
                <Input
                  id="season-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  data-testid="input-season-start"
                />
              </div>
              <div>
                <Label htmlFor="season-end">End Date</Label>
                <Input
                  id="season-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  data-testid="input-season-end"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="season-current"
                  checked={form.isCurrent}
                  onCheckedChange={(checked) => setForm({ ...form, isCurrent: checked === true })}
                  data-testid="checkbox-season-current"
                />
                <Label htmlFor="season-current">Set as current season</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-save-season">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Season
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Games</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seasons.map((season: any) => (
            <TableRow key={season.id} data-testid={`row-season-${season.id}`}>
              <TableCell className="font-medium">{season.name}</TableCell>
              <TableCell><Badge variant="outline">{season.sport}</Badge></TableCell>
              <TableCell>{formatDate(season.startDate)}</TableCell>
              <TableCell>{formatDate(season.endDate)}</TableCell>
              <TableCell>
                <Switch
                  checked={season.isCurrent || false}
                  onCheckedChange={(checked) => toggleCurrentMutation.mutate({ id: season.id, isCurrent: checked })}
                  data-testid={`switch-season-current-${season.id}`}
                />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{seasonGameCounts.get(season.name) ?? season.gameCount ?? 0}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {seasons.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No seasons found. Create one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ActivityFeedTab() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/activity");
      return res.json();
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const activities: Array<{ id: string; type: string; description: string; details?: string; timestamp: string }> = [];

  if (data?.recentGames) {
    for (const g of data.recentGames) {
      activities.push({
        id: `game-${g.id}`,
        type: "game_logged",
        description: `${g.player_name || "Unknown"} logged a ${g.sport} game`,
        details: `Grade: ${g.grade || "N/A"} • ${g.date}`,
        timestamp: g.created_at,
      });
    }
  }
  if (data?.recentUsers) {
    for (const u of data.recentUsers) {
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
      activities.push({
        id: `user-${u.id}`,
        type: "user_signup",
        description: `New user: ${name}`,
        details: `Role: ${u.role} • ${u.email}`,
        timestamp: u.created_at,
      });
    }
  }
  if (data?.recentGuardianLinks) {
    for (const gl of data.recentGuardianLinks) {
      const gName = [gl.guardian_first_name, gl.guardian_last_name].filter(Boolean).join(" ") || "Unknown";
      activities.push({
        id: `guardian-${gl.id}`,
        type: "guardian_request",
        description: `Guardian link: ${gName} → ${gl.player_name || "Unknown"}`,
        details: `Status: ${gl.status} • ${gl.relationship || ""}`,
        timestamp: gl.linked_at || gl.created_at,
      });
    }
  }
  if (data?.recentFeedPosts) {
    for (const fp of data.recentFeedPosts) {
      activities.push({
        id: `feed-${fp.id}`,
        type: "feed_post",
        description: `Feed post: ${fp.activity_type || "post"}`,
        details: fp.headline || undefined,
        timestamp: fp.created_at,
      });
    }
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = typeFilter === "all" ? activities : activities.filter(a => a.type === typeFilter);

  const getIcon = (type: string) => {
    switch (type) {
      case "game_logged": return Gamepad2;
      case "user_signup": return Users;
      case "guardian_request": return Shield;
      case "feed_post": return MessageSquare;
      default: return Activity;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "game_logged": return "text-green-500";
      case "user_signup": return "text-blue-500";
      case "guardian_request": return "text-purple-500";
      case "feed_post": return "text-accent";
      default: return "text-muted-foreground";
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm text-muted-foreground">Filter:</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-activity-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="game_logged">Games Logged</SelectItem>
            <SelectItem value="user_signup">User Sign-ups</SelectItem>
            <SelectItem value="guardian_request">Guardian Links</SelectItem>
            <SelectItem value="feed_post">Feed Posts</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} items</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No recent activity
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((activity, idx) => {
            const Icon = getIcon(activity.type);
            const iconColor = getIconColor(activity.type);
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border"
                data-testid={`activity-item-${idx}`}
              >
                <div className={`p-2 rounded-lg bg-background flex-shrink-0 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" data-testid={`activity-description-${idx}`}>{activity.description}</p>
                  {activity.details && (
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0" data-testid={`activity-time-${idx}`}>
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModerationTab() {
  const { toast } = useToast();
  const [view, setView] = useState<"posts" | "comments">("posts");

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useQuery<any>({
    queryKey: ["/api/admin/feed"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/feed");
      return res.json();
    },
  });

  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = useQuery<any>({
    queryKey: ["/api/admin/comments"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/comments");
      return res.json();
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      await adminFetch(`/api/admin/feed/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Post removed" });
      refetchPosts();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await adminFetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Comment removed" });
      refetchComments();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleString() : "-";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={view === "posts" ? "default" : "outline"} size="sm" onClick={() => setView("posts")} data-testid="button-view-posts">
          Feed Posts ({postsData?.posts?.length || 0})
        </Button>
        <Button variant={view === "comments" ? "default" : "outline"} size="sm" onClick={() => setView("comments")} data-testid="button-view-comments">
          Comments ({commentsData?.comments?.length || 0})
        </Button>
      </div>

      {view === "posts" && (
        postsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Reactions</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(postsData?.posts || []).map((post: any) => (
                <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                  <TableCell className="font-medium">{post.playerName}</TableCell>
                  <TableCell><Badge variant="outline">{post.activityType}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{post.headline}</TableCell>
                  <TableCell>{post.reactionCount}</TableCell>
                  <TableCell>{post.commentCount}</TableCell>
                  <TableCell className="text-sm">{formatDate(post.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this post?")) deletePostMutation.mutate(post.id); }} data-testid={`button-delete-post-${post.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!postsData?.posts || postsData.posts.length === 0) && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No feed posts</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )
      )}

      {view === "comments" && (
        commentsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(commentsData?.comments || []).map((comment: any) => (
                <TableRow key={comment.id} data-testid={`row-comment-${comment.id}`}>
                  <TableCell className="font-medium">{comment.authorName}</TableCell>
                  <TableCell className="max-w-sm truncate">{comment.content}</TableCell>
                  <TableCell>{comment.likeCount}</TableCell>
                  <TableCell className="text-sm">{formatDate(comment.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this comment?")) deleteCommentMutation.mutate(comment.id); }} data-testid={`button-delete-comment-${comment.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!commentsData?.comments || commentsData.comments.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No comments</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )
      )}
    </div>
  );
}

interface RecruiterProfile {
  id: number;
  userId: string;
  schoolName: string;
  division: string;
  title: string;
  schoolEmail: string;
  phone: string | null;
  bio: string | null;
  state: string | null;
  conference: string | null;
  sport: string;
  isVerified: boolean;
  createdAt: string | null;
}

interface CollegeStatus {
  id: number;
  name: string;
  division: string | null;
  conference: string | null;
  espnTeamId: string | null;
  rosterCount: number;
  hasEspnSync: boolean;
}

interface EspnTeamResult {
  espnId: string;
  displayName: string;
  shortName: string;
  abbreviation: string;
  conference: string;
  logoUrl: string;
  sport: string;
}

function EspnLinkDialog({ college, open, onOpenChange, onLinked }: {
  college: CollegeStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searching } = useQuery<{ teams: EspnTeamResult[] }>({
    queryKey: ["/api/admin/espn/search", debouncedQuery],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/espn/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const linkMutation = useMutation({
    mutationFn: async (espnTeamId: string) => {
      const res = await adminFetch(`/api/admin/colleges/${college.id}/espn-link`, {
        method: "PATCH",
        body: JSON.stringify({ espnTeamId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to link");
      }
    },
    onSuccess: () => {
      toast({ title: "Linked", description: `${college.name} is now linked to ESPN.` });
      onLinked();
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link ESPN Team</DialogTitle>
          <DialogDescription>Search for the ESPN team to link to <strong>{college.name}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ESPN teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-espn-search"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {searching && (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
            )}
            {!searching && debouncedQuery.length >= 2 && searchResults?.teams?.length === 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">No ESPN teams found for "{debouncedQuery}"</p>
            )}
            {searchResults?.teams?.map((team) => (
              <div
                key={`${team.sport}-${team.espnId}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-colors"
                data-testid={`espn-team-${team.espnId}`}
              >
                {team.logoUrl && (
                  <img src={team.logoUrl} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{team.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.conference && <span>{team.conference} · </span>}
                    <span className="capitalize">{team.sport}</span>
                    <span className="ml-1 opacity-60">· ID: {team.espnId}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => linkMutation.mutate(team.espnId)}
                  disabled={linkMutation.isPending}
                  data-testid={`button-select-espn-${team.espnId}`}
                >
                  {linkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Select"}
                </Button>
              </div>
            ))}
            {debouncedQuery.length < 2 && !searching && (
              <p className="text-center text-muted-foreground py-6 text-sm">Type at least 2 characters to search</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecruitingTab() {
  const { toast } = useToast();
  const [view, setView] = useState<"recruiters" | "colleges">("recruiters");
  const [linkingCollege, setLinkingCollege] = useState<CollegeStatus | null>(null);

  const { data: recruitersData, isLoading: recruitersLoading, refetch: refetchRecruiters } = useQuery<{ recruiters: RecruiterProfile[] }>({
    queryKey: ["/api/admin/recruiters"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/recruiters");
      return res.json();
    },
  });

  const { data: collegesData, isLoading: collegesLoading, refetch: refetchColleges } = useQuery<{ colleges: CollegeStatus[] }>({
    queryKey: ["/api/admin/colleges/status"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/colleges/status");
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      await adminFetch(`/api/admin/recruiters/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ verified }),
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Recruiter status updated" });
      refetchRecruiters();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const syncRostersMutation = useMutation({
    mutationFn: async () => {
      await adminFetch("/api/colleges/sync-rosters", { method: "POST" });
    },
    onSuccess: () => toast({ title: "Success", description: "Roster sync initiated" }),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const syncEspnMutation = useMutation({
    mutationFn: async () => {
      await adminFetch("/api/colleges/sync-espn", { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "ESPN sync completed" });
      refetchColleges();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (collegeId: number) => {
      const res = await adminFetch(`/api/admin/colleges/${collegeId}/espn-link`, {
        method: "PATCH",
        body: JSON.stringify({ espnTeamId: null }),
      });
      if (!res.ok) throw new Error("Failed to unlink");
    },
    onSuccess: () => {
      toast({ title: "Unlinked", description: "ESPN link removed." });
      refetchColleges();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const recruiters = recruitersData?.recruiters || [];
  const pendingRecruiters = recruiters.filter(r => !r.isVerified);
  const verifiedRecruiters = recruiters.filter(r => r.isVerified);
  const allColleges = collegesData?.colleges || [];
  const linkedCount = allColleges.filter(c => c.hasEspnSync).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button variant={view === "recruiters" ? "default" : "outline"} size="sm" onClick={() => setView("recruiters")} data-testid="button-view-recruiters">
            Recruiters ({recruiters.length})
          </Button>
          <Button variant={view === "colleges" ? "default" : "outline"} size="sm" onClick={() => setView("colleges")} data-testid="button-view-colleges">
            Colleges ({allColleges.length})
          </Button>
        </div>
        {view === "colleges" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{linkedCount}/{allColleges.length} linked</span>
            <Button size="sm" variant="outline" onClick={() => syncRostersMutation.mutate()} disabled={syncRostersMutation.isPending} data-testid="button-sync-rosters">
              <RefreshCw className={`w-4 h-4 mr-1 ${syncRostersMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Rosters
            </Button>
            <Button size="sm" variant="outline" onClick={() => syncEspnMutation.mutate()} disabled={syncEspnMutation.isPending} data-testid="button-sync-espn">
              <RefreshCw className={`w-4 h-4 mr-1 ${syncEspnMutation.isPending ? 'animate-spin' : ''}`} />
              Sync ESPN
            </Button>
          </div>
        )}
      </div>

      {view === "recruiters" && (
        recruitersLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {pendingRecruiters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Pending Verification ({pendingRecruiters.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRecruiters.map((r) => (
                      <TableRow key={r.id} data-testid={`row-pending-recruiter-${r.id}`}>
                        <TableCell className="font-medium">{r.schoolName}</TableCell>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.schoolEmail}</TableCell>
                        <TableCell><Badge variant="outline">{r.division}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.sport}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="default" onClick={() => verifyMutation.mutate({ id: r.id, verified: true })} disabled={verifyMutation.isPending} data-testid={`button-approve-recruiter-${r.id}`}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-green-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verified Recruiters ({verifiedRecruiters.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedRecruiters.map((r) => (
                    <TableRow key={r.id} data-testid={`row-verified-recruiter-${r.id}`}>
                      <TableCell className="font-medium">{r.schoolName}</TableCell>
                      <TableCell>{r.title}</TableCell>
                      <TableCell>{r.schoolEmail}</TableCell>
                      <TableCell><Badge variant="outline">{r.division}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.sport}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Revoke verification for ${r.schoolName}?`)) verifyMutation.mutate({ id: r.id, verified: false }); }} data-testid={`button-revoke-recruiter-${r.id}`}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {verifiedRecruiters.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No verified recruiters</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      )}

      {view === "colleges" && (
        collegesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Conference</TableHead>
                <TableHead>ESPN Sync</TableHead>
                <TableHead>Roster Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allColleges.map((col) => (
                <TableRow key={col.id} data-testid={`row-college-${col.id}`}>
                  <TableCell className="font-medium">{col.name}</TableCell>
                  <TableCell><Badge variant="outline">{col.division || "-"}</Badge></TableCell>
                  <TableCell>{col.conference || "-"}</TableCell>
                  <TableCell>
                    {col.hasEspnSync ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="default" className="bg-green-600">Linked</Badge>
                        <span className="text-xs text-muted-foreground">ID: {col.espnTeamId}</span>
                      </div>
                    ) : (
                      <Badge variant="secondary">Not linked</Badge>
                    )}
                  </TableCell>
                  <TableCell>{col.rosterCount}</TableCell>
                  <TableCell className="text-right">
                    {col.hasEspnSync ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => { if (confirm(`Unlink ESPN from ${col.name}?`)) unlinkMutation.mutate(col.id); }}
                        disabled={unlinkMutation.isPending}
                        data-testid={`button-unlink-espn-${col.id}`}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Unlink
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLinkingCollege(col)}
                        data-testid={`button-link-espn-${col.id}`}
                      >
                        <Link2 className="w-4 h-4 mr-1" />
                        Link ESPN
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {allColleges.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No colleges found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )
      )}

      {linkingCollege && (
        <EspnLinkDialog
          college={linkingCollege}
          open={!!linkingCollege}
          onOpenChange={(open) => !open && setLinkingCollege(null)}
          onLinked={() => refetchColleges()}
        />
      )}
    </div>
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
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="flex flex-wrap w-full bg-card border border-border gap-1 h-auto p-1">
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="roster" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-roster">
              <UserCog className="w-4 h-4" />
              Roster
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-users">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-moderation">
              <MessageSquare className="w-4 h-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="recruiting" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-recruiting">
              <GraduationCap className="w-4 h-4" />
              Recruiting
            </TabsTrigger>
            <TabsTrigger value="guardians" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-guardians">
              <Shield className="w-4 h-4" />
              Guardians
            </TabsTrigger>
            <TabsTrigger value="seasons" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-seasons">
              <Calendar className="w-4 h-4" />
              Seasons
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-activity">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-badges">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="rankings" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-rankings">
              <Crown className="w-4 h-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="state" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-state">
              <Trophy className="w-4 h-4" />
              Awards
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-products">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-coupons">
              <Tag className="w-4 h-4" />
              Coupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Overview of platform health, activity, and growth</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsTab />
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, search, and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review and manage feed posts and comments</CardDescription>
              </CardHeader>
              <CardContent>
                <ModerationTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recruiting">
            <Card>
              <CardHeader>
                <CardTitle>Recruiting Management</CardTitle>
                <CardDescription>Verify recruiters and manage college data</CardDescription>
              </CardHeader>
              <CardContent>
                <RecruitingTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guardians">
            <Card>
              <CardHeader>
                <CardTitle>Guardian Management</CardTitle>
                <CardDescription>Manage guardian-player links, approvals, and revocations</CardDescription>
              </CardHeader>
              <CardContent>
                <GuardianManagementTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seasons">
            <Card>
              <CardHeader>
                <CardTitle>Season Management</CardTitle>
                <CardDescription>Create and manage seasons for the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <SeasonManagementTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>Recent platform activity and events</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeedTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Caliber Badges</CardTitle>
                <CardDescription>Award special recognition badges to outstanding players</CardDescription>
              </CardHeader>
              <CardContent>
                <CaliberBadgesTabWrapper />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <CardTitle>State Rankings</CardTitle>
                <CardDescription>Assign state rankings to players (e.g., #1 in MT, #5 in CA)</CardDescription>
              </CardHeader>
              <CardContent>
                <StateRankingsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="state">
            <Card>
              <CardHeader>
                <CardTitle>State Awards</CardTitle>
                <CardDescription>Give official state recognitions like All-State, Player of the Year, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <StateAwardsTab />
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
