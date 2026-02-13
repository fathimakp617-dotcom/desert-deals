import { useState, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Heart, User, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const announcements = [
  "Free Shipping on Orders Above ₹999 →",
  "COD Available Across India →",
  "Premium Luxury Perfumes →",
];

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistItems } = useWishlist();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { name: "Home", href: isHomePage ? "#home" : "/", isRoute: !isHomePage },
    { name: "Shop", href: "/shop", isRoute: true },
    { name: "Collection", href: isHomePage ? "#collection" : "/#collection", isRoute: !isHomePage },
    { name: "About", href: isHomePage ? "#about" : "/#about", isRoute: !isHomePage },
    { name: "Contact", href: isHomePage ? "#contact" : "/#contact", isRoute: !isHomePage },
  ];

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
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-xl md:text-2xl font-heading font-bold tracking-tight text-foreground uppercase">
                RAYN ADAM
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-sm tracking-wide text-foreground hover:opacity-60 transition-opacity duration-200"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-sm tracking-wide text-foreground hover:opacity-60 transition-opacity duration-200"
                  >
                    {link.name}
                  </a>
                )
              )}
            </div>

            {/* Icons */}
            <div className="hidden md:flex items-center gap-4">
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <Heart size={20} />
                {wishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs flex items-center justify-center rounded-full">
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
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Account */}
              <Link
                to="/account"
                className="p-2 text-foreground hover:opacity-60 transition-opacity"
              >
                <User size={20} />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <Link to="/wishlist" className="relative p-2 text-foreground">
                <Heart size={20} />
                {wishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-xs flex items-center justify-center rounded-full">
                    {wishlistItems}
                  </span>
                )}
              </Link>
              <button onClick={() => openCart()} className="relative p-2 text-foreground">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-xs flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-foreground"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
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
              className="md:hidden bg-background border-t border-border"
            >
              <div className="container mx-auto px-6 py-6 flex flex-col gap-5">
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-sm tracking-wide text-foreground hover:opacity-60 transition-opacity"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-sm tracking-wide text-foreground hover:opacity-60 transition-opacity"
                    >
                      {link.name}
                    </a>
                  )
                )}
                <div className="border-t border-border pt-4 mt-2">
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
