import { memo } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, MessageCircle } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

// Matches the klb-mobile-bottom site-mobile-navbar from original HTML
const MobileBottomNav = memo(() => {
  const { totalItems: wishlistItems } = useWishlist();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex items-center justify-around h-14">
        {/* Search */}
        <Link
          to="/shop"
          className="flex flex-col items-center gap-0.5 text-foreground"
        >
          <Search size={20} />
          <span className="text-[10px]">Search</span>
        </Link>

        {/* Wishlist */}
        <Link
          to="/wishlist"
          className="flex flex-col items-center gap-0.5 text-foreground relative"
        >
          <Heart size={20} />
          <span className="text-[10px]">Wishlist</span>
          {wishlistItems > 0 && (
            <span className="absolute -top-1 right-0 w-4 h-4 bg-foreground text-background text-[9px] flex items-center justify-center rounded-full">
              {wishlistItems}
            </span>
          )}
        </Link>

        {/* WhatsApp - matches original wa.me link */}
        <a
          href="https://wa.me/+971506784405"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 text-foreground"
        >
          <MessageCircle size={20} />
          <span className="text-[10px]">WhatsApp</span>
        </a>
      </nav>
    </div>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
