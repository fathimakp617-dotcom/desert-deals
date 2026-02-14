import { useState, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Heart, User, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const announcements = [
  "COD Available Across the UAE →",
  "Free Shipping on All Orders →",
  "Premium Shoes & Accessories →",
];

// Exact nav menu from original HTML
const menuLinks = [
  { name: "All Shoes", href: "/shop" },
  { name: "Nike", href: "/shop?brand=nike" },
  { name: "Running Shoes", href: "/shop?brand=running" },
  { name: "On Cloud", href: "/shop?brand=on-cloud" },
  { name: "All Products", href: "/shop" },
  { name: "Jordan", href: "/shop?brand=jordan" },
  { name: "New Balance", href: "/shop?brand=new-balance" },
  { name: "Asics", href: "/shop?brand=asics" },
  { name: "Adidas", href: "/shop?brand=adidas" },
  { name: "Hoka", href: "/shop?brand=hoka" },
  { name: "Onitsuka Tiger", href: "/shop?brand=onitsuka-tiger" },
  { name: "Puma", href: "/shop?brand=puma" },
  { name: "Loro Piana", href: "/shop?brand=loro-piana" },
  { name: "Louis Vuitton", href: "/shop?brand=louis-vuitton" },
  { name: "Brooks", href: "/shop?brand=brooks" },
  { name: "Hermes", href: "/shop?brand=hermes" },
  { name: "About Us", href: "/#about" },
  { name: "Reviews", href: "/#collection" },
];

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistItems } = useWishlist();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Announcement Bar - not present in original HTML header but keep for consistency */}

      {/* Main Header - matches site-header header-type1 sticky-header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Mobile: hamburger menu */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-foreground"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Logo - matches site-brand */}
            <Link to="/" className="flex items-center">
              <span className="text-lg sm:text-xl font-heading font-bold tracking-tight text-foreground uppercase">
                DESERT DEAL
              </span>
            </Link>

            {/* Desktop nav - matches site-nav site-menu (wrapping) */}
            <div className="hidden lg:flex items-center flex-wrap gap-x-5 gap-y-1 max-w-[700px] xl:max-w-[900px]">
              {menuLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-[13px] text-foreground hover:opacity-60 transition-opacity whitespace-nowrap leading-[40px]"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Action icons - matches site-actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <Link
                to="/shop"
                className="hidden sm:flex p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <Search size={20} />
              </Link>

              {/* Wishlist - matches wishlist-toggle */}
              <Link
                to="/wishlist"
                className="relative p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <Heart size={20} />
                {wishlistItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full">
                    {wishlistItems}
                  </span>
                )}
              </Link>

              {/* Cart - matches cart-toggle with custom SVG */}
              <button
                onClick={() => openCart()}
                className="relative p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Account - desktop */}
              <Link
                to="/account"
                className="hidden md:flex p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <User size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu - matches site-drawer menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background border-t border-border max-h-[70vh] overflow-y-auto"
            >
              <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
                {menuLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-foreground hover:opacity-60 transition-opacity py-1"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-border pt-3 mt-1">
                  <Link
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-sm text-foreground hover:opacity-60 transition-opacity"
                  >
                    <User size={16} />
                    My Account
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
