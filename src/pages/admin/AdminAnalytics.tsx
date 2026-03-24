import { useState, useMemo, memo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Loader2, Eye, Globe, TrendingUp, ExternalLink, ShieldBan, BarChart3,
  ShoppingCart, DollarSign, Users, ArrowUpRight, ArrowDownRight,
  Activity, Package, RefreshCw, Zap, MousePointerClick,
} from "lucide-react";
import { motion } from "framer-motion";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#22c55e", "#f59e0b", "#3b82f6", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (session.expiry > Date.now()) return session;
  } catch { return null; }
  return null;
};

const formatCurrency = (val: number) => `${Math.round(val).toLocaleString()} AED`;
const formatPercent = (val: number) => `${val.toFixed(1)}%`;
const formatCompact = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString();
};

// Metric card component
const MetricCard = ({
  title, value, icon: Icon, trend, subtitle, color = "text-primary", pulse = false,
}: {
  title: string; value: string; icon: any; trend?: string; subtitle?: string;
  color?: string; pulse?: boolean;
}) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-muted/80 ${pulse ? "animate-pulse" : ""}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span>{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// Live badge
const LiveDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
  </span>
);

// Conversion funnel bar
const FunnelBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toLocaleString()} <span className="text-muted-foreground text-xs">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  const dateFrom = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "1d": return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case "365d": return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, [dateRange]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-analytics", dateRange],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("get-analytics", {
        body: { admin_email: session.email, admin_token: session.token, date_from: dateFrom },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh every 30s for live data
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ country_code, is_active }: { country_code: string; is_active: boolean }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { error } = await supabase.functions.invoke("manage-blocked-countries", {
        body: { action: "toggle", country_code, is_active, admin_email: session.email, admin_token: session.token },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      toast({ title: "Country block updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const {
    live_visitors = 0, live_carts = 0,
    total_sales = 0, total_orders = 0, average_order_value = 0,
    conversion_rate = 0, add_to_cart_rate = 0, add_to_cart_count = 0,
    checkout_count = 0, returning_customer_rate = 0,
    total_sessions = 0, total_views = 0,
    top_products = [], top_products_by_sales = [],
    sources = [], countries = [],
    daily_views = [], daily_sales = [],
    top_pages = [], blocked_countries = [],
  } = data || {};

  const dateLabels: Record<string, string> = {
    "1d": "Last 24 hours",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "365d": "Last 12 months",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">{dateLabels[dateRange] || "Last 7 days"}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <a href="https://clarity.microsoft.com/projects/view/vkri0s8s8o/dashboard" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" /> Clarity
            </Button>
          </a>
        </div>
      </div>

      {/* Live View Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <LiveDot />
            <span className="text-sm font-medium text-foreground">Live View</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-foreground">{live_visitors}</span>
              <span className="text-xs text-muted-foreground">visitors online</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-500" />
              <span className="text-lg font-bold text-foreground">{live_carts}</span>
              <span className="text-xs text-muted-foreground">active carts</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid - Shopify style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Sales"
          value={formatCurrency(total_sales)}
          icon={DollarSign}
          color="text-green-500"
          subtitle={`${total_orders} orders`}
        />
        <MetricCard
          title="Sessions"
          value={formatCompact(total_sessions)}
          icon={Eye}
          color="text-blue-500"
          subtitle={`${formatCompact(total_views)} page views`}
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercent(conversion_rate)}
          icon={TrendingUp}
          color="text-purple-500"
          subtitle={`${total_orders} orders from ${formatCompact(total_sessions)} sessions`}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(average_order_value)}
          icon={Package}
          color="text-orange-500"
        />
        <MetricCard
          title="Returning Rate"
          value={formatPercent(returning_customer_rate)}
          icon={Users}
          color="text-cyan-500"
          subtitle="returning customers"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="geo">Geo & Blocking</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Sales Over Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(total_sales)}</p>
              </CardHeader>
              <CardContent>
                {daily_sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={daily_sales}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Date: ${l}`} />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#salesGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No sales data for this period</p>
                )}
              </CardContent>
            </Card>

            {/* Sessions Over Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Online Store Sessions</CardTitle>
                <p className="text-2xl font-bold text-foreground">{formatCompact(total_sessions)}</p>
              </CardHeader>
              <CardContent>
                {daily_views.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={daily_views}>
                      <defs>
                        <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#sessionsGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No session data yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FunnelBar label="Sessions" value={total_sessions} total={total_sessions} color="#3b82f6" />
              <FunnelBar label="Added to Cart" value={add_to_cart_count} total={total_sessions} color="#f59e0b" />
              <FunnelBar label="Reached Checkout" value={checkout_count} total={total_sessions} color="#8b5cf6" />
              <FunnelBar label="Purchased" value={total_orders} total={total_sessions} color="#22c55e" />
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top_pages.slice(0, 10).map((p: any) => (
                    <TableRow key={p.page}>
                      <TableCell className="font-mono text-xs">{p.page}</TableCell>
                      <TableCell className="text-right">{p.count.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {total_views > 0 ? ((p.count / total_views) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {top_pages.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top by Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Products by Units Sold</CardTitle>
              </CardHeader>
              <CardContent>
                {top_products_by_sales.length > 0 ? (
                  <div className="space-y-3">
                    {top_products_by_sales.slice(0, 10).map((p: any, i: number) => (
                      <div key={p.product_id} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                        {p.image && (
                          <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(p.price)}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {p.units_sold} sold
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top by Views */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Products by Views</CardTitle>
              </CardHeader>
              <CardContent>
                {top_products.length > 0 ? (
                  <div className="space-y-3">
                    {top_products.slice(0, 10).map((p: any, i: number) => (
                      <div key={p.product_id} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                        {p.image && (
                          <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.units_sold > 0 ? `${p.units_sold} sold` : "—"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-foreground">{p.views}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No product views yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Products chart */}
          {top_products_by_sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Units Sold - Top 10</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top_products_by_sales.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="units_sold" fill="#22c55e" radius={[0, 4, 4, 0]} name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TRAFFIC */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {sources.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sources.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="source"
                      >
                        {sources.slice(0, 8).map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No traffic data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sources.map((s: any, i: number) => {
                    const pct = total_views > 0 ? ((s.count / total_views) * 100).toFixed(1) : "0";
                    return (
                      <div key={s.source} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm flex-1 text-foreground">{s.source}</span>
                        <span className="text-sm font-medium text-foreground">{s.count.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                  {sources.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BEHAVIOR */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Add to Cart Rate"
              value={formatPercent(add_to_cart_rate)}
              icon={ShoppingCart}
              color="text-orange-500"
              subtitle={`${add_to_cart_count} sessions`}
            />
            <MetricCard
              title="Checkout Rate"
              value={total_sessions > 0 ? formatPercent((checkout_count / total_sessions) * 100) : "0%"}
              icon={MousePointerClick}
              color="text-purple-500"
              subtitle={`${checkout_count} sessions`}
            />
            <MetricCard
              title="Purchase Rate"
              value={formatPercent(conversion_rate)}
              icon={DollarSign}
              color="text-green-500"
              subtitle={`${total_orders} orders`}
            />
            <MetricCard
              title="Cart Abandonment"
              value={add_to_cart_count > 0 ? formatPercent(((add_to_cart_count - total_orders) / add_to_cart_count) * 100) : "0%"}
              icon={ShoppingCart}
              color="text-red-500"
              subtitle={`${Math.max(0, add_to_cart_count - total_orders)} abandoned`}
            />
          </div>

          {/* Funnel again in detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shopping Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FunnelBar label="All Sessions" value={total_sessions} total={total_sessions} color="#3b82f6" />
              <FunnelBar label="Added to Cart" value={add_to_cart_count} total={total_sessions} color="#f59e0b" />
              <FunnelBar label="Reached Checkout" value={checkout_count} total={total_sessions} color="#8b5cf6" />
              <FunnelBar label="Completed Purchase" value={total_orders} total={total_sessions} color="#22c55e" />
            </CardContent>
          </Card>

          {/* Orders chart */}
          {daily_sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Orders Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daily_sales}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GEO & BLOCKING */}
        <TabsContent value="geo" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visitor Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {countries.map((c: any, i: number) => {
                    const pct = total_views > 0 ? ((c.count / total_views) * 100).toFixed(1) : "0";
                    return (
                      <div key={c.country} className="flex items-center gap-3 py-1.5">
                        <span className="text-sm flex-1 text-foreground">{c.country}</span>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(parseFloat(pct), 2)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-16 text-right">{c.count.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                  {countries.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No geo data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldBan className="h-4 w-4" />
                  Blocked Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Toggle to block visitors from specific countries.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {blocked_countries.map((bc: any) => (
                    <div key={bc.country_code} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                      <span className="text-sm">{bc.country_name} ({bc.country_code})</span>
                      <Switch
                        checked={bc.is_active}
                        onCheckedChange={(checked) =>
                          toggleBlockMutation.mutate({ country_code: bc.country_code, is_active: checked })
                        }
                      />
                    </div>
                  ))}
                  {blocked_countries.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No blocked countries configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(AdminAnalytics);
