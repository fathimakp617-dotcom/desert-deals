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
  "common.home": { en: "Home", ar: "الرئيسية" },
  "common.shop": { en: "Shop", ar: "المتجر" },
  "common.viewAll": { en: "View All", ar: "عرض الكل" },
  "common.clearAll": { en: "Clear all", ar: "مسح الكل" },
  "common.clear": { en: "Clear", ar: "مسح" },
  "common.active": { en: "Active:", ar: "نشط:" },
  "common.items": { en: "items", ar: "منتج" },
  "common.item": { en: "item", ar: "منتج" },
  "common.size": { en: "Size", ar: "المقاس" },
  "common.qty": { en: "Qty", ar: "الكمية" },
  "common.selectSize": { en: "Select Size", ar: "اختر المقاس" },
  "common.add": { en: "+ Add", ar: "+ أضف" },

  // Language switcher
  "lang.en": { en: "EN", ar: "EN" },
  "lang.ar": { en: "AR", ar: "AR" },
  "lang.english": { en: "English", ar: "English" },
  "lang.arabic": { en: "العربية", ar: "العربية" },

  // Cart
  "cart.addedToCart": { en: "Added to your cart", ar: "تمت الإضافة إلى سلتك" },
  "cart.keepShopping": { en: "Keep Shopping", ar: "متابعة التسوق" },
  "cart.goToCart": { en: "Go to Cart", ar: "الذهاب إلى السلة" },
  "cart.yourCart": { en: "Your Cart", ar: "سلتك" },
  "cart.empty": { en: "Your cart is empty", ar: "سلتك فارغة" },
  "cart.remove": { en: "Remove", ar: "إزالة" },
  "cart.shoppingCart": { en: "Shopping Cart", ar: "سلة التسوق" },
  "cart.continueShopping": { en: "Continue Shopping", ar: "متابعة التسوق" },
  "cart.proceedToCheckout": { en: "Proceed to Checkout", ar: "المتابعة للدفع" },
  "cart.orderSummary": { en: "Order Summary", ar: "ملخص الطلب" },
  "cart.subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "cart.shipping": { en: "Shipping", ar: "الشحن" },
  "cart.total": { en: "Total", ar: "الإجمالي" },
  "cart.freeShipping": { en: "FREE", ar: "مجاناً" },
  "cart.emptyTitle": { en: "Your Cart is Empty", ar: "سلة التسوق فارغة" },
  "cart.emptyDesc": { en: "Looks like you haven't added anything yet.", ar: "يبدو أنك لم تضف أي شيء بعد." },
  "cart.startShopping": { en: "Start Shopping", ar: "ابدأ التسوق" },
  "cart.youMayAlsoLike": { en: "You May Also Like", ar: "قد يعجبك أيضاً" },

  // Product
  "product.completeYourLook": { en: "Complete Your Look", ar: "أكمل إطلالتك" },
  "product.customersAlsoBought": { en: "Customers Also Bought", ar: "عملاء آخرون اشتروا أيضاً" },
  "product.frequentlyBoughtTogether": { en: "Frequently Bought Together", ar: "يُشترى معاً بشكل متكرر" },
  "product.recentlyViewed": { en: "Recently Viewed", ar: "شوهد مؤخراً" },
  "product.description": { en: "Description", ar: "الوصف" },
  "product.reviews": { en: "Reviews", ar: "التقييمات" },
  "product.addToCart": { en: "Add to cart", ar: "أضف إلى السلة" },
  "product.soldOut": { en: "SOLD OUT", ar: "نفذت الكمية" },
  "product.selectSize": { en: "Select Size", ar: "اختر المقاس" },
  "product.sizeGuide": { en: "Size Guide", ar: "دليل المقاسات" },
  "product.inStock": { en: "IN STOCK", ar: "متوفر" },
  "product.outOfStock": { en: "Out of Stock", ar: "غير متوفر" },
  "product.addedToCart": { en: "added to cart", ar: "تمت الإضافة إلى السلة" },
  "product.pleaseSelectSize": { en: "Please select a size first", ar: "الرجاء اختيار المقاس أولاً" },
  "product.addToWishlist": { en: "Add to Wishlist", ar: "أضف إلى المفضلة" },
  "product.removeFromWishlist": { en: "Remove from Wishlist", ar: "إزالة من المفضلة" },

  // Shop
  "shop.title": { en: "Shop", ar: "المتجر" },
  "shop.filter": { en: "Filter", ar: "تصفية" },
  "shop.sort": { en: "Sort", ar: "ترتيب" },
  "shop.searchShoes": { en: "Search shoes...", ar: "ابحث عن أحذية..." },
  "shop.category": { en: "Category", ar: "الفئة" },
  "shop.priceRange": { en: "Price Range", ar: "نطاق السعر" },
  "shop.noProducts": { en: "No products found", ar: "لم يتم العثور على منتجات" },
  "shop.tryAdjusting": { en: "Try adjusting your filters", ar: "حاول تعديل عوامل التصفية" },
  "shop.searchResults": { en: "Search results for", ar: "نتائج البحث عن" },
  "shop.allPrices": { en: "All Prices", ar: "جميع الأسعار" },
  "shop.under100": { en: "Under 100 AED", ar: "أقل من 100 درهم" },
  "shop.100to200": { en: "100 – 200 AED", ar: "100 – 200 درهم" },
  "shop.200to400": { en: "200 – 400 AED", ar: "200 – 400 درهم" },
  "shop.above400": { en: "Above 400 AED", ar: "أكثر من 400 درهم" },
  "shop.newest": { en: "Newest", ar: "الأحدث" },
  "shop.priceLowHigh": { en: "Price: Low → High", ar: "السعر: من الأقل إلى الأعلى" },
  "shop.priceHighLow": { en: "Price: High → Low", ar: "السعر: من الأعلى إلى الأقل" },
  "shop.nameAZ": { en: "Name: A → Z", ar: "الاسم: أ → ي" },

  // Wishlist
  "wishlist.title": { en: "MY WISHLIST", ar: "قائمة أمنياتي" },
  "wishlist.savedProducts": { en: "Saved Products", ar: "المنتجات المحفوظة" },
  "wishlist.itemsInWishlist": { en: "in your wishlist", ar: "في قائمة أمنياتك" },
  "wishlist.empty": { en: "Your wishlist is empty", ar: "قائمة أمنياتك فارغة" },
  "wishlist.emptyDesc": { en: "Save items you love to come back to them later.", ar: "احفظ المنتجات التي تحبها للعودة إليها لاحقاً." },
  "wishlist.browseCollection": { en: "Browse Collection", ar: "تصفح المجموعة" },

  // Checkout
  "checkout.title": { en: "Checkout", ar: "الدفع" },
  "checkout.product": { en: "Product", ar: "المنتج" },
  "checkout.subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "checkout.deliveryCharge": { en: "Delivery Charge", ar: "رسوم التوصيل" },
  "checkout.total": { en: "Total", ar: "الإجمالي" },
  "checkout.cashOnDelivery": { en: "Cash On Delivery", ar: "الدفع عند الاستلام" },
  "checkout.cashOnDeliveryDesc": { en: "Pay with cash upon delivery.", ar: "ادفع نقداً عند التسليم." },
  "checkout.placeOrder": { en: "Place Order", ar: "تأكيد الطلب" },
  "checkout.firstName": { en: "First Name", ar: "الاسم الأول" },
  "checkout.lastName": { en: "Last Name", ar: "اسم العائلة" },
  "checkout.email": { en: "Email", ar: "البريد الإلكتروني" },
  "checkout.phone": { en: "Phone", ar: "الهاتف" },
  "checkout.address": { en: "Address", ar: "العنوان" },
  "checkout.city": { en: "City", ar: "المدينة" },
  "checkout.state": { en: "State / Emirate", ar: "الإمارة" },
  "checkout.pinCode": { en: "PIN Code", ar: "الرمز البريدي" },
  "checkout.agreeTerms": { en: "I agree to the terms and conditions", ar: "أوافق على الشروط والأحكام" },
  "checkout.shippingDetails": { en: "Shipping Details", ar: "تفاصيل الشحن" },

  // Contact
  "contact.title": { en: "Contact Us", ar: "اتصل بنا" },
  "contact.getInTouch": { en: "Get In Touch", ar: "تواصل معنا" },
  "contact.name": { en: "Name", ar: "الاسم" },
  "contact.message": { en: "Message", ar: "الرسالة" },
  "contact.send": { en: "Send Message", ar: "إرسال الرسالة" },

  // Auth
  "auth.login": { en: "Log In", ar: "تسجيل الدخول" },
  "auth.signup": { en: "Sign Up", ar: "إنشاء حساب" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.forgotPassword": { en: "Forgot Password?", ar: "نسيت كلمة المرور؟" },
  "auth.noAccount": { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  "auth.hasAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },

  // Account
  "account.myAccount": { en: "My Account", ar: "حسابي" },
  "account.orders": { en: "My Orders", ar: "طلباتي" },
  "account.profile": { en: "Profile", ar: "الملف الشخصي" },
  "account.logout": { en: "Logout", ar: "تسجيل الخروج" },
  "account.noOrders": { en: "No orders yet", ar: "لا توجد طلبات بعد" },
} as const;

export type TranslationKey = keyof typeof translations;

export default translations;
