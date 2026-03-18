export type Lang = "en" | "ar";

const translations = {
  // Navbar
  "nav.allShoes": { en: "All Shoes", ar: "جميع الأحذية" },
  "nav.aboutUs": { en: "About Us", ar: "من نحن" },
  "nav.reviews": { en: "Reviews", ar: "التقييمات" },
  "nav.search": { en: "Search", ar: "بحث" },
  "nav.searchEverything": { en: "Search everything...", ar: "ابحث عن أي شيء..." },
  "nav.myAccount": { en: "My Account", ar: "حسابي" },

  // Announcements
  "announce.1": { en: "Premium Brands – Up To 75% Off →", ar: "← علامات تجارية فاخرة – خصم يصل إلى 75%" },
  "announce.2": { en: "Cash on Delivery Available Across UAE →", ar: "← الدفع عند الاستلام متاح في جميع أنحاء الإمارات" },
  "announce.3": { en: "Fast Delivery – 1-3 Days Across UAE →", ar: "← توصيل سريع – 1-3 أيام في الإمارات" },

  // Features Bar
  "feature.customerService": { en: "Customer service", ar: "خدمة العملاء" },
  "feature.customerServiceDesc": { en: "Friendly and responsive support, always ready to assist.", ar: "دعم ودّي وسريع الاستجابة، جاهز دائمًا للمساعدة." },
  "feature.fastShipping": { en: "Fast COD Shipping", ar: "شحن سريع مع الدفع عند الاستلام" },
  "feature.fastShippingDesc": { en: "Express 24-hour delivery across the UAE with COD.", ar: "توصيل سريع خلال 24 ساعة في جميع أنحاء الإمارات." },
  "feature.returns": { en: "Returns & Exchanges", ar: "الإرجاع والاستبدال" },
  "feature.returnsDesc": { en: "Free returns for damaged items within days.", ar: "إرجاع مجاني للمنتجات التالفة خلال أيام." },
  "feature.securePayment": { en: "Secure payment", ar: "دفع آمن" },
  "feature.securePaymentDesc": { en: "Secure payment: COD (cash only) or online card payment", ar: "دفع آمن: نقدًا عند الاستلام أو بطاقة إلكترونية" },

  // Collection
  "collection.discover": { en: "DISCOVER", ar: "اكتشف" },
  "collection.ourCollection": { en: "Our Collection", ar: "مجموعتنا" },
  "collection.viewAll": { en: "VIEW ALL PRODUCTS", ar: "عرض جميع المنتجات" },
  "collection.viewAllShort": { en: "View All →", ar: "← عرض الكل" },
  "collection.soldOut": { en: "SOLD OUT", ar: "نفذ" },
  "collection.inStock": { en: "In Stock", ar: "متوفر" },
  "collection.outOfStock": { en: "Out of Stock", ar: "غير متوفر" },

  // Brands
  "brands.viewProducts": { en: "View Products", ar: "عرض المنتجات" },
  "brands.products": { en: "Products", ar: "منتج" },

  // Testimonials
  "testimonials.title": { en: "What Our Customers Say", ar: "ماذا يقول عملاؤنا" },
  "testimonials.subtitle": { en: "Discover why our customers love shopping with us! Read their experiences and see why Desert Deal is their go-to online store.", ar: "اكتشف لماذا يحب عملاؤنا التسوق معنا! اقرأ تجاربهم وتعرّف على سبب اختيارهم لنا." },
  "testimonials.happyCustomers": { en: "Happy Customers", ar: "عملاء سعداء" },
  "testimonials.totalSales": { en: "Total Sales Per Year", ar: "إجمالي المبيعات سنويًا" },
  "testimonials.happyDesc": { en: "Desert Deal ensures a seamless shopping experience with top-quality products and excellent service.", ar: "تضمن ديزرت ديل تجربة تسوق سلسة بمنتجات عالية الجودة وخدمة ممتازة." },
  "testimonials.salesDesc": { en: "With thousands of successful transactions every month, Desert Deal is a trusted destination.", ar: "مع آلاف المعاملات الناجحة كل شهر، ديزرت ديل وجهة موثوقة." },
  "testimonials.reviewed": { en: "Reviewed:", ar: "تقييم:" },
  "testimonials.greatProduct": { en: "Great Product!", ar: "منتج رائع!" },

  // About
  "about.ourStory": { en: "OUR STORY", ar: "قصتنا" },
  "about.title": { en: "Redefining Premium Footwear in the UAE", ar: "نعيد تعريف الأحذية الفاخرة في الإمارات" },
  "about.p1": { en: "Desert Deal was born from a passion for authentic, premium footwear. We bring you the world's most coveted brands at prices that make luxury accessible to everyone in the UAE.", ar: "وُلدت ديزرت ديل من شغف بالأحذية الأصلية الفاخرة. نقدم لك أشهر العلامات التجارية بأسعار تجعل الفخامة في متناول الجميع في الإمارات." },
  "about.p2": { en: "Every pair we sell is 100% authentic, carefully sourced and verified. With fast delivery across the UAE and hassle-free returns, your satisfaction is our priority.", ar: "كل زوج نبيعه أصلي 100%، تم اختياره والتحقق منه بعناية. مع التوصيل السريع في الإمارات وسياسة إرجاع سهلة، رضاك هو أولويتنا." },
  "about.stat.products": { en: "Products", ar: "منتج" },
  "about.stat.brands": { en: "Brands", ar: "علامة تجارية" },
  "about.stat.authentic": { en: "Authentic", ar: "أصلي" },

  // Footer
  "footer.tagline": { en: "Your destination for premium footwear. Authentic brands, unbeatable prices, delivered across the UAE.", ar: "وجهتك للأحذية الفاخرة. علامات تجارية أصلية، أسعار لا تُضاهى، توصيل في جميع أنحاء الإمارات." },
  "footer.deliveryReturns": { en: "Delivery & Returns", ar: "التوصيل والإرجاع" },
  "footer.shippingInfo": { en: "Shipping Information", ar: "معلومات الشحن" },
  "footer.returnsRefunds": { en: "Returns & Refunds", ar: "الإرجاع والاسترداد" },
  "footer.trackOrder": { en: "Track Your Order", ar: "تتبع طلبك" },
  "footer.helpFaq": { en: "Help & FAQs", ar: "المساعدة والأسئلة الشائعة" },
  "footer.aboutDesertDeal": { en: "About Desert Deal", ar: "عن ديزرت ديل" },
  "footer.aboutUs": { en: "About Us", ar: "من نحن" },
  "footer.ourBrands": { en: "Our Brands", ar: "علاماتنا التجارية" },
  "footer.contactUs": { en: "Contact Us", ar: "اتصل بنا" },
  "footer.newsletter": { en: "Sign up to our newsletter", ar: "اشترك في نشرتنا البريدية" },
  "footer.newsletterDesc": { en: "Sign up for exclusive offers, original stories, events and more.", ar: "اشترك للحصول على عروض حصرية وقصص أصلية وفعاليات والمزيد." },
  "footer.yourEmail": { en: "Your email", ar: "بريدك الإلكتروني" },
  "footer.weAccept": { en: "We Accept", ar: "نقبل الدفع عبر" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  "footer.privacyPolicy": { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  "footer.shippingPolicy": { en: "Shipping Policy", ar: "سياسة الشحن" },
  "footer.terms": { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  "footer.returnsPolicy": { en: "Returns Policy", ar: "سياسة الإرجاع" },

  // Mobile Bottom Nav
  "mobile.search": { en: "Search", ar: "بحث" },
  "mobile.wishlist": { en: "Wishlist", ar: "المفضلة" },
  "mobile.whatsapp": { en: "WhatsApp", ar: "واتساب" },
  "mobile.searchProducts": { en: "Search products...", ar: "ابحث عن منتجات..." },
  "mobile.viewAllResults": { en: "View all results for", ar: "عرض جميع النتائج لـ" },
  "mobile.noProducts": { en: "No products found for", ar: "لم يتم العثور على منتجات لـ" },

  // Common
  "common.shopNow": { en: "Shop Now", ar: "تسوق الآن" },
  "common.addToCart": { en: "Add to Cart", ar: "أضف إلى السلة" },
  "common.buyNow": { en: "Buy Now", ar: "اشترِ الآن" },
  "common.loading": { en: "Loading...", ar: "جاري التحميل..." },

  // Language switcher
  "lang.en": { en: "EN", ar: "EN" },
  "lang.ar": { en: "AR", ar: "AR" },
  "lang.english": { en: "English", ar: "English" },
  "lang.arabic": { en: "العربية", ar: "العربية" },
} as const;

export type TranslationKey = keyof typeof translations;

export default translations;
