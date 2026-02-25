import { useState, useEffect, memo } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Package, LayoutDashboard, LogOut, ArrowLeft, Mail, Lock, Loader2, Shield, Users, User, RotateCcw, Star, ShoppingBag, Upload, ImageOff, Tags, BarChart3, Image, LayoutTemplate } from "lucide-react";
import InstallAppBanner from "@/components/InstallAppBanner";
import { motion } from "framer-motion";

const ADMIN_SESSION_KEY = "rayn_admin_session";

interface AdminSession {
  token: string;
  email: string;
  expiry: string | number;
  role?: string;
}

const AdminLayout = () => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check existing session on mount only
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (stored) {
        const session: AdminSession = JSON.parse(stored);
        if (new Date(session.expiry) > new Date()) {
          setAdminSession(session);
        } else {
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setIsChecking(false);
  }, []);

  // Listen for session expiry events from useAdminData hooks
  useEffect(() => {
    const handleSessionExpired = () => {
      setAdminSession(null);
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      });
    };
    window.addEventListener("admin-session-expired", handleSessionExpired);
    return () => window.removeEventListener("admin-session-expired", handleSessionExpired);
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-password", {
        body: { email: email.trim(), password },
      });

      if (error) throw error;

      if (data.success) {
        // Check if user is a shipping user - redirect them to shipping dashboard
        if (data.role === "shipping") {
          toast({
            title: "Shipping Account",
            description: "Redirecting to shipping dashboard...",
          });
          navigate("/shipping");
          return;
        }
        
        // Only allow admin role to access admin dashboard
        if (data.role !== "admin") {
          throw new Error("Admin access required");
        }

        const session: AdminSession = {
          token: data.session_token,
          email: data.email,
          expiry: data.session_expiry,
          role: data.role,
        };
        // Use sessionStorage - admin session ends when browser closes
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        setAdminSession(session);
        toast({
          title: "Welcome, Admin",
          description: "You have successfully logged in",
        });
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminSession(null);
    setEmail("");
    setPassword("");
    navigate("/");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!adminSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Admin Access</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your admin credentials to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="admin_email">Admin Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin_password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin_password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <Button
                variant="link"
                className="text-muted-foreground text-sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Store
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin is authenticated - show dashboard
  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Products", url: "/admin/products", icon: ShoppingBag },
    { title: "Orders", url: "/admin/orders", icon: Package },
    { title: "Returns", url: "/admin/returns", icon: RotateCcw },
    { title: "Reviews", url: "/admin/reviews", icon: Star },
    { title: "Customers", url: "/admin/customers", icon: Users },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Bulk Import", url: "/admin/bulk-import", icon: Upload },
    { title: "Categories", url: "/admin/categories", icon: Tags },
    { title: "Banners", url: "/admin/banners", icon: Image },
    { title: "Sections", url: "/admin/sections", icon: LayoutDashboard },
    { title: "Page Builder", url: "/admin/page-builder", icon: LayoutTemplate },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarContent className="pt-4">
            {/* Logo/Brand */}
            <div className="px-4 py-4 mb-4">
              <Link to="/" className="block">
                <h1 className="text-xl font-heading font-bold text-primary">DESERT DEAL</h1>
              </Link>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.url}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                            isActive(item.url)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Install App Banner */}
            <div className="px-3 py-2">
              <InstallAppBanner />
            </div>

            {/* Bottom Actions - Admin Profile & Logout */}
            <div className="mt-auto px-3 py-4 border-t border-border space-y-2">
              <Link
                to="/admin/account"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive("/admin/account")
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">My Account</p>
                  <p className="text-xs text-muted-foreground truncate">{adminSession.email}</p>
                </div>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <nav className="text-sm text-muted-foreground">
              Admin Panel
            </nav>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default memo(AdminLayout);
