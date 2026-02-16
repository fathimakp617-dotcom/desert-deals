import { memo } from "react";
import { Link } from "react-router-dom";
import { Search, Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

const MobileBottomNav = memo(() => {
  const { totalItems: wishlistItems } = useWishlist();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex items-center justify-around h-14">
        <Link
          to="/shop"
          className="flex flex-col items-center gap-0.5 text-foreground"
        >
          <Search size={20} />
          <span className="text-[10px]">Search</span>
        </Link>

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
      </nav>
    </div>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
