import { Link } from "react-router-dom";
import newBalanceBanner from "@/assets/banners/new-balance-summer.jpg";

const NewBalancePromoGrid = () => {
  return (
    <section className="w-full">
      <Link to="/shop?brand=new-balance" className="block relative overflow-hidden group">
        <img
          src={newBalanceBanner}
          alt="New Balance Shoes – Summer Collection"
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          width={1600}
          height={500}
        />
      </Link>
    </section>
  );
};

export default NewBalancePromoGrid;
