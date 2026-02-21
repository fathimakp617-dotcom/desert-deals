import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Loader2, Eye, Globe, TrendingUp, ExternalLink, ShieldBan, BarChart3 } from "lucide-react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 24%))",
  "hsl(var(--chart-4, 43 74% 66%))",
  "hsl(var(--chart-5, 27 87% 67%))",
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1",
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

const AdminAnalytics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("7d");

  const dateFrom = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "1d": return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, [dateRange]);

  const { data, isLoading } = useQuery({
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { total_views = 0, top_products = [], sources = [], countries = [], daily_views = [], top_pages = [], blocked_countries = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track visitor behavior and traffic sources</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <a
            href="https://clarity.microsoft.com/projects/view/vkri0s8s8o/dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Clarity
            </Button>
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{total_views.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{top_products.length}</p>
                <p className="text-xs text-muted-foreground">Products Viewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{countries.length}</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{sources.length}</p>
                <p className="text-xs text-muted-foreground">Traffic Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="geo">Geo & Blocking</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Page Views</CardTitle></CardHeader>
            <CardContent>
              {daily_views.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={daily_views}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet. Views will appear as visitors browse your site.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top_pages.map((p: any) => (
                    <TableRow key={p.page}>
                      <TableCell className="font-mono text-xs">{p.page}</TableCell>
                      <TableCell className="text-right">{p.count}</TableCell>
                    </TableRow>
                  ))}
                  {top_pages.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Most Viewed Products</CardTitle></CardHeader>
            <CardContent>
              {top_products.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={top_products.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {top_products.map((p: any, i: number) => (
                        <TableRow key={p.product_id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {p.image && (
                              <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            <span className="text-sm">{p.name}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{p.views}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No product views yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
              <CardContent>
                {sources.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sources.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }: any) => `${source} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
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
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Source Details</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((s: any) => (
                      <TableRow key={s.source}>
                        <TableCell className="text-sm">{s.source}</TableCell>
                        <TableCell className="text-right">{s.count}</TableCell>
                      </TableRow>
                    ))}
                    {sources.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geo & Blocking Tab */}
        <TabsContent value="geo" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Visitor Countries</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.map((c: any) => (
                      <TableRow key={c.country}>
                        <TableCell className="text-sm">{c.country}</TableCell>
                        <TableCell className="text-right">{c.count}</TableCell>
                      </TableRow>
                    ))}
                    {countries.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldBan className="h-4 w-4" />
                  Blocked Countries (EU)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Toggle to enable/disable blocking for each country. Blocked visitors see a blank page.
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
