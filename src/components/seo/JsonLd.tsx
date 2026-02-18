import { Helmet } from "react-helmet-async";
import { Product as ProductType, products } from "@/data/products";

const SITE_URL = "https://desertsdeals.com";

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export const OrganizationSchema = ({
  name = "Desert Deal",
  url = SITE_URL,
  logo = "",
  description = "Your trusted destination for premium shoes and accessories across the UAE.",
}: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo && { logo }),
    description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Arabic"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
    },
    sameAs: [
      "https://instagram.com/desertsdeals",
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface ProductSchemaProps {
  product: ProductType;
  averageRating?: number;
  totalReviews?: number;
}

export const ProductSchema = ({ product, averageRating = 0, totalReviews = 0 }: ProductSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `${SITE_URL}${product.image}`,
    brand: {
      "@type": "Brand",
      name: "Desert Deal",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "AED",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Desert Deal",
      },
    },
    ...(totalReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    category: product.style,
    size: product.size,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Desert Deal",
    "@id": SITE_URL,
    url: SITE_URL,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const WebsiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Desert Deal",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const FAQSchema = () => {
  const faqs = [
    {
      question: "Do you offer COD across the UAE?",
      answer: "Yes, we offer Cash on Delivery across the entire UAE."
    },
    {
      question: "Do you offer free shipping?",
      answer: "Yes, we offer free shipping on all orders within the UAE."
    },
    {
      question: "Are all products authentic?",
      answer: "Yes, all our products are 100% authentic and sourced directly from authorized distributors."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 7 days of delivery for unused products in original packaging."
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const CollectionPageSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shop All Products | Desert Deal",
    description: "Browse Desert Deal's exclusive collection of premium shoes and accessories. Free shipping & COD available across the UAE.",
    url: `${SITE_URL}/shop`,
    isPartOf: {
      "@type": "WebSite",
      name: "Desert Deal",
      url: SITE_URL
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          description: product.tagline,
          image: `${SITE_URL}${product.image}`,
          url: `${SITE_URL}/product/${product.id}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "AED",
            price: product.price,
            availability: "https://schema.org/InStock"
          }
        }
      }))
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
