import { memo } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, MessageCircle } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

const MobileBottomNav = memo(() => {
  const { totalItems: wishlistItems } = useWishlist();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-2 md:hidden">
      <nav className="flex items-center justify-around h-16 bg-background border border-border rounded-2xl shadow-lg">
        <Link
          to="/shop"
          className="flex flex-col items-center gap-1 text-foreground"
        >
          <Search size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Search</span>
        </Link>

        <Link
          to="/wishlist"
          className="flex flex-col items-center gap-1 text-foreground relative"
        >
          <Heart size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Wishlist</span>
          {wishlistItems > 0 && (
            <span className="absolute -top-1 right-0 w-4 h-4 bg-foreground text-background text-[9px] flex items-center justify-center rounded-full">
              {wishlistItems}
            </span>
          )}
        </Link>

        <a
          href="https://wa.me/971506784405"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-foreground"
        >
          <MessageCircle size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">WhatsApp</span>
        </a>
      </nav>
    </div>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
