export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  story: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  category: string;
  size: string;
  image: string;
  gallery: string[];
  construction: {
    upper: string[];
    midsole: string[];
    outsole: string[];
  };
  materials: string[];
  style: string;
  comfort: string;
  fit: string;
  season: string[];
  occasion: string[];
  crossSellPrice?: number | null;
}

const S = "https://ttgsrrlhqvtnmtlkvlyi.supabase.co/storage/v1/object/public/product-images";

export const products: Product[] = [
  {
    id: "nike-shox-z-black",
    name: "Nike Shox Z Black",
    tagline: "Nike",
    description: "Nike Shox Z – Iconic Comfort & Futuristic Style. Built with Nike's legendary Shox cushioning system.",
    story: "",
    price: 180,
    originalPrice: 599,
    discountPercent: 70,
    category: "Nike",
    size: "EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/nike-shox-z-black/1773181756234.jfif`,
    gallery: [`${S}/nike-shox-z-black/1773181756234.jfif`, `${S}/nike-shox-z-black/1773181758886.jfif`, `${S}/nike-shox-z-black/1773181761706.jfif`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "Sport / Streetwear",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "nike-shox-z-white-metalic",
    name: "Nike Shox Z White Metalic",
    tagline: "Nike",
    description: "Nike Shox Z – Iconic Comfort & Futuristic Style with metallic accents.",
    story: "",
    price: 179,
    originalPrice: 599,
    discountPercent: 70,
    category: "Nike",
    size: "EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/nike-shox-z-white-metalic/1773181324165.jpg`,
    gallery: [`${S}/nike-shox-z-white-metalic/1773181324165.jpg`, `${S}/nike-shox-z-white-metalic/1773181326417.jpg`, `${S}/nike-shox-z-white-metalic/1773181328645.jpg`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "Sport / Streetwear",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "air-force-1-low-07-white-travis-scott-cactus-jack-utopia-edition",
    name: "Air Force 1 Low '07 White Travis Scott Cactus Jack Utopia Edition",
    tagline: "Nike",
    description: "Step up your style with the Nike Air Force 1 Travis Scott Cactus Jack Utopia Edition.",
    story: "",
    price: 249,
    originalPrice: 799,
    discountPercent: 69,
    category: "Nike",
    size: "EU 36, EU 37, EU 38, EU 39, EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/air-force-1-low-07-white-travis-scott-cactus-jack-utopia-edition/1773167294168.webp`,
    gallery: [`${S}/air-force-1-low-07-white-travis-scott-cactus-jack-utopia-edition/1773167294168.webp`, `${S}/air-force-1-low-07-white-travis-scott-cactus-jack-utopia-edition/1773167296509.jpeg`, `${S}/air-force-1-low-07-white-travis-scott-cactus-jack-utopia-edition/1773167299110.webp`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "onitsuka-tiger-mexico-66-white-burgundy",
    name: "Onitsuka Tiger Mexico 66 White/Burgundy",
    tagline: "Onitsuka Tiger",
    description: "Step into timeless style with the Onitsuka Tiger Mexico 66.",
    story: "",
    price: 189,
    originalPrice: 749,
    discountPercent: 75,
    category: "Onitsuka Tiger",
    size: "EU 36, EU 37, EU 38, EU 39, EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/onitsuka-tiger-mexico-66-white-burgundy/1773166509616.webp`,
    gallery: [`${S}/onitsuka-tiger-mexico-66-white-burgundy/1773166509616.webp`, `${S}/onitsuka-tiger-mexico-66-white-burgundy/1773166512374.webp`, `${S}/onitsuka-tiger-mexico-66-white-burgundy/1773166516048.webp`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "nike-shox-z-white-gold",
    name: "Nike Shox Z White Gold",
    tagline: "Nike",
    description: "Nike Shox Z – Iconic Comfort & Futuristic Style in White Gold.",
    story: "",
    price: 179,
    originalPrice: 599,
    discountPercent: 70,
    category: "Nike",
    size: "EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/nike-shox-z-white-gold/1773181248732.jpg`,
    gallery: [`${S}/nike-shox-z-white-gold/1773181248732.jpg`, `${S}/nike-shox-z-white-gold/1773181250886.jpg`, `${S}/nike-shox-z-white-gold/1773181253329.jpg`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "Sport / Streetwear",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "nike-shox-z-grey",
    name: "Nike Shox Z Grey",
    tagline: "Nike",
    description: "Nike Shox Z – Iconic Comfort & Futuristic Style in Grey.",
    story: "",
    price: 179,
    originalPrice: 599,
    discountPercent: 70,
    category: "Nike",
    size: "EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/nike-shox-z-grey/1773181133521.webp`,
    gallery: [`${S}/nike-shox-z-grey/1773181133521.webp`, `${S}/nike-shox-z-grey/1773181135948.webp`, `${S}/nike-shox-z-grey/1773181138666.webp`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "Sport / Streetwear",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "nike-shox-z-silver",
    name: "Nike Shox Z Silver",
    tagline: "Nike",
    description: "Nike Shox Z – Iconic Comfort & Futuristic Style in Silver.",
    story: "",
    price: 179,
    originalPrice: 599,
    discountPercent: 70,
    category: "Nike",
    size: "EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/nike-shox-z-silver/1773180879449.webp`,
    gallery: [`${S}/nike-shox-z-silver/1773180879449.webp`, `${S}/nike-shox-z-silver/1773180881699.jpeg`, `${S}/nike-shox-z-silver/1773180884520.jpeg`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "Sport / Streetwear",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
  {
    id: "nike-shox-z-full-black",
    name: "Nike Shox Z Black Gold",
    tagline: "Nike",
    description: "Nike Shox Z – Iconic Comfort & Futuristic Style in Black Gold.",
    story: "",
    price: 179,
    originalPrice: 599,
    discountPercent: 70,
    category: "Nike",
    size: "EU 40, EU 41, EU 42, EU 43, EU 44, EU 45",
    image: `${S}/nike-shox-z-full-black/1773180596733.jfif`,
    gallery: [`${S}/nike-shox-z-full-black/1773180596733.jfif`, `${S}/nike-shox-z-full-black/1773180599578.jfif`, `${S}/nike-shox-z-full-black/1773180602345.jfif`],
    construction: { upper: [], midsole: [], outsole: [] },
    materials: [],
    style: "Sport / Streetwear",
    comfort: "",
    fit: "",
    season: [],
    occasion: [],
    crossSellPrice: null,
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const formatPrice = (price: number): string => {
  return `${Math.round(price)} AED`;
};
