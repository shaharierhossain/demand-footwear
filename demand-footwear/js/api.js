/* =========================================================================
   DEMAND FOOTWEAR — api.js
   ---------------------------------------------------------------------
   THIS FILE IS THE "SIMULATED BACKEND" FOR THE FRONT-END DEMO.

   In production this file would be REPLACED by real HTTP calls to a
   secure Node.js/Express API (see /backend). Every exported function
   below (DF.api.*) has the exact same name/shape it would have if it
   were calling `fetch('/api/...')`, so swapping the implementation is
   a drop-in change — the rest of the app (products.js, cart.js,
   checkout.js, admin.js...) never touches localStorage directly.

   WHAT IS REAL vs SIMULATED
   - Real:      UI rendering, cart/wishlist logic, filtering/sorting,
                form validation, admin workflows.
   - Simulated: "database" (localStorage), "authentication" (a flag +
                fake token), "payment" (never actually charges anything).

   SECURITY NOTE: a browser cannot be trusted to hold secrets. No admin
   password, API key, or payment credential is EVER stored in this file.
   The admin "password" below is only a demo convenience and is clearly
   not how real authentication must work (see README + backend/).
   ========================================================================= */

(function (global) {
  "use strict";

  const STORAGE_KEYS = {
    PRODUCTS: "df_products",
    CATEGORIES: "df_categories",
    CUSTOMERS: "df_customers",
    ORDERS: "df_orders",
    REVIEWS: "df_reviews",
    INVENTORY_LOG: "df_inventory_log",
    CART: "df_cart",
    WISHLIST: "df_wishlist",
    SESSION: "df_session",
    ADMIN_SESSION: "df_admin_session",
    SEEDED: "df_seeded_v3",
  };

  /* ----------------------------------------------------------------
     Image helper — every product references a real Unsplash photo.
     If the remote image fails to load (offline demo, blocked network),
     onImgError() swaps in a locally-generated placeholder so the
     layout never breaks. See README "Replacing product images".
  ---------------------------------------------------------------- */
  function img(id, w = 800) {
    return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
  }
  function placeholderSvg(label) {
    const text = encodeURIComponent(label || "Demand Footwear");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><rect width='100%' height='100%' fill='%23e8dfcd'/><text x='50%' y='50%' font-family='Arial' font-size='34' fill='%2317140f' text-anchor='middle' dominant-baseline='middle'>${text}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${svg}`;
  }
  global.onImgError = function (el, label) {
    el.onerror = null;
    el.src = placeholderSvg(label || "Demand Footwear");
  };

  /* ----------------------------------------------------------------
     DEMO CATEGORY DATA
  ---------------------------------------------------------------- */
  const DEMO_CATEGORIES = [
    { id: "sneakers", name: "Sneakers", description: "Everyday sneakers built for comfort and street style.", image: img("photo-1549298916-b41d501d3772") },
    { id: "leather-shoes", name: "Leather Shoes", description: "Full-grain leather craftsmanship for a refined look.", image: img("photo-1614252369475-531eba835eb1") },
    { id: "formal", name: "Formal Shoes", description: "Sharp silhouettes for the boardroom and beyond.", image: img("photo-1533867617858-e7b97e060509") },
    { id: "casual", name: "Casual Shoes", description: "Relaxed, versatile pairs for day-to-day wear.", image: img("photo-1595950653106-6c9ebd614d3a") },
    { id: "boots", name: "Boots", description: "Durable boots engineered for rugged terrain.", image: img("photo-1608256246200-53e635b5b65f") },
    { id: "sandals", name: "Sandals", description: "Breathable sandals for warm-weather ease.", image: img("photo-1603487742131-4160ec999306") },
    { id: "accessories", name: "Accessories", description: "Care kits, belts and travel gear to complete the look.", image: img("photo-1622560480605-d83c853bc5d3") },
  ];

  /* ----------------------------------------------------------------
     DEMO PRODUCT CATALOG (20+ items, realistic fictional data)
     Each product mirrors the fields a real `products` table would hold.
  ---------------------------------------------------------------- */
  const now = () => new Date().toISOString();
  const SIZES_SHOE = ["38", "39", "40", "41", "42", "43", "44", "45"];

  function P(o) {
    return Object.assign({
      status: "active",
      createdAt: now(),
      updatedAt: now(),
      reserved: 0,
      lowStockThreshold: 8,
      tags: [],
      images: [],
    }, o);
  }

  const DEMO_PRODUCTS = [
    P({ id: "DF-001", sku: "DF-SNK-001", name: "Urban Runner Sneakers", brand: "Demand Athletics", category: "sneakers",
      description: "A lightweight everyday trainer with responsive cushioning and a breathable knit upper, built for city miles.",
      price: 129.0, discount: 15, sizes: SIZES_SHOE, colors: ["Black", "White", "Grey"], stock: 42, rating: 4.6, reviewCount: 128,
      tags: ["new", "bestseller"], images: [img("photo-1549298916-b41d501d3772"), img("photo-1600185365483-26d7a4cc7519")] }),

    P({ id: "DF-002", sku: "DF-LTH-002", name: "Classic Leather Oxford", brand: "Demand Heritage", category: "leather-shoes",
      description: "Hand-finished full-grain leather Oxfords with a Goodyear-welted sole for lasting comfort.",
      price: 189.0, discount: 0, sizes: SIZES_SHOE, colors: ["Brown", "Black"], stock: 18, rating: 4.8, reviewCount: 96,
      tags: ["formal"], images: [img("photo-1533867617858-e7b97e060509"), img("photo-1614253429340-98120bd6d753")] }),

    P({ id: "DF-003", sku: "DF-BT-003", name: "Premium Chelsea Boots", brand: "Demand Heritage", category: "boots",
      description: "Elastic-sided Chelsea boots in supple leather — equally at home with denim or tailoring.",
      price: 215.0, discount: 10, sizes: SIZES_SHOE, colors: ["Black", "Tan"], stock: 6, rating: 4.7, reviewCount: 74,
      tags: ["bestseller"], images: [img("photo-1608256246200-53e635b5b65f"), img("photo-1608231387042-66d1773070a5")] }),

    P({ id: "DF-004", sku: "DF-SNK-004", name: "Street Flex Sneakers", brand: "Demand Athletics", category: "sneakers",
      description: "Flexible outsole and a padded collar make this our most versatile street sneaker yet.",
      price: 109.0, discount: 20, sizes: SIZES_SHOE, colors: ["White", "Navy"], stock: 55, rating: 4.4, reviewCount: 61,
      tags: ["sale"], images: [img("photo-1595950653106-6c9ebd614d3a"), img("photo-1525966222134-fcfa99b8ae77")] }),

    P({ id: "DF-005", sku: "DF-CAS-005", name: "Everyday Comfort Shoes", brand: "Demand Basics", category: "casual",
      description: "Memory-foam insole and a soft canvas upper for shoes you can wear from morning to night.",
      price: 79.0, discount: 0, sizes: SIZES_SHOE, colors: ["Beige", "Grey", "Black"], stock: 33, rating: 4.3, reviewCount: 44,
      images: [img("photo-1517260911058-eea3d55d38e5"), img("photo-1491553895911-0055eca6402d")] }),

    P({ id: "DF-006", sku: "DF-SNK-006", name: "Minimal White Sneakers", brand: "Demand Athletics", category: "sneakers",
      description: "A clean, minimal silhouette in premium leather — the sneaker that goes with everything.",
      price: 139.0, discount: 0, sizes: SIZES_SHOE, colors: ["White"], stock: 4, rating: 4.9, reviewCount: 210,
      tags: ["bestseller", "new"], images: [img("photo-1560769629-975ec94e6a86"), img("photo-1543163521-1bf539c55dd2")] }),

    P({ id: "DF-007", sku: "DF-FOR-007", name: "Executive Derby Shoes", brand: "Demand Heritage", category: "formal",
      description: "Open-laced Derby shoes crafted from burnished leather for a polished, confident stride.",
      price: 175.0, discount: 12, sizes: SIZES_SHOE, colors: ["Black", "Brown"], stock: 21, rating: 4.5, reviewCount: 38,
      images: [img("photo-1614253429340-98120bd6d753"), img("photo-1533867617858-e7b97e060509")] }),

    P({ id: "DF-008", sku: "DF-LTH-008", name: "Classic Leather Loafers", brand: "Demand Heritage", category: "leather-shoes",
      description: "Slip-on loafers with a hand-stitched apron toe — effortless refinement for everyday wear.",
      price: 159.0, discount: 0, sizes: SIZES_SHOE, colors: ["Tan", "Black"], stock: 27, rating: 4.6, reviewCount: 52,
      images: [img("photo-1614252369475-531eba835eb1"), img("photo-1449505278894-297fdb3edbc1")] }),

    P({ id: "DF-009", sku: "DF-BT-009", name: "Trail Explorer Boots", brand: "Demand Outdoor", category: "boots",
      description: "Waterproof leather boots with an aggressive lug outsole, built for unpredictable trails.",
      price: 199.0, discount: 0, sizes: SIZES_SHOE, colors: ["Brown", "Olive"], stock: 15, rating: 4.7, reviewCount: 67,
      tags: ["new"], images: [img("photo-1608231387042-66d1773070a5"), img("photo-1608256246200-53e635b5b65f")] }),

    P({ id: "DF-010", sku: "DF-CAS-010", name: "Casual Canvas Shoes", brand: "Demand Basics", category: "casual",
      description: "A lightweight canvas upper with a vulcanized rubber sole for laid-back everyday style.",
      price: 65.0, discount: 25, sizes: SIZES_SHOE, colors: ["Red", "Navy", "White"], stock: 0, rating: 4.1, reviewCount: 29,
      tags: ["sale"], images: [img("photo-1491553895911-0055eca6402d"), img("photo-1517260911058-eea3d55d38e5")] }),

    P({ id: "DF-011", sku: "DF-SPT-011", name: "Sport Motion Trainers", brand: "Demand Athletics", category: "sneakers",
      description: "Engineered mesh trainers with dual-density foam for high-mileage training sessions.",
      price: 149.0, discount: 0, sizes: SIZES_SHOE, colors: ["Black", "Orange"], stock: 38, rating: 4.5, reviewCount: 83,
      images: [img("photo-1542291026-7eec264c27ff"), img("photo-1595341888016-a392ef81b7de")] }),

    P({ id: "DF-012", sku: "DF-ACC-012", name: "Premium Leather Belt", brand: "Demand Heritage", category: "accessories",
      description: "Full-grain leather belt with a brushed metal buckle — the finishing touch for formal or casual looks.",
      price: 45.0, discount: 0, sizes: ["S", "M", "L", "XL"], colors: ["Black", "Brown"], stock: 60, rating: 4.4, reviewCount: 22,
      images: [img("photo-1624222247344-550fb60583dc"), img("photo-1553062407-98eeb64c6a62")] }),

    P({ id: "DF-013", sku: "DF-ACC-013", name: "Shoe Care Kit", brand: "Demand Care", category: "accessories",
      description: "A complete cleaning, conditioning and shining kit to keep leather footwear looking new.",
      price: 29.0, discount: 0, sizes: ["One Size"], colors: ["Standard"], stock: 74, rating: 4.8, reviewCount: 41,
      images: [img("photo-1622560480605-d83c853bc5d3"), img("photo-1585386959984-a4155224a1ad")] }),

    P({ id: "DF-014", sku: "DF-ACC-014", name: "Leather Wallet", brand: "Demand Heritage", category: "accessories",
      description: "Slim bi-fold wallet in matching leather, with six card slots and a coin pocket.",
      price: 39.0, discount: 10, sizes: ["One Size"], colors: ["Black", "Brown"], stock: 3, rating: 4.5, reviewCount: 18,
      images: [img("photo-1553062407-98eeb64c6a62"), img("photo-1624222247344-550fb60583dc")] }),

    P({ id: "DF-015", sku: "DF-SPT-015", name: "Athletic Running Shoes", brand: "Demand Athletics", category: "sneakers",
      description: "A responsive foam midsole and engineered mesh keep feet cool over long distances.",
      price: 135.0, discount: 0, sizes: SIZES_SHOE, colors: ["Grey", "Blue"], stock: 47, rating: 4.6, reviewCount: 155,
      tags: ["bestseller"], images: [img("photo-1595341888016-a392ef81b7de"), img("photo-1542291026-7eec264c27ff")] }),

    P({ id: "DF-016", sku: "DF-FOR-016", name: "Classic Brown Brogues", brand: "Demand Heritage", category: "formal",
      description: "Full brogue detailing on rich brown leather — a statement shoe for special occasions.",
      price: 185.0, discount: 0, sizes: SIZES_SHOE, colors: ["Brown"], stock: 12, rating: 4.7, reviewCount: 33,
      images: [img("photo-1449505278894-297fdb3edbc1"), img("photo-1614253429340-98120bd6d753")] }),

    P({ id: "DF-017", sku: "DF-CAS-017", name: "Lightweight Walking Shoes", brand: "Demand Basics", category: "casual",
      description: "Ultra-light EVA sole and a breathable knit upper designed for all-day walking comfort.",
      price: 89.0, discount: 0, sizes: SIZES_SHOE, colors: ["Grey", "Black"], stock: 29, rating: 4.4, reviewCount: 51,
      images: [img("photo-1525966222134-fcfa99b8ae77"), img("photo-1600185365483-26d7a4cc7519")] }),

    P({ id: "DF-018", sku: "DF-CAS-018", name: "Casual Slip-On Shoes", brand: "Demand Basics", category: "casual",
      description: "No-lace convenience with a cushioned footbed — easy to wear, easy to love.",
      price: 69.0, discount: 15, sizes: SIZES_SHOE, colors: ["Black", "Beige"], stock: 24, rating: 4.2, reviewCount: 27,
      tags: ["sale"], images: [img("photo-1520639888713-7851133b1ed0"), img("photo-1595950653106-6c9ebd614d3a")] }),

    P({ id: "DF-019", sku: "DF-ACC-019", name: "Premium Shoe Polish", brand: "Demand Care", category: "accessories",
      description: "Wax-based polish formulated to restore shine and protect fine leather footwear.",
      price: 15.0, discount: 0, sizes: ["One Size"], colors: ["Neutral", "Black", "Brown"], stock: 90, rating: 4.6, reviewCount: 35,
      images: [img("photo-1585386959984-a4155224a1ad"), img("photo-1622560480605-d83c853bc5d3")] }),

    P({ id: "DF-020", sku: "DF-ACC-020", name: "Travel Shoe Bag", brand: "Demand Care", category: "accessories",
      description: "A dust-proof drawstring bag that keeps up to two pairs of shoes protected while travelling.",
      price: 19.0, discount: 0, sizes: ["One Size"], colors: ["Charcoal"], stock: 51, rating: 4.3, reviewCount: 14,
      images: [img("photo-1553062407-98eeb64c6a62"), img("photo-1624222247344-550fb60583dc")] }),

    P({ id: "DF-021", sku: "DF-SND-021", name: "Coastal Leather Sandals", brand: "Demand Basics", category: "sandals",
      description: "Adjustable buckle sandals in soft leather with a cushioned, contoured footbed.",
      price: 59.0, discount: 0, sizes: SIZES_SHOE, colors: ["Tan", "Black"], stock: 36, rating: 4.3, reviewCount: 23,
      tags: ["new"], images: [img("photo-1603487742131-4160ec999306"), img("photo-1603808033176-38b0d4cbf1c6")] }),

    P({ id: "DF-022", sku: "DF-SND-022", name: "Trail Sport Sandals", brand: "Demand Outdoor", category: "sandals",
      description: "Sport sandals with a grippy outsole and quick-adjust straps for outdoor adventures.",
      price: 55.0, discount: 10, sizes: SIZES_SHOE, colors: ["Black", "Grey"], stock: 7, rating: 4.2, reviewCount: 19,
      images: [img("photo-1603808033176-38b0d4cbf1c6"), img("photo-1603487742131-4160ec999306")] }),

    P({ id: "DF-023", sku: "DF-BT-023", name: "Urban Combat Boots", brand: "Demand Outdoor", category: "boots",
      description: "Rugged lace-up boots with reinforced toe caps, styled for city streets.",
      price: 165.0, discount: 0, sizes: SIZES_SHOE, colors: ["Black"], stock: 20, rating: 4.5, reviewCount: 46,
      images: [img("photo-1638247025967-b4e38f787b76"), img("photo-1608256246200-53e635b5b65f")] }),

    P({ id: "DF-024", sku: "DF-SNK-024", name: "Retro Court Sneakers", brand: "Demand Athletics", category: "sneakers",
      description: "A retro-inspired court silhouette with a padded tongue and vulcanized sole.",
      price: 119.0, discount: 0, sizes: SIZES_SHOE, colors: ["White", "Green"], stock: 31, rating: 4.5, reviewCount: 58,
      images: [img("photo-1525966222134-fcfa99b8ae77"), img("photo-1560769629-975ec94e6a86")] }),
  ];

  /* ----------------------------------------------------------------
     DEMO CUSTOMERS
  ---------------------------------------------------------------- */
  const DEMO_CUSTOMERS = [
    { id: "CU-1001", name: "Amelia Chowdhury", email: "amelia.c@example.com", phone: "+880 1711-000111", registered: "2025-11-02", status: "active" },
    { id: "CU-1002", name: "Rafiul Islam", email: "rafiul.i@example.com", phone: "+880 1811-000222", registered: "2025-12-14", status: "active" },
    { id: "CU-1003", name: "Sara Ahmed", email: "sara.a@example.com", phone: "+880 1911-000333", registered: "2026-01-05", status: "active" },
    { id: "CU-1004", name: "Tanvir Hasan", email: "tanvir.h@example.com", phone: "+880 1611-000444", registered: "2026-02-18", status: "inactive" },
    { id: "CU-1005", name: "Nusrat Jahan", email: "nusrat.j@example.com", phone: "+880 1511-000555", registered: "2026-03-22", status: "active" },
    { id: "CU-1006", name: "Kamal Hossain", email: "kamal.h@example.com", phone: "+880 1311-000666", registered: "2026-04-30", status: "active" },
  ];

  /* ----------------------------------------------------------------
     DEMO REVIEWS (clearly sample content)
  ---------------------------------------------------------------- */
  const DEMO_REVIEWS = [
    { id: "RV-1", productId: "DF-001", customer: "Amelia C.", rating: 5, text: "Incredibly comfortable for daily wear — my go-to sneaker now.", productName: "Urban Runner Sneakers" },
    { id: "RV-2", productId: "DF-006", customer: "Rafiul I.", rating: 5, text: "The fit and finish are excellent, looks far more premium than the price.", productName: "Minimal White Sneakers" },
    { id: "RV-3", productId: "DF-003", customer: "Sara A.", rating: 4, text: "Beautiful boots, took a week to break in but worth it.", productName: "Premium Chelsea Boots" },
    { id: "RV-4", productId: "DF-002", customer: "Tanvir H.", rating: 5, text: "Sharp, classic, and the leather only gets better with age.", productName: "Classic Leather Oxford" },
    { id: "RV-5", productId: "DF-015", customer: "Nusrat J.", rating: 5, text: "Lightweight and breathable — perfect for my morning runs.", productName: "Athletic Running Shoes" },
    { id: "RV-6", productId: "DF-009", customer: "Kamal H.", rating: 4, text: "Kept my feet dry on a rainy hike, very happy with the grip.", productName: "Trail Explorer Boots" },
  ];

  /* ----------------------------------------------------------------
     DEMO ORDERS (used to pre-populate the admin dashboard)
  ---------------------------------------------------------------- */
  function buildDemoOrders() {
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
    const payStatuses = ["Pending", "Paid", "Failed", "Refunded", "Cash on Delivery"];
    const orders = [];
    let day = new Date();
    for (let i = 0; i < 18; i++) {
      const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
      const items = [];
      const numItems = 1 + (i % 3);
      let subtotal = 0;
      for (let j = 0; j < numItems; j++) {
        const p = DEMO_PRODUCTS[(i * 3 + j) % DEMO_PRODUCTS.length];
        const qty = 1 + ((i + j) % 2);
        const finalPrice = +(p.price * (1 - p.discount / 100)).toFixed(2);
        subtotal += finalPrice * qty;
        items.push({ productId: p.id, name: p.name, image: p.images[0], price: finalPrice, qty, size: p.sizes[0], color: p.colors[0] });
      }
      const delivery = i % 4 === 0 ? 0 : 5.99;
      const tax = +(subtotal * 0.05).toFixed(2);
      const total = +(subtotal + delivery + tax).toFixed(2);
      const d = new Date(day.getTime() - i * 36 * 60 * 60 * 1000);
      orders.push({
        id: "DF-ORD-" + (10230 + i),
        customerId: cust.id,
        customerName: cust.name,
        email: cust.email,
        date: d.toISOString(),
        items,
        subtotal: +subtotal.toFixed(2),
        delivery, tax, discount: 0, total,
        status: statuses[i % statuses.length],
        paymentStatus: payStatuses[i % payStatuses.length],
        paymentMethod: ["Cash on Delivery", "Card Payment", "Mobile Payment", "Bank Transfer"][i % 4],
        address: { line1: "House 12, Road 5", city: "Dhaka", state: "Dhaka Division", zip: "1212", country: "Bangladesh" },
        deliveryMethod: i % 3 === 0 ? "Express" : "Standard",
      });
    }
    return orders;
  }

  /* ----------------------------------------------------------------
     LocalStorage helpers
  ---------------------------------------------------------------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Storage write failed", e); }
  }
  function uid(prefix) { return prefix + "-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100); }

  /* ----------------------------------------------------------------
     Seed on first run (or after a version bump / manual reset)
  ---------------------------------------------------------------- */
  function seedIfNeeded(force) {
    if (!force && localStorage.getItem(STORAGE_KEYS.SEEDED)) return;
    write(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
    write(STORAGE_KEYS.CATEGORIES, DEMO_CATEGORIES);
    write(STORAGE_KEYS.CUSTOMERS, DEMO_CUSTOMERS);
    write(STORAGE_KEYS.ORDERS, buildDemoOrders());
    write(STORAGE_KEYS.REVIEWS, DEMO_REVIEWS);
    write(STORAGE_KEYS.INVENTORY_LOG, []);
    localStorage.setItem(STORAGE_KEYS.SEEDED, "1");
  }
  seedIfNeeded(false);

  function resetDemoData() {
    seedIfNeeded(true);
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);
  }

  /* =========================================================================
     PUBLIC API — same shape as a real REST client (see js/README notes).
     Every method returns a resolved Promise so calling code (already written
     against `await DF.api.fetchProducts()`) needs ZERO changes when this
     block is later replaced by real `fetch('/api/...')` calls.
     ========================================================================= */
  const api = {
    // ---- PRODUCTS ----
    async fetchProducts() { return read(STORAGE_KEYS.PRODUCTS, []); },
    async fetchProductById(id) { return read(STORAGE_KEYS.PRODUCTS, []).find(p => p.id === id) || null; },
    async createProduct(data) {
      const list = read(STORAGE_KEYS.PRODUCTS, []);
      const product = Object.assign({
        id: uid("DF"), status: "active", createdAt: now(), updatedAt: now(), reserved: 0, rating: 0, reviewCount: 0, tags: [],
      }, data);
      list.unshift(product);
      write(STORAGE_KEYS.PRODUCTS, list);
      return product;
    },
    async updateProduct(id, data) {
      const list = read(STORAGE_KEYS.PRODUCTS, []);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error("Product not found");
      list[idx] = Object.assign({}, list[idx], data, { updatedAt: now() });
      write(STORAGE_KEYS.PRODUCTS, list);
      return list[idx];
    },
    async deleteProduct(id) {
      const list = read(STORAGE_KEYS.PRODUCTS, []).filter(p => p.id !== id);
      write(STORAGE_KEYS.PRODUCTS, list);
      return true;
    },
    async duplicateProduct(id) {
      const list = read(STORAGE_KEYS.PRODUCTS, []);
      const src = list.find(p => p.id === id);
      if (!src) throw new Error("Product not found");
      const copy = Object.assign({}, src, { id: uid("DF"), sku: src.sku + "-COPY", name: src.name + " (Copy)", createdAt: now(), updatedAt: now() });
      list.unshift(copy);
      write(STORAGE_KEYS.PRODUCTS, list);
      return copy;
    },

    // ---- CATEGORIES ----
    async fetchCategories() { return read(STORAGE_KEYS.CATEGORIES, []); },
    async createCategory(data) {
      const list = read(STORAGE_KEYS.CATEGORIES, []);
      const cat = Object.assign({ id: (data.name || "cat").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 999) }, data);
      list.push(cat); write(STORAGE_KEYS.CATEGORIES, list); return cat;
    },
    async updateCategory(id, data) {
      const list = read(STORAGE_KEYS.CATEGORIES, []);
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) throw new Error("Category not found");
      list[idx] = Object.assign({}, list[idx], data);
      write(STORAGE_KEYS.CATEGORIES, list);
      return list[idx];
    },
    async deleteCategory(id) {
      write(STORAGE_KEYS.CATEGORIES, read(STORAGE_KEYS.CATEGORIES, []).filter(c => c.id !== id));
      return true;
    },

    // ---- INVENTORY ----
    async fetchInventory() { return read(STORAGE_KEYS.PRODUCTS, []); },
    async fetchInventoryLog(productId) {
      const log = read(STORAGE_KEYS.INVENTORY_LOG, []);
      return productId ? log.filter(l => l.productId === productId) : log;
    },
    /**
     * Adjust stock for a product. In PRODUCTION this must run inside a
     * database transaction on the server (SELECT ... FOR UPDATE / row lock)
     * so two simultaneous orders can never oversell the same pair of shoes.
     * The localStorage version below is for demo purposes ONLY and is not
     * safe against concurrent writes from multiple tabs/devices.
     */
    async updateInventory(productId, delta, reason, user) {
      const list = read(STORAGE_KEYS.PRODUCTS, []);
      const idx = list.findIndex(p => p.id === productId);
      if (idx === -1) throw new Error("Product not found");
      const previous = list[idx].stock;
      const next = Math.max(0, previous + delta);
      list[idx].stock = next;
      list[idx].updatedAt = now();
      write(STORAGE_KEYS.PRODUCTS, list);

      const log = read(STORAGE_KEYS.INVENTORY_LOG, []);
      log.unshift({
        id: uid("ADJ"), productId, productName: list[idx].name, previous, adjustment: delta, next,
        reason: reason || "Manual adjustment", date: now(), user: user || "admin",
      });
      write(STORAGE_KEYS.INVENTORY_LOG, log);
      return list[idx];
    },

    // ---- ORDERS ----
    async fetchOrders() { return read(STORAGE_KEYS.ORDERS, []); },
    async fetchOrderById(id) { return read(STORAGE_KEYS.ORDERS, []).find(o => o.id === id) || null; },
    async createOrder(order) {
      // NOTE: for the demo, totals are computed client-side. In production
      // the server MUST recompute price/stock/tax/total independently and
      // never trust numbers submitted by the browser (see README > Security).
      const list = read(STORAGE_KEYS.ORDERS, []);
      const newOrder = Object.assign({ id: uid("DF-ORD"), date: now(), status: "Pending" }, order);
      list.unshift(newOrder);
      write(STORAGE_KEYS.ORDERS, list);
      // Deduct simulated stock for each purchased item/size combo.
      for (const item of newOrder.items) {
        try { await api.updateInventory(item.productId, -item.qty, "Order " + newOrder.id, "system"); } catch (e) { /* ignore */ }
      }
      return newOrder;
    },
    async updateOrderStatus(id, status) {
      const list = read(STORAGE_KEYS.ORDERS, []);
      const idx = list.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Order not found");
      list[idx].status = status;
      write(STORAGE_KEYS.ORDERS, list);
      return list[idx];
    },
    async updatePaymentStatus(id, paymentStatus) {
      const list = read(STORAGE_KEYS.ORDERS, []);
      const idx = list.findIndex(o => o.id === id);
      if (idx === -1) throw new Error("Order not found");
      list[idx].paymentStatus = paymentStatus;
      write(STORAGE_KEYS.ORDERS, list);
      return list[idx];
    },

    // ---- CUSTOMERS ----
    async fetchCustomers() { return read(STORAGE_KEYS.CUSTOMERS, []); },
    async fetchCustomerById(id) { return read(STORAGE_KEYS.CUSTOMERS, []).find(c => c.id === id) || null; },

    // ---- REVIEWS ----
    async fetchReviews(productId) {
      const list = read(STORAGE_KEYS.REVIEWS, []);
      return productId ? list.filter(r => r.productId === productId) : list;
    },

    // ---- CART (per-browser, demo persistence) ----
    getCart() { return read(STORAGE_KEYS.CART, []); },
    saveCart(cart) { write(STORAGE_KEYS.CART, cart); },

    // ---- WISHLIST ----
    getWishlist() { return read(STORAGE_KEYS.WISHLIST, []); },
    saveWishlist(list) { write(STORAGE_KEYS.WISHLIST, list); },

    // ---- AUTH (demo only — see README for real implementation) ----
    /**
     * SECURITY: this is a simulated, front-end-only "session" so the
     * customer/admin demo pages have something to gate on. No real
     * password is stored or checked here. Production auth MUST happen
     * on the server using hashed passwords (bcrypt/argon2) and
     * signed, HTTP-only session cookies or short-lived JWTs.
     */
    async loginCustomer(email) {
      const session = { email, name: email.split("@")[0], loggedInAt: now() };
      write(STORAGE_KEYS.SESSION, session);
      return session;
    },
    async registerCustomer(data) {
      const list = read(STORAGE_KEYS.CUSTOMERS, []);
      const cust = { id: uid("CU"), name: data.name, email: data.email, phone: data.phone || "", registered: now().slice(0, 10), status: "active" };
      list.push(cust); write(STORAGE_KEYS.CUSTOMERS, list);
      write(STORAGE_KEYS.SESSION, { email: data.email, name: data.name, loggedInAt: now() });
      return cust;
    },
    getSession() { return read(STORAGE_KEYS.SESSION, null); },
    logoutCustomer() { localStorage.removeItem(STORAGE_KEYS.SESSION); },

    async loginAdmin(username, password) {
      // Demo-only gate. Real admin auth must be verified server-side.
      if (username === "admin" && password === "demand2026") {
        const session = { username, token: "demo-" + uid("TKN"), loggedInAt: now() };
        write(STORAGE_KEYS.ADMIN_SESSION, session);
        return session;
      }
      throw new Error("Invalid administrator credentials");
    },
    getAdminSession() { return read(STORAGE_KEYS.ADMIN_SESSION, null); },
    logoutAdmin() { localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION); },

    // ---- UTIL ----
    resetDemoData,
  };

  global.DF = global.DF || {};
  global.DF.api = api;
  global.DF.keys = STORAGE_KEYS;
})(window);
