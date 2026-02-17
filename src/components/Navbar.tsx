import { useState, memo, useEffect, useCallback, useRef } from "react";
import { Menu, X, ShoppingBag, Heart, User, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import logoImg from "@/assets/logo.png";
import SearchSuggestions from "@/components/SearchSuggestions";

const announcements = [
  "Ramadan Sale Live Now - Up To 75% Off →",
  "COD Available Across the UAE →",
  "Free Shipping on All Orders →",
];

const topLinks = [
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
];

const bottomLinks = [
  { name: "Puma", href: "/shop?brand=puma" },
  { name: "Loro Piana", href: "/shop?brand=loro-piana" },
  { name: "Louis Vuitton", href: "/shop?brand=louis-vuitton" },
  { name: "Brooks", href: "/shop?brand=brooks" },
  { name: "Hermes", href: "/shop?brand=hermes" },
  { name: "About Us", href: "/#about" },
  { name: "Reviews", href: "/#collection" },
];

const allLinks = [...topLinks, ...bottomLinks];

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const [logoWidth, setLogoWidth] = useState(0);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    if (logoRef.current) {
      setLogoWidth(logoRef.current.offsetWidth);
    }
  }, []);

  const nextAnnouncement = useCallback(() => {
    setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
  }, []);

  const prevAnnouncement = useCallback(() => {
    setAnnouncementIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextAnnouncement, 4000);
    return () => clearInterval(timer);
  }, [nextAnnouncement]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    };
    if (searchOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  return (
    <>
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-foreground text-background rounded-b-2xl mx-1 sm:mx-2">
        <div className="container mx-auto px-4 flex items-center justify-center h-9 relative">
          <button
            onClick={prevAnnouncement}
            className="absolute left-4 text-background/70 hover:text-background transition-colors"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-medium tracking-wide">
            {announcements[announcementIndex]}
          </span>
          <button
            onClick={nextAnnouncement}
            className="absolute right-4 text-background/70 hover:text-background transition-colors"
            aria-label="Next announcement"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed top-9 left-0 right-0 z-50 bg-background border-b border-border transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center h-14 sm:h-16 relative">
            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground">
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            <Link to="/" ref={logoRef} className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex items-center shrink-0 lg:mr-12 mt-1">
              <img src={logoImg} alt="Desert Deal" className="h-14 sm:h-16 w-auto object-contain" />
            </Link>

            <div className="hidden lg:flex items-center gap-x-5 flex-1 overflow-x-auto no-scrollbar border-l border-border pl-8">
              {topLinks.map((link) => (
                <Link key={link.name} to={link.href} className="text-[13px] text-foreground hover:opacity-60 transition-opacity whitespace-nowrap font-medium">
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0 relative z-10">
              <button onClick={() => setSearchOpen(true)} className="hidden lg:flex p-2 text-foreground hover:opacity-60 transition-opacity">
                <Search size={20} />
              </button>
              <Link to="/wishlist" className="relative p-2 text-foreground hover:opacity-60 transition-opacity">
                <Heart size={20} />
                {wishlistItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full">{wishlistItems}</span>
                )}
              </Link>
              <button onClick={() => openCart()} className="relative p-2 text-foreground hover:opacity-60 transition-opacity">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full">{totalItems}</span>
                )}
              </button>
              <Link to="/account" className="hidden md:flex p-2 text-foreground hover:opacity-60 transition-opacity">
                <User size={20} />
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center gap-x-5 pb-2">
            {bottomLinks.map((link) => (
              <Link key={link.name} to={link.href} className="text-[13px] text-foreground hover:opacity-60 transition-opacity whitespace-nowrap font-medium">
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-background border-t border-border max-h-[70vh] overflow-y-auto">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
              {allLinks.map((link) => (
                <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)} className="text-sm text-foreground hover:opacity-60 transition-opacity py-1">
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-border pt-3 mt-1">
                <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm text-foreground hover:opacity-60 transition-opacity">
                  <User size={16} /> My Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Side Panel */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-[70] bg-foreground/30 animate-fade-in" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className="fixed top-0 right-0 bottom-0 z-[80] w-full max-w-md bg-background shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-semibold text-foreground">Search</h2>
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-1 text-foreground hover:opacity-60 transition-opacity">
                <X size={22} />
              </button>
            </div>
            <div className="px-6 pb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search everything..."
                  className="w-full h-12 pl-11 pr-4 text-sm bg-muted rounded-lg focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </form>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              <SearchSuggestions
                query={searchQuery}
                onSelect={(q) => { navigate(`/shop?search=${encodeURIComponent(q.trim())}`); setSearchOpen(false); setSearchQuery(""); }}
                onClose={() => { setSearchOpen(false); setSearchQuery(""); }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
