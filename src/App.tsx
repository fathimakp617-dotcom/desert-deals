import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CouponProvider } from "@/contexts/CouponContext";

import { AuthProvider } from "@/contexts/AuthContext";
import { DirectionProvider } from "@/contexts/DirectionContext";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";


// Eagerly load critical pages
import Index from "./pages/Index";

// Lazy load non-critical pages with prefetch hints
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CancellationRefundPolicy = lazy(() => import("./pages/CancellationRefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));

// Prefetch Shop page when user is on homepage
const usePrefetchRoutes = () => {
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname === "/") {
      // Prefetch Shop page after initial load
      const timer = setTimeout(() => {
        import("./pages/Shop");
        import("./pages/ProductDetail");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);
};

// Admin pages - all lazy loaded for faster initial load
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAccount = lazy(() => import("./pages/admin/AdminAccount"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminBulkImport = lazy(() => import("./pages/admin/AdminBulkImport"));
const AdminImageFix = lazy(() => import("./pages/admin/AdminImageFix"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));


// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Route prefetcher component
const RoutePrefetcher = () => {
  usePrefetchRoutes();
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes - data stays fresh longer
      gcTime: 20 * 60 * 1000, // 20 minutes cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <DirectionProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CouponProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <CartDrawer />
                  
                  <RoutePrefetcher />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
                      <Route path="/refund-policy" element={<CancellationRefundPolicy />} />
                      <Route path="/cancellation-policy" element={<CancellationRefundPolicy />} />
                      <Route path="/shipping-policy" element={<ShippingPolicy />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="customers" element={<AdminCustomers />} />
                        <Route path="account" element={<AdminAccount />} />
                        <Route path="returns" element={<AdminReturns />} />
                        <Route path="reviews" element={<AdminReviewsPage />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="bulk-import" element={<AdminBulkImport />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="fix-images" element={<AdminImageFix />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </CouponProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </DirectionProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
