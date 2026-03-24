import { useState, useMemo, memo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2, ExternalLink, ShieldBan, RefreshCw, Globe,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getCountryLatLng } from "@/lib/countryCoords";

const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (session.expiry > Date.now()) return session;
  } catch { return null; }
  return null;
};

const formatCurrency = (val: number) => `AED ${Math.round(val).toLocaleString()}`;
const formatCompact = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString();
};

// Auto-fit map to show all markers
const MapBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const L = (window as any).L;
      if (L && positions.length > 1) {
        const bounds = L.latLngBounds(positions.map(([lat, lng]: [number, number]) => [lat, lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      } else if (positions.length === 1) {
        map.setView(positions[0], 5);
      }
    }
  }, [positions, map]);
  return null;
};

const AdminAnalytics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState<"live" | "reports">("live");

  const dateFrom = useMemo(() => {
    const now = new Date();
    const ms: Record<string, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90, "365d": 365 };
    return new Date(now.getTime() - (ms[dateRange] || 7) * 86400000).toISOString();
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
      if (data?.error === "Invalid session" || data?.error === "Unauthorized") {
        window.dispatchEvent(new Event("admin-session-expired"));
        throw new Error("Session expired");
      }
      return data;
    },
    refetchInterval: 15000,
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const {
    live_visitors = 0, live_carts = 0,
    total_sales = 0, total_orders = 0,
    add_to_cart_count = 0, checkout_count = 0,
    total_sessions = 0, total_views = 0,
    returning_count = 0, new_customer_count = 0,
    top_products = [], top_products_by_sales = [],
    sources = [], countries = [],
    daily_views = [], daily_sales = [],
    top_pages = [], blocked_countries = [],
  } = data || {};

  const sessionSparkData = (daily_views || []).map((d: any) => ({ v: d.count || 0 }));
  const salesSparkData = (daily_sales || []).map((d: any) => ({ v: d.revenue || 0 }));
  const ordersSparkData = (daily_sales || []).map((d: any) => ({ v: d.orders || 0 }));

  const maxCountry = countries.length > 0 ? countries[0].count : 1;

  // Map markers from real country data
  const mapMarkers = (countries || [])
    .map((c: any) => {
      const coords = getCountryLatLng(c.country);
      if (!coords) return null;
      return { lat: coords[0], lng: coords[1], country: c.country, count: c.count };
    })
    .filter(Boolean) as { lat: number; lng: number; country: string; count: number }[];

  const mapPositions = mapMarkers.map(m => [m.lat, m.lng] as [number, number]);
  const maxCount = mapMarkers.length > 0 ? Math.max(...mapMarkers.map(m => m.count)) : 1;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-card px-0">
        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "live"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Live View
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "reports"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reports
        </button>
        <div className="ml-auto flex items-center gap-1 pr-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <a href="https://clarity.microsoft.com/projects/view/vkri0s8s8o/dashboard" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* ===================== LIVE VIEW ===================== */}
      {activeTab === "live" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left scrollable panel */}
          <div className="w-full max-w-[520px] border-r border-border overflow-y-auto bg-background">
            <div className="p-5 space-y-4">
              {/* Live View header */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h1 className="text-lg font-semibold text-foreground">Live View</h1>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground">Just now</span>
              </div>

              {/* 2x2 stat boxes */}
              <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border border-border">
                <div className="bg-card p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Visitors right now</p>
                  <p className="text-2xl font-semibold text-foreground">{live_visitors}</p>
                </div>
                <div className="bg-card p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Total sales</p>
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(total_sales)}</p>
                    {salesSparkData.length > 1 && (
                      <div className="w-16 h-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={salesSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Area type="monotone" dataKey="v" stroke="#b4bcec" strokeWidth={1} fill="none" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-semibold text-foreground">{formatCompact(total_sessions)}</p>
                      <span className="text-xs text-muted-foreground">—</span>
                    </div>
                    {sessionSparkData.length > 1 && (
                      <div className="w-16 h-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sessionSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Area type="monotone" dataKey="v" stroke="#b4bcec" strokeWidth={1} fill="none" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Orders</p>
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-semibold text-foreground">{total_orders}</p>
                      <span className="text-xs text-muted-foreground">—</span>
                    </div>
                    {ordersSparkData.length > 1 && (
                      <div className="w-16 h-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={ordersSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Area type="monotone" dataKey="v" stroke="#b4bcec" strokeWidth={1} fill="none" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer behavior */}
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Customer behavior</h3>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Active carts</p>
                    <p className="text-xl font-semibold text-foreground">{live_carts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Checking out</p>
                    <p className="text-xl font-semibold text-foreground">{checkout_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Purchased</p>
                    <p className="text-xl font-semibold text-foreground">{total_orders}</p>
                  </div>
                </div>
                <div className="h-[70px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { x: 0, v: live_carts },
                        { x: 1, v: Math.max(live_carts * 0.8, checkout_count) },
                        { x: 2, v: Math.max(checkout_count, total_orders) },
                        { x: 3, v: total_orders },
                        { x: 4, v: 0 },
                      ]}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="behaviorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4d68e4" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#4d68e4" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <Area type="stepAfter" dataKey="v" stroke="#4d68e4" strokeWidth={0} fill="url(#behaviorGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sessions by location */}
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sessions by location</h3>
                {countries.length > 0 ? (
                  <div className="space-y-3">
                    {countries.slice(0, 8).map((c: any) => (
                      <div key={c.country}>
                        <p className="text-xs text-muted-foreground mb-1">{c.country}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-7 bg-muted rounded overflow-hidden">
                            <div
                              className="h-full rounded"
                              style={{
                                width: `${Math.max((c.count / maxCountry) * 100, 5)}%`,
                                backgroundColor: "#36a3f7",
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground min-w-[20px] text-right">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">No data for this date range</p>
                )}
              </div>

              {/* New vs returning customers */}
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">New vs returning customers</h3>
                {total_orders > 0 ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New customers</span>
                      <span className="font-medium text-foreground">{total_orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Returning customers</span>
                      <span className="font-medium text-foreground">0</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">No data for this date range</p>
                )}
              </div>

              {/* Total sales by product */}
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Total sales by product</h3>
                {top_products_by_sales.length > 0 ? (
                  <div className="space-y-3">
                    {top_products_by_sales.slice(0, 5).map((p: any) => (
                      <div key={p.product_id} className="flex items-center gap-3">
                        {p.image && (
                          <img src={p.image} alt="" className="w-9 h-9 rounded object-contain bg-white border border-border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.units_sold} sold</p>
                        </div>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">
                          {formatCurrency(p.revenue || p.price * p.units_sold)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">No data for this date range</p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - REAL Leaflet Map */}
          <div className="flex-1 relative overflow-hidden hidden md:block">
            <MapContainer
              center={[25, 45]}
              zoom={3}
              scrollWheelZoom={true}
              zoomControl={false}
              attributionControl={false}
              className="h-full w-full"
              style={{ background: "#f0f4f8" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              />
              <MapBounds positions={mapPositions} />
              {mapMarkers.map((marker, i) => {
                const radius = Math.max(6, Math.min(25, (marker.count / maxCount) * 25));
                return (
                  <CircleMarker
                    key={marker.country}
                    center={[marker.lat, marker.lng]}
                    radius={radius}
                    pathOptions={{
                      fillColor: "#36a3f7",
                      fillOpacity: 0.6,
                      color: "#36a3f7",
                      weight: 2,
                      opacity: 0.8,
                    }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -radius]}>
                      <div className="text-xs">
                        <strong>{marker.country}</strong>
                        <br />
                        {marker.count.toLocaleString()} sessions
                      </div>
                    </LeafletTooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground z-[1000]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
                <span>Orders</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#36a3f7" }} />
                <span>Visitors right now</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== REPORTS TAB ===================== */}
      {activeTab === "reports" && (
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-5xl mx-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-foreground">Reports</h1>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
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
            </div>

            {/* Sales & Sessions */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-4">
                <p className="text-xs text-muted-foreground mb-0.5">Total sales</p>
                <p className="text-xl font-semibold text-foreground mb-3">{formatCurrency(total_sales)}</p>
                {daily_sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={daily_sales}>
                      <defs>
                        <linearGradient id="salesG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5c6ac4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#5c6ac4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => formatCompact(v)} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="revenue" stroke="#5c6ac4" strokeWidth={2} fill="url(#salesG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground text-center py-10">No data</p>}
              </div>
              <div className="border border-border rounded-lg bg-card p-4">
                <p className="text-xs text-muted-foreground mb-0.5">Online store sessions</p>
                <p className="text-xl font-semibold text-foreground mb-3">{formatCompact(total_sessions)}</p>
                {daily_views.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={daily_views}>
                      <defs>
                        <linearGradient id="sessG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5c6ac4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#5c6ac4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#5c6ac4" strokeWidth={2} fill="url(#sessG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground text-center py-10">No data</p>}
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="border border-border rounded-lg bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Online store conversion rate</h3>
              <div className="space-y-3">
                {[
                  { label: "Sessions", value: total_sessions, pct: 100 },
                  { label: "Added to cart", value: add_to_cart_count, pct: total_sessions > 0 ? (add_to_cart_count / total_sessions) * 100 : 0 },
                  { label: "Reached checkout", value: checkout_count, pct: total_sessions > 0 ? (checkout_count / total_sessions) * 100 : 0 },
                  { label: "Sessions converted", value: total_orders, pct: total_sessions > 0 ? (total_orders / total_sessions) * 100 : 0 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">
                        {item.value.toLocaleString()}
                        <span className="text-muted-foreground text-xs ml-1">({item.pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(item.pct, 0.5)}%`, backgroundColor: "#5c6ac4" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Top products by units sold</h3>
                {top_products_by_sales.length > 0 ? (
                  <div className="space-y-2.5">
                    {top_products_by_sales.slice(0, 8).map((p: any, i: number) => (
                      <div key={p.product_id} className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-contain bg-white border border-border" />}
                        <p className="text-sm flex-1 text-foreground truncate">{p.name}</p>
                        <span className="text-sm font-medium text-foreground">{p.units_sold}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-5">No data</p>}
              </div>
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Top products by page views</h3>
                {top_products.length > 0 ? (
                  <div className="space-y-2.5">
                    {top_products.slice(0, 8).map((p: any, i: number) => (
                      <div key={p.product_id} className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-contain bg-white border border-border" />}
                        <p className="text-sm flex-1 text-foreground truncate">{p.name}</p>
                        <span className="text-sm font-medium text-foreground">{p.views}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-5">No data</p>}
              </div>
            </div>

            {/* Traffic sources */}
            <div className="border border-border rounded-lg bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Traffic sources</h3>
              {sources.length > 0 ? (
                <div className="space-y-2">
                  {sources.map((s: any) => {
                    const pct = total_views > 0 ? (s.count / total_views) * 100 : 0;
                    return (
                      <div key={s.source} className="flex items-center gap-3">
                        <span className="text-sm flex-1 text-foreground">{s.source}</span>
                        <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: "#5c6ac4" }} />
                        </div>
                        <span className="text-sm font-medium text-foreground w-10 text-right">{s.count}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-5">No data</p>}
            </div>

            {/* Top pages */}
            <div className="border border-border rounded-lg bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top landing pages</h3>
              <div className="space-y-1.5">
                {top_pages.slice(0, 10).map((p: any) => (
                  <div key={p.page} className="flex items-center gap-3 text-sm py-1">
                    <span className="flex-1 text-foreground font-mono text-xs truncate">{p.page}</span>
                    <span className="font-medium text-foreground">{p.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {total_views > 0 ? ((p.count / total_views) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
                {top_pages.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No data</p>}
              </div>
            </div>

            {/* Geo & blocking */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sessions by location</h3>
                {countries.length > 0 ? (
                  <div className="space-y-3">
                    {countries.slice(0, 10).map((c: any) => (
                      <div key={c.country}>
                        <p className="text-xs text-muted-foreground mb-1">{c.country}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                            <div className="h-full rounded" style={{ width: `${Math.max((c.count / maxCountry) * 100, 5)}%`, backgroundColor: "#36a3f7" }} />
                          </div>
                          <span className="text-xs font-medium text-foreground w-8 text-right">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-3">No data</p>}
              </div>
              <div className="border border-border rounded-lg bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ShieldBan className="h-4 w-4" /> Blocked countries
                </h3>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {blocked_countries.map((bc: any) => (
                    <div key={bc.country_code} className="flex items-center justify-between py-1.5 px-1 rounded hover:bg-muted/50">
                      <span className="text-sm text-foreground">{bc.country_name} ({bc.country_code})</span>
                      <Switch
                        checked={bc.is_active}
                        onCheckedChange={(checked) => toggleBlockMutation.mutate({ country_code: bc.country_code, is_active: checked })}
                      />
                    </div>
                  ))}
                  {blocked_countries.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No blocked countries</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AdminAnalytics);
