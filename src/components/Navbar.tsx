import { useState, memo, useEffect, useCallback, useRef, useMemo } from "react";
import { Menu, X, ShoppingBag, Heart, User, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "@/contexts/DirectionContext";
import SearchSuggestions from "@/components/SearchSuggestions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import headerLogo from "@/assets/desert-deal-logo-header.png";

// Static bottom links are now built inside the component to access t()

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();

  const announcements = useMemo(() => [
    t("announce.1"),
    t("announce.2"),
    t("announce.3"),
  ], [t]);

  const { data: categories = [] } = useCategories();

  const { topLinks, bottomLinks, allLinks } = useMemo(() => {
    const activeCategories = categories.filter((c) => c.is_active && c.value !== "all-shoes" && c.show_in_header !== false);
    const categoryLinks = activeCategories.map((c) => ({
      name: c.label,
      href: `/shop?brand=${c.value}`,
    }));

    const allNavLinks = [
      { name: t("nav.allShoes"), href: "/shop" },
      ...categoryLinks,
      { name: t("nav.aboutUs"), href: "/#about" },
      { name: t("nav.reviews"), href: "/#testimonials" },
    ];
    const splitAt = Math.min(12, allNavLinks.length);
    const top = allNavLinks.slice(0, splitAt);
    const bottom = allNavLinks.slice(splitAt);
    return { topLinks: top, bottomLinks: bottom, allLinks: allNavLinks };
  }, [categories, t]);

  const changeAnnouncement = useCallback((direction: 1 | -1) => {
    setAnnouncementVisible(false);
    setTimeout(() => {
      setAnnouncementIndex((prev) => (prev + direction + announcements.length) % announcements.length);
      setAnnouncementVisible(true);
    }, 250);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => changeAnnouncement(1), 4000);
    return () => clearInterval(timer);
  }, [changeAnnouncement]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchClosing(true);
    setTimeout(() => { setSearchOpen(false); setSearchClosing(false); setSearchQuery(""); }, 300);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    if (searchOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, closeSearch]);

  return (
    <>
      {/* Announcement Bar */}
      <div dir="ltr" className={`fixed top-0 left-0 right-0 z-[60] bg-foreground text-background rounded-b-2xl mx-1 sm:mx-2 transition-transform duration-300 ${scrolled ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="container mx-auto px-4 flex items-center justify-center h-9 relative">
          <button
            onClick={() => changeAnnouncement(-1)}
            className="absolute start-4 text-background/70 hover:text-background transition-colors"
            aria-label="Previous announcement"
          >
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className={`text-xs sm:text-sm font-medium tracking-wide transition-opacity duration-250 ${announcementVisible ? "opacity-100" : "opacity-0"}`}>
            {announcements[announcementIndex]}
          </span>
          <button
            onClick={() => changeAnnouncement(1)}
            className="absolute end-4 text-background/70 hover:text-background transition-colors"
            aria-label="Next announcement"
          >
            {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed left-0 right-0 z-50 bg-background border-b border-border transition-all duration-300 ${scrolled ? "top-0 shadow-md" : "top-9"}`}>
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-1.5">
          {/* Single row: Logo left | Nav center | Icons right */}
          <div dir="ltr" className="flex items-center relative">
            {/* Mobile hamburger */}
            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground">
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Logo */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex items-center shrink-0 lg:mr-6"
            >
              <img src={headerLogo} alt="Desert Deal" className="h-14 sm:h-20 w-auto" />
            </Link>

            {/* Desktop nav – top row centered between logo and icons */}
            <div className="hidden lg:flex items-center justify-center gap-x-3 xl:gap-x-4 flex-1 overflow-x-auto no-scrollbar">
              {topLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-[13px] text-foreground hover:opacity-60 transition-opacity whitespace-nowrap font-medium"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1 sm:gap-2 ml-6 shrink-0 relative z-10">
              <LanguageSwitcher />
              <button onClick={() => setSearchOpen(true)} className="hidden lg:flex p-2 text-foreground hover:opacity-60 transition-opacity" aria-label="Search">
                <Search size={20} />
              </button>
              <Link to="/wishlist" className="relative p-2 text-foreground hover:opacity-60 transition-opacity">
                <Heart size={20} />
                {wishlistItems > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full">{wishlistItems}</span>
                )}
              </Link>
              <button onClick={() => openCart()} className="relative p-2 text-foreground hover:opacity-60 transition-opacity">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full">{totalItems}</span>
                )}
              </button>
              <Link to="/account" className="hidden md:flex p-2 text-foreground hover:opacity-60 transition-opacity">
                <User size={20} />
              </Link>
            </div>
          </div>

          {/* Desktop nav – bottom row centered */}
          <div dir="ltr" className="hidden lg:flex items-center justify-center gap-x-3 xl:gap-x-4 -mt-2.5">
            {bottomLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={(e) => {
                  if (link.href.includes("#")) {
                    const hash = link.href.split("#")[1];
                    const el = document.getElementById(hash);
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
                className="text-[13px] text-foreground hover:opacity-60 transition-opacity whitespace-nowrap font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-background border-t border-border max-h-[70vh] overflow-y-auto">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-3 text-start">
              {allLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => {
                    setIsOpen(false);
                    if (link.href.includes("#")) {
                      const hash = link.href.split("#")[1];
                      setTimeout(() => {
                        const el = document.getElementById(hash);
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }
                  }}
                  className="text-sm text-foreground hover:opacity-60 transition-opacity py-1"
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-border pt-3 mt-1">
                <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm text-foreground hover:opacity-60 transition-opacity">
                  <User size={16} /> {t("nav.myAccount")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Side Panel */}
      {searchOpen && (
        <>
          <div className={`fixed inset-0 z-[70] bg-foreground/30 ${searchClosing ? "animate-fade-out" : "animate-fade-in"}`} onClick={closeSearch} />
          <div className={`fixed top-0 ${isRtl ? "left-0" : "right-0"} bottom-0 z-[80] w-full max-w-md bg-background shadow-2xl flex flex-col ${searchClosing ? (isRtl ? "animate-slide-out-left" : "animate-slide-out-right") : (isRtl ? "animate-slide-in-left" : "animate-slide-in-right")}`}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-semibold text-foreground">{t("nav.search")}</h2>
              <button onClick={closeSearch} className="p-1 text-foreground hover:opacity-60 transition-opacity">
                <X size={22} />
              </button>
            </div>
            <div className="px-6 pb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                    closeSearch();
                  }
                }}
                className="relative"
              >
                <Search className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("nav.searchEverything")}
                  className={`w-full h-12 text-sm bg-muted rounded-lg focus:outline-none text-foreground placeholder:text-muted-foreground ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}`}
                />
              </form>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              <SearchSuggestions
                query={searchQuery}
                onSelect={(q) => { navigate(`/shop?search=${encodeURIComponent(q.trim())}`); closeSearch(); }}
                onClose={closeSearch}
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
