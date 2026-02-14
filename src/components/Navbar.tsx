import { useState, memo, useEffect, useRef } from "react";
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

const brandLinks = [
  { name: "All Shoes", href: "/shop" },
  { name: "Nike", href: "/shop?category=nike" },
  { name: "Jordan", href: "/shop?category=jordan" },
  { name: "Adidas", href: "/shop?category=adidas" },
  { name: "New Balance", href: "/shop?category=new-balance" },
  { name: "On Cloud", href: "/shop?category=on-cloud" },
  { name: "Running Shoes", href: "/shop?category=running" },
  { name: "Hoka", href: "/shop?category=hoka" },
  { name: "Asics", href: "/shop?category=asics" },
  { name: "Puma", href: "/shop?category=puma" },
  { name: "About Us", href: "/#about" },
];

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const brandScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-foreground text-background">
        <div className="flex items-center justify-center h-9 px-4">
          <button
            onClick={() => setAnnouncementIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={14} />
          </button>
          <AnimatePresence mode="wait">
            <motion.p
              key={announcementIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-xs tracking-wide mx-6 text-center"
            >
              {announcements[announcementIndex]}
            </motion.p>
          </AnimatePresence>
          <button
            onClick={() => setAnnouncementIndex((prev) => (prev + 1) % announcements.length)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-14">
            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-foreground"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Logo - centered on mobile */}
            <Link to="/" className="flex items-center">
              <span className="text-lg md:text-xl font-heading font-bold tracking-tight text-foreground uppercase">
                DESERT DEAL
              </span>
            </Link>

            {/* Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search - desktop only */}
              <Link
                to="/shop"
                className="hidden md:flex p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <Search size={20} />
              </Link>

              {/* Wishlist */}
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

              {/* Cart */}
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

        {/* Brand navigation bar - desktop */}
        <div className="hidden md:block border-t border-border/50">
          <div className="container mx-auto px-6 lg:px-12">
            <div
              ref={brandScrollRef}
              className="flex items-center gap-6 overflow-x-auto py-2.5"
              style={{ scrollbarWidth: "none" }}
            >
              {brandLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-xs tracking-wide text-foreground hover:opacity-60 transition-opacity whitespace-nowrap flex-shrink-0"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background border-t border-border max-h-[70vh] overflow-y-auto"
            >
              <div className="container mx-auto px-6 py-5 flex flex-col gap-4">
                {brandLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-sm tracking-wide text-foreground hover:opacity-60 transition-opacity"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-border pt-4 mt-1">
                  <Link
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-sm tracking-wide text-foreground hover:opacity-60 transition-opacity"
                  >
                    <User size={16} />
                    My Account
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
