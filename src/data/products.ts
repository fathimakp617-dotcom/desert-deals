// Product Images
import airStrideImg from "@/assets/products/air-stride.jpg";
import urbanClassicImg from "@/assets/products/urban-classic.jpg";
import sportRunnerImg from "@/assets/products/sport-runner.jpg";
import slamDunkImg from "@/assets/products/slam-dunk.jpg";
import desertLoaferImg from "@/assets/products/desert-loafer.jpg";
import cloudSlipImg from "@/assets/products/cloud-slip.jpg";
import trailBlazerImg from "@/assets/products/trail-blazer.jpg";
import streetCanvasImg from "@/assets/products/street-canvas.jpg";

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
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  ingredients: string[];
  concentration: string;
  longevity: string;
  sillage: string;
  season: string[];
  occasion: string[];
}

export const products: Product[] = [
  {
    id: "air-stride",
    name: "AIR STRIDE",
    tagline: "Lightweight & Breathable",
    description: "Premium white sneakers designed for all-day comfort. Lightweight cushioning with breathable mesh upper and durable rubber outsole.",
    story: "Engineered for those who never stop moving, Air Stride combines cutting-edge cushioning technology with a sleek minimal design that pairs with everything.",
    price: 299,
    originalPrice: 599,
    discountPercent: 50,
    category: "Sneakers",
    size: "EU 40-45",
    image: airStrideImg,
    gallery: [airStrideImg, airStrideImg, airStrideImg],
    notes: { top: ["Mesh Upper"], heart: ["EVA Midsole"], base: ["Rubber Outsole"] },
    ingredients: ["Premium Mesh", "EVA Foam", "Rubber", "Synthetic Leather"],
    concentration: "Athletic",
    longevity: "All Day Comfort",
    sillage: "Lightweight",
    season: ["Spring", "Summer", "Fall"],
    occasion: ["Daily Wear", "Walking", "Travel"]
  },
  {
    id: "urban-classic",
    name: "URBAN CLASSIC",
    tagline: "Timeless & Refined",
    description: "Timeless black leather casual shoes crafted from premium full-grain leather. Perfect for both office and casual outings.",
    story: "A modern interpretation of classic craftsmanship, Urban Classic uses hand-selected leather that develops a beautiful patina over time.",
    price: 349,
    originalPrice: 699,
    discountPercent: 50,
    category: "Casual",
    size: "EU 39-44",
    image: urbanClassicImg,
    gallery: [urbanClassicImg, urbanClassicImg, urbanClassicImg],
    notes: { top: ["Full-Grain Leather"], heart: ["Cushioned Insole"], base: ["Durable Sole"] },
    ingredients: ["Full-Grain Leather", "Leather Lining", "Rubber Sole", "Cotton Laces"],
    concentration: "Casual",
    longevity: "All Day Comfort",
    sillage: "Classic Fit",
    season: ["All Seasons"],
    occasion: ["Office", "Casual", "Dinner"]
  },
  {
    id: "sport-runner",
    name: "SPORT RUNNER",
    tagline: "Speed & Performance",
    description: "High-performance running shoes with responsive cushioning and engineered mesh for maximum breathability during intense workouts.",
    story: "Built for athletes who demand the best, Sport Runner features a responsive energy-return midsole that propels you forward with every stride.",
    price: 279,
    originalPrice: 559,
    discountPercent: 50,
    category: "Running",
    size: "EU 40-46",
    image: sportRunnerImg,
    gallery: [sportRunnerImg, sportRunnerImg, sportRunnerImg],
    notes: { top: ["Engineered Mesh"], heart: ["Boost Midsole"], base: ["Continental Rubber"] },
    ingredients: ["Engineered Mesh", "Boost Foam", "Continental Rubber", "Synthetic Overlays"],
    concentration: "Performance",
    longevity: "Marathon Ready",
    sillage: "Responsive",
    season: ["All Seasons"],
    occasion: ["Running", "Gym", "Sports"]
  },
  {
    id: "slam-dunk",
    name: "SLAM DUNK",
    tagline: "Bold & Powerful",
    description: "Bold high-top basketball sneakers with superior ankle support, impact-absorbing sole, and aggressive traction pattern.",
    story: "Inspired by the energy of the court, Slam Dunk delivers explosive performance with street-ready style that turns heads on and off the court.",
    price: 399,
    originalPrice: 799,
    discountPercent: 50,
    category: "Basketball",
    size: "EU 41-46",
    image: slamDunkImg,
    gallery: [slamDunkImg, slamDunkImg, slamDunkImg],
    notes: { top: ["Leather Upper"], heart: ["Air Cushion"], base: ["Herringbone Traction"] },
    ingredients: ["Premium Leather", "Air Unit", "Rubber Outsole", "Padded Collar"],
    concentration: "Athletic",
    longevity: "Game Ready",
    sillage: "High Impact",
    season: ["All Seasons"],
    occasion: ["Basketball", "Streetwear", "Casual"]
  },
  {
    id: "desert-loafer",
    name: "DESERT LOAFER",
    tagline: "Elegant & Sophisticated",
    description: "Elegant brown leather loafers handcrafted from Italian calfskin leather. Slip-on convenience meets formal sophistication.",
    story: "Each pair is meticulously handcrafted by artisans using centuries-old techniques, resulting in a loafer that embodies luxury and comfort.",
    price: 449,
    originalPrice: 899,
    discountPercent: 50,
    category: "Formal",
    size: "EU 39-44",
    image: desertLoaferImg,
    gallery: [desertLoaferImg, desertLoaferImg, desertLoaferImg],
    notes: { top: ["Italian Calfskin"], heart: ["Leather Lining"], base: ["Blake Stitched Sole"] },
    ingredients: ["Italian Calfskin", "Leather Lining", "Leather Sole", "Hand-Burnished Finish"],
    concentration: "Formal",
    longevity: "All Day Comfort",
    sillage: "Sophisticated",
    season: ["All Seasons"],
    occasion: ["Business", "Wedding", "Formal Events"]
  },
  {
    id: "cloud-slip",
    name: "CLOUD SLIP",
    tagline: "Effortless Comfort",
    description: "Ultra-comfortable white slip-on sneakers with memory foam insole. Effortless style for everyday wear.",
    story: "Designed for those who value simplicity, Cloud Slip features a cloud-like memory foam insole that makes every step feel weightless.",
    price: 199,
    originalPrice: 399,
    discountPercent: 50,
    category: "Casual",
    size: "EU 38-44",
    image: cloudSlipImg,
    gallery: [cloudSlipImg, cloudSlipImg, cloudSlipImg],
    notes: { top: ["Canvas Upper"], heart: ["Memory Foam"], base: ["Vulcanized Rubber"] },
    ingredients: ["Premium Canvas", "Memory Foam", "Vulcanized Rubber", "Elastic Gore"],
    concentration: "Casual",
    longevity: "All Day Comfort",
    sillage: "Ultra Light",
    season: ["Spring", "Summer"],
    occasion: ["Daily Wear", "Beach", "Travel"]
  },
  {
    id: "trail-blazer",
    name: "TRAIL BLAZER",
    tagline: "Rugged & Reliable",
    description: "Rugged hiking boots built for adventure. Waterproof construction, reinforced toe cap, and Vibram-style outsole for all terrains.",
    story: "Born from the spirit of exploration, Trail Blazer conquers any terrain with confidence. Waterproof membranes and aggressive lugs keep you moving forward.",
    price: 499,
    originalPrice: 999,
    discountPercent: 50,
    category: "Outdoor",
    size: "EU 40-45",
    image: trailBlazerImg,
    gallery: [trailBlazerImg, trailBlazerImg, trailBlazerImg],
    notes: { top: ["Nubuck Leather"], heart: ["Waterproof Membrane"], base: ["Vibram Outsole"] },
    ingredients: ["Nubuck Leather", "Gore-Tex Membrane", "Vibram Rubber", "EVA Midsole"],
    concentration: "Outdoor",
    longevity: "All Day Support",
    sillage: "Heavy Duty",
    season: ["All Seasons"],
    occasion: ["Hiking", "Trekking", "Adventure"]
  },
  {
    id: "street-canvas",
    name: "STREET CANVAS",
    tagline: "Classic Streetwear",
    description: "Classic navy canvas sneakers with vulcanized rubber sole. Timeless streetwear essential with premium canvas upper.",
    story: "A love letter to street culture, Street Canvas captures the raw energy of urban life in a timeless silhouette that never goes out of style.",
    price: 149,
    originalPrice: 299,
    discountPercent: 50,
    category: "Sneakers",
    size: "EU 38-45",
    image: streetCanvasImg,
    gallery: [streetCanvasImg, streetCanvasImg, streetCanvasImg],
    notes: { top: ["Canvas Upper"], heart: ["Cushioned Insole"], base: ["Vulcanized Rubber"] },
    ingredients: ["Premium Canvas", "Cotton Lining", "Vulcanized Rubber", "Metal Eyelets"],
    concentration: "Casual",
    longevity: "All Day Comfort",
    sillage: "Lightweight",
    season: ["Spring", "Summer", "Fall"],
    occasion: ["Daily Wear", "Streetwear", "School"]
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const formatPrice = (price: number): string => {
  return `${Math.round(price)} AED`;
};
