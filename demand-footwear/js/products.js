/* =========================================================================
   DEMAND FOOTWEAR — products.js
   Product card rendering + Shop page filters/sort + Product Detail Page
   ========================================================================= */

(function () {
  "use strict";

  const COLOR_HEX = {
    Black: "#17140f", White: "#f5f2ea", Grey: "#9a9488", Navy: "#1f2a44", Brown: "#6a4326",
    Tan: "#c99a63", Beige: "#e3d3ad", Blue: "#2f5aa6", Orange: "#c1591f", Red: "#a3281c",
    Green: "#3d5c3a", Olive: "#5a5b3c", Charcoal: "#33302a", Neutral: "#cfc7b4", Standard: "#cfc7b4", "One Size": "#cfc7b4",
  };

  function finalPrice(p) { return +(p.price * (1 - (p.discount || 0) / 100)).toFixed(2); }
  function stars(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }
  function stockInfo(p) {
    if (p.status === "discontinued") return { label: "Discontinued", cls: "stock-out" };
    if (p.stock <= 0) return { label: "Out of Stock", cls: "stock-out" };
    if (p.stock <= (p.lowStockThreshold || 8)) return { label: `Low Stock — ${p.stock} left`, cls: "stock-low" };
    return { label: "In Stock", cls: "stock-in" };
  }

  /* ---------------- Product Card ---------------- */
  function productCardHTML(p) {
    const price = finalPrice(p);
    const stock = stockInfo(p);
    const wished = window.DFwishlist ? window.DFwishlist.isWishlisted(p.id) : false;
    const isNew = (p.tags || []).includes("new");
    const isBest = (p.tags || []).includes("bestseller");
    const img2 = p.images[1] || p.images[0];
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-media">
        <a href="product.html?id=${p.id}" tabindex="-1">
          <img src="${p.images[0]}" alt="${p.name} — ${p.category}" loading="lazy" onerror="onImgError(this,'${p.name}')">
          <img class="img-alt" src="${img2}" alt="" loading="lazy" onerror="onImgError(this,'${p.name}')">
        </a>
        <div class="product-badges">
          ${isNew ? '<span class="badge badge-new">New</span>' : ""}
          ${p.discount > 0 ? `<span class="badge badge-sale">-${p.discount}%</span>` : ""}
          ${stock.cls === "stock-low" ? '<span class="badge badge-low">Low Stock</span>' : ""}
          ${stock.cls === "stock-out" ? '<span class="badge badge-out">Sold Out</span>' : ""}
        </div>
        <button class="product-wishlist ${wished ? "active" : ""}" data-wishlist-btn="${p.id}" aria-label="Toggle wishlist" aria-pressed="${wished}">
          <i class="bi ${wished ? "bi-heart-fill" : "bi-heart"}"></i>
        </button>
        <div class="product-quickview">
          <button class="btn btn-outline-light btn-sm btn-block" data-quickview="${p.id}" style="background:rgba(255,255,255,.94);color:var(--df-black);border-color:transparent;">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-cat">${p.brand} &middot; ${labelForCategory(p.category)}</span>
        <h3 class="product-name"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="product-rating"><span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} (${p.reviewCount})</div>
        <div class="product-price">
          <span class="price-now">$${price.toFixed(2)}</span>
          ${p.discount > 0 ? `<span class="price-old">$${p.price.toFixed(2)}</span><span class="price-off">Save ${p.discount}%</span>` : ""}
        </div>
        <div class="color-dots">${(p.colors || []).slice(0, 5).map(c => `<span class="color-dot" style="background:${COLOR_HEX[c] || "#ccc"}" title="${c}"></span>`).join("")}</div>
        <span class="stock-line ${stock.cls}">${stock.label}</span>
        <div class="product-actions-row">
          <button class="btn btn-primary" data-add-cart="${p.id}" ${p.stock <= 0 ? "disabled" : ""}><i class="bi bi-bag-plus"></i>&nbsp;Add</button>
          <button class="btn btn-ghost btn-icon" data-quickview="${p.id}" aria-label="Quick view"><i class="bi bi-eye"></i></button>
        </div>
      </div>
    </article>`;
  }

  let CATEGORY_MAP = {};
  function labelForCategory(id) { return CATEGORY_MAP[id] || id; }

  function wireProductGridEvents(root) {
    root.addEventListener("click", async (e) => {
      const wishBtn = e.target.closest("[data-wishlist-btn]");
      if (wishBtn) { window.DFwishlist.toggleWishlist(wishBtn.dataset.wishlistBtn); return; }

      const addBtn = e.target.closest("[data-add-cart]");
      if (addBtn) {
        const product = await window.DF.api.fetchProductById(addBtn.dataset.addCart);
        await window.DFcart.addToCart(product.id, 1, product.sizes[0], product.colors[0]);
        return;
      }

      const qvBtn = e.target.closest("[data-quickview]");
      if (qvBtn) { openQuickView(qvBtn.dataset.quickview); return; }
    });
  }

  async function openQuickView(id) {
    const p = await window.DF.api.fetchProductById(id);
    if (!p) return;
    const stock = stockInfo(p);
    const html = `
      <div class="pdp-grid" style="padding:28px;">
        <div><div class="pdp-gallery-main"><img src="${p.images[0]}" alt="${p.name}" onerror="onImgError(this,'${p.name}')"></div></div>
        <div>
          <span class="pdp-brand">${p.brand}</span>
          <h2 class="pdp-title">${p.name}</h2>
          <div class="product-rating" style="margin-bottom:10px;"><span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} (${p.reviewCount} reviews)</div>
          <div class="pdp-price-row"><span class="price-now">$${finalPrice(p).toFixed(2)}</span>${p.discount > 0 ? `<span class="price-old">$${p.price.toFixed(2)}</span>` : ""}</div>
          <p class="pdp-desc">${p.description}</p>
          <span class="stock-line ${stock.cls}">${stock.label}</span>
          <div class="pdp-actions">
            <a class="btn btn-primary" href="product.html?id=${p.id}">View Full Details</a>
            <button class="btn btn-ghost" data-wishlist-btn="${p.id}" data-quickview-wish="1">${window.DFwishlist.isWishlisted(p.id) ? "Remove Wishlist" : "Add to Wishlist"}</button>
          </div>
        </div>
      </div>`;
    const modal = openModal(html, "quickViewModal");
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-quickview-wish]")) window.DFwishlist.toggleWishlist(p.id);
    });
  }

  /* ---------------- HOME PAGE ---------------- */
  async function initHomePage() {
    const catRoot = document.getElementById("homeCategories");
    const featuredRoot = document.getElementById("homeFeatured");
    const newRoot = document.getElementById("homeNewArrivals");
    const bestRoot = document.getElementById("homeBestSellers");
    const reviewRoot = document.getElementById("homeReviews");
    if (!catRoot && !featuredRoot) return;

    const [categories, products, reviews] = await Promise.all([
      window.DF.api.fetchCategories(), window.DF.api.fetchProducts(), window.DF.api.fetchReviews(),
    ]);
    CATEGORY_MAP = Object.fromEntries(categories.map(c => [c.id, c.name]));

    if (catRoot) {
      catRoot.innerHTML = categories.map(c => `
        <div class="cat-card reveal">
          <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="onImgError(this,'${c.name}')">
          <div class="cat-card-body">
            <h3>${c.name}</h3>
            <p>${c.description}</p>
            <a class="section-link" href="shop.html?category=${c.id}">View Collection →</a>
          </div>
        </div>`).join("");
    }
    if (featuredRoot) {
      const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 8);
      featuredRoot.innerHTML = featured.map(productCardHTML).join("");
      wireProductGridEvents(featuredRoot);
    }
    if (newRoot) {
      const arrivals = products.filter(p => (p.tags || []).includes("new")).concat(products).slice(0, 8);
      newRoot.innerHTML = [...new Set(arrivals)].slice(0, 8).map(productCardHTML).join("");
      wireProductGridEvents(newRoot);
    }
    if (bestRoot) {
      const best = products.filter(p => (p.tags || []).includes("bestseller")).concat([...products].sort((a, b) => b.reviewCount - a.reviewCount)).slice(0, 8);
      bestRoot.innerHTML = [...new Set(best)].slice(0, 8).map(productCardHTML).join("");
      wireProductGridEvents(bestRoot);
    }
    if (reviewRoot) {
      reviewRoot.innerHTML = reviews.slice(0, 6).map(r => `
        <div class="review-card reveal">
          <div class="review-head">
            <div class="review-avatar">${r.customer.charAt(0)}</div>
            <div><div class="review-name">${r.customer}</div><div class="review-product">on ${r.productName}</div></div>
          </div>
          <div class="review-stars">${stars(r.rating)}</div>
          <p class="review-text">"${r.text}"</p>
          <span class="demo-tag">Sample review</span>
        </div>`).join("");
    }
    setTimeout(() => window.dispatchEvent(new Event("scroll")), 10);
  }

  /* ---------------- SHOP PAGE ---------------- */
  const shopState = { q: "", category: "", brands: [], sizes: [], colors: [], minPrice: null, maxPrice: null, rating: 0, availability: "", discountOnly: false, sort: "featured", page: 1, pageSize: 12 };

  function readQueryParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("category")) shopState.category = params.get("category");
    if (params.get("q")) shopState.q = params.get("q");
    if (params.get("filter") === "new") shopState.tagFilter = "new";
    if (params.get("filter") === "bestseller") shopState.tagFilter = "bestseller";
    if (params.get("filter") === "sale") shopState.discountOnly = true;
  }

  async function initShopPage() {
    const grid = document.getElementById("shopGrid");
    if (!grid) return;
    readQueryParams();
    const [categories, products] = await Promise.all([window.DF.api.fetchCategories(), window.DF.api.fetchProducts()]);
    CATEGORY_MAP = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const brands = [...new Set(products.map(p => p.brand))];
    const allColors = [...new Set(products.flatMap(p => p.colors))].filter(c => COLOR_HEX[c]);
    const allSizes = [...new Set(products.flatMap(p => p.sizes))].sort();

    renderFilterPanel(categories, brands, allColors, allSizes, products);
    applyFiltersAndRender(products);

    document.getElementById("clearFiltersBtn")?.addEventListener("click", () => {
      Object.assign(shopState, { q: "", category: "", brands: [], sizes: [], colors: [], minPrice: null, maxPrice: null, rating: 0, availability: "", discountOnly: false, tagFilter: null, page: 1 });
      history.replaceState(null, "", "shop.html");
      renderFilterPanel(categories, brands, allColors, allSizes, products);
      applyFiltersAndRender(products);
    });

    document.getElementById("shopSearchInput")?.addEventListener("input", (e) => {
      shopState.q = e.target.value; shopState.page = 1; applyFiltersAndRender(products);
    });
    document.getElementById("sortSelect")?.addEventListener("change", (e) => { shopState.sort = e.target.value; applyFiltersAndRender(products); });
  }

  function renderFilterPanel(categories, brands, colors, sizes, products) {
    const panel = document.getElementById("filtersPanel");
    if (!panel) return;
    panel.innerHTML = `
      <div class="filter-block">
        <h4>Category</h4>
        ${categories.map(c => `
          <label class="filter-opt">
            <span><input type="radio" name="catf" value="${c.id}" ${shopState.category === c.id ? "checked" : ""}> ${c.name}</span>
            <span class="count">${products.filter(p => p.category === c.id).length}</span>
          </label>`).join("")}
        <label class="filter-opt"><span><input type="radio" name="catf" value="" ${!shopState.category ? "checked" : ""}> All Categories</span></label>
      </div>
      <div class="filter-block">
        <h4>Brand</h4>
        ${brands.map(b => `<label class="filter-opt"><span><input type="checkbox" value="${b}" class="brandf" ${shopState.brands.includes(b) ? "checked" : ""}> ${b}</span></label>`).join("")}
      </div>
      <div class="filter-block">
        <h4>Price Range</h4>
        <div class="form-row">
          <input type="number" min="0" placeholder="Min" class="form-control" id="minPriceInput" value="${shopState.minPrice ?? ""}">
          <input type="number" min="0" placeholder="Max" class="form-control" id="maxPriceInput" value="${shopState.maxPrice ?? ""}">
        </div>
      </div>
      <div class="filter-block">
        <h4>Size</h4>
        <div class="size-chip-row">${sizes.map(s => `<button type="button" class="size-chip ${shopState.sizes.includes(s) ? "active" : ""}" data-size="${s}">${s}</button>`).join("")}</div>
      </div>
      <div class="filter-block">
        <h4>Color</h4>
        <div class="color-swatch-row">${colors.map(c => `<button type="button" class="color-swatch ${shopState.colors.includes(c) ? "active" : ""}" style="background:${COLOR_HEX[c]}" data-color="${c}" title="${c}" aria-label="${c}"></button>`).join("")}</div>
      </div>
      <div class="filter-block">
        <h4>Rating</h4>
        ${[4, 3, 2].map(r => `<label class="filter-opt"><span><input type="radio" name="ratef" value="${r}" ${shopState.rating === r ? "checked" : ""}> ${"★".repeat(r)} &amp; up</span></label>`).join("")}
        <label class="filter-opt"><span><input type="radio" name="ratef" value="0" ${!shopState.rating ? "checked" : ""}> Any Rating</span></label>
      </div>
      <div class="filter-block">
        <h4>Availability</h4>
        <label class="filter-opt"><span><input type="checkbox" id="inStockOnly" ${shopState.availability === "in" ? "checked" : ""}> In Stock Only</span></label>
        <label class="filter-opt"><span><input type="checkbox" id="discountOnly" ${shopState.discountOnly ? "checked" : ""}> On Sale Only</span></label>
      </div>
      <button class="btn btn-ghost btn-block" id="clearFiltersBtn">Clear Filters</button>`;

    panel.querySelectorAll('input[name="catf"]').forEach(el => el.addEventListener("change", (e) => { shopState.category = e.target.value; shopState.page = 1; applyFiltersAndRender(products); }));
    panel.querySelectorAll(".brandf").forEach(el => el.addEventListener("change", () => {
      shopState.brands = [...panel.querySelectorAll(".brandf:checked")].map(i => i.value); shopState.page = 1; applyFiltersAndRender(products);
    }));
    panel.querySelectorAll(".size-chip").forEach(el => el.addEventListener("click", () => {
      el.classList.toggle("active");
      shopState.sizes = [...panel.querySelectorAll(".size-chip.active")].map(i => i.dataset.size);
      shopState.page = 1; applyFiltersAndRender(products);
    }));
    panel.querySelectorAll(".color-swatch").forEach(el => el.addEventListener("click", () => {
      el.classList.toggle("active");
      shopState.colors = [...panel.querySelectorAll(".color-swatch.active")].map(i => i.dataset.color);
      shopState.page = 1; applyFiltersAndRender(products);
    }));
    panel.querySelectorAll('input[name="ratef"]').forEach(el => el.addEventListener("change", (e) => { shopState.rating = +e.target.value; shopState.page = 1; applyFiltersAndRender(products); }));
    document.getElementById("minPriceInput")?.addEventListener("change", (e) => { shopState.minPrice = e.target.value ? +e.target.value : null; applyFiltersAndRender(products); });
    document.getElementById("maxPriceInput")?.addEventListener("change", (e) => { shopState.maxPrice = e.target.value ? +e.target.value : null; applyFiltersAndRender(products); });
    document.getElementById("inStockOnly")?.addEventListener("change", (e) => { shopState.availability = e.target.checked ? "in" : ""; applyFiltersAndRender(products); });
    document.getElementById("discountOnly")?.addEventListener("change", (e) => { shopState.discountOnly = e.target.checked; applyFiltersAndRender(products); });
  }

  function filterProducts(products) {
    return products.filter(p => {
      if (shopState.q) {
        const q = shopState.q.toLowerCase();
        if (!(p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))) return false;
      }
      if (shopState.category && p.category !== shopState.category) return false;
      if (shopState.brands.length && !shopState.brands.includes(p.brand)) return false;
      if (shopState.sizes.length && !p.sizes.some(s => shopState.sizes.includes(s))) return false;
      if (shopState.colors.length && !p.colors.some(c => shopState.colors.includes(c))) return false;
      if (shopState.minPrice != null && finalPrice(p) < shopState.minPrice) return false;
      if (shopState.maxPrice != null && finalPrice(p) > shopState.maxPrice) return false;
      if (shopState.rating && p.rating < shopState.rating) return false;
      if (shopState.availability === "in" && p.stock <= 0) return false;
      if (shopState.discountOnly && !(p.discount > 0)) return false;
      if (shopState.tagFilter && !(p.tags || []).includes(shopState.tagFilter)) return false;
      return true;
    });
  }

  function sortProducts(products) {
    const list = [...products];
    switch (shopState.sort) {
      case "newest": return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "price-asc": return list.sort((a, b) => finalPrice(a) - finalPrice(b));
      case "price-desc": return list.sort((a, b) => finalPrice(b) - finalPrice(a));
      case "rating": return list.sort((a, b) => b.rating - a.rating);
      case "selling": return list.sort((a, b) => b.reviewCount - a.reviewCount);
      default: return list;
    }
  }

  function applyFiltersAndRender(allProducts) {
    const grid = document.getElementById("shopGrid");
    const filtered = sortProducts(filterProducts(allProducts));
    const countEl = document.getElementById("resultCount");
    if (countEl) countEl.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;

    const totalPages = Math.max(1, Math.ceil(filtered.length / shopState.pageSize));
    shopState.page = Math.min(shopState.page, totalPages);
    const pageItems = filtered.slice((shopState.page - 1) * shopState.pageSize, shopState.page * shopState.pageSize);

    if (pageItems.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon"><i class="bi bi-search"></i></div><h3>No products found</h3><p>Try adjusting or clearing your filters.</p></div>`;
    } else {
      grid.innerHTML = pageItems.map(productCardHTML).join("");
      wireProductGridEvents(grid);
    }
    renderPagination(totalPages, allProducts);
  }

  function renderPagination(totalPages, allProducts) {
    const root = document.getElementById("shopPagination");
    if (!root) return;
    if (totalPages <= 1) { root.innerHTML = ""; return; }
    let html = "";
    for (let i = 1; i <= totalPages; i++) html += `<button class="${i === shopState.page ? "active" : ""}" data-page="${i}">${i}</button>`;
    root.innerHTML = html;
    root.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      shopState.page = +b.dataset.page; applyFiltersAndRender(allProducts); window.scrollTo({ top: document.getElementById("shopGrid").offsetTop - 100, behavior: "smooth" });
    }));
  }

  /* ---------------- PRODUCT DETAIL PAGE ---------------- */
  let pdpState = { size: null, color: null, qty: 1 };

  async function initProductPage() {
    const root = document.getElementById("pdpRoot");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const [product, categories, allProducts, reviews] = await Promise.all([
      window.DF.api.fetchProductById(id), window.DF.api.fetchCategories(), window.DF.api.fetchProducts(), window.DF.api.fetchReviews(id),
    ]);
    CATEGORY_MAP = Object.fromEntries(categories.map(c => [c.id, c.name]));
    if (!product) { root.innerHTML = `<div class="empty-state"><h3>Product not found</h3><a href="shop.html" class="btn btn-primary">Back to Shop</a></div>`; return; }

    document.title = `${product.name} — Demand Footwear`;
    document.getElementById("breadcrumbCurrent") && (document.getElementById("breadcrumbCurrent").textContent = product.name);
    document.getElementById("breadcrumbCat") && (document.getElementById("breadcrumbCat").textContent = labelForCategory(product.category));
    document.getElementById("breadcrumbCat")?.setAttribute("href", `shop.html?category=${product.category}`);

    pdpState = { size: null, color: product.colors[0], qty: 1 };
    const stock = stockInfo(product);
    const wished = window.DFwishlist.isWishlisted(product.id);

    root.innerHTML = `
      <div class="pdp-grid">
        <div>
          <div class="pdp-gallery-main" id="pdpMainImgWrap"><img id="pdpMainImg" src="${product.images[0]}" alt="${product.name}" onerror="onImgError(this,'${product.name}')"></div>
          <div class="pdp-thumbs">${product.images.map((im, idx) => `<button class="pdp-thumb ${idx === 0 ? "active" : ""}" data-img="${im}"><img src="${im}" alt="View ${idx + 1}" onerror="onImgError(this,'${product.name}')"></button>`).join("")}</div>
        </div>
        <div>
          <span class="pdp-brand">${product.brand}</span>
          <h1 class="pdp-title">${product.name}</h1>
          <div class="pdp-meta-row">
            <div class="product-rating"><span class="stars">${stars(product.rating)}</span> ${product.rating.toFixed(1)} (${product.reviewCount} reviews)</div>
            <span class="muted">SKU: ${product.sku}</span>
          </div>
          <div class="pdp-price-row">
            <span class="price-now">$${finalPrice(product).toFixed(2)}</span>
            ${product.discount > 0 ? `<span class="price-old">$${product.price.toFixed(2)}</span><span class="price-off">Save ${product.discount}%</span>` : ""}
          </div>
          <p class="pdp-desc">${product.description}</p>

          <div class="option-block">
            <h4>Color: <span id="selColorLabel">${product.colors[0]}</span></h4>
            <div class="color-swatch-row">${product.colors.map((c, i) => `<button type="button" class="color-swatch ${i === 0 ? "active" : ""}" style="background:${COLOR_HEX[c] || "#ccc"}" data-pdp-color="${c}" title="${c}" aria-label="${c}"></button>`).join("")}</div>
          </div>

          <div class="option-block">
            <h4>Size <a href="#" id="sizeGuideLink" style="font-weight:500;font-size:.78rem;">Size guide</a></h4>
            <div class="size-chip-row">${product.sizes.map(s => `<button type="button" class="size-chip" data-pdp-size="${s}">${s}</button>`).join("")}</div>
            <p class="field-error" id="sizeError">Please select a size.</p>
          </div>

          <div class="option-block">
            <h4>Quantity</h4>
            <div class="qty-stepper"><button data-qty="dec" aria-label="Decrease">−</button><span id="pdpQty">1</span><button data-qty="inc" aria-label="Increase">+</button></div>
          </div>

          <span class="stock-note ${stock.cls}">${stock.label}</span>
          <div class="pdp-actions">
            <button class="btn btn-primary btn-lg" id="pdpAddCart" ${product.stock <= 0 ? "disabled" : ""}><i class="bi bi-bag-plus"></i>&nbsp; Add to Cart</button>
            <button class="btn btn-accent btn-lg" id="pdpBuyNow" ${product.stock <= 0 ? "disabled" : ""}><i class="bi bi-lightning-charge"></i>&nbsp; Buy Now</button>
            <button class="btn btn-outline btn-icon" id="pdpWishlist" aria-label="Toggle wishlist"><i class="bi ${wished ? "bi-heart-fill" : "bi-heart"}"></i></button>
          </div>
          <ul class="pdp-info-list">
            <li><i class="bi bi-truck"></i> Standard delivery 3–5 business days, express in 1–2 days.</li>
            <li><i class="bi bi-arrow-repeat"></i> Free 30-day returns on unworn footwear.</li>
            <li><i class="bi bi-shield-check"></i> 100% authentic, quality-checked before dispatch.</li>
          </ul>
        </div>
      </div>

      <div class="tabs" role="tablist">
        <button class="tab-btn active" data-tab="desc">Description</button>
        <button class="tab-btn" data-tab="specs">Specifications</button>
        <button class="tab-btn" data-tab="shipping">Shipping &amp; Returns</button>
        <button class="tab-btn" data-tab="reviews">Reviews (${reviews.length})</button>
      </div>
      <div class="tab-panel active" id="tab-desc"><p>${product.description}</p></div>
      <div class="tab-panel" id="tab-specs">
        <table class="spec-table">
          <tr><td>Brand</td><td>${product.brand}</td></tr>
          <tr><td>Category</td><td>${labelForCategory(product.category)}</td></tr>
          <tr><td>SKU</td><td>${product.sku}</td></tr>
          <tr><td>Available Sizes</td><td>${product.sizes.join(", ")}</td></tr>
          <tr><td>Available Colors</td><td>${product.colors.join(", ")}</td></tr>
          <tr><td>Status</td><td>${product.status}</td></tr>
        </table>
      </div>
      <div class="tab-panel" id="tab-shipping">
        <p>Standard delivery: 3–5 business days. Express delivery: 1–2 business days. Cash on Delivery available in select areas.</p>
        <p>Returns accepted within 30 days of delivery provided the item is unworn and in its original packaging.</p>
      </div>
      <div class="tab-panel" id="tab-reviews">
        ${reviews.length === 0 ? '<p class="muted">No reviews yet for this product.</p>' : `<div class="review-grid">${reviews.map(r => `
          <div class="review-card"><div class="review-head"><div class="review-avatar">${r.customer.charAt(0)}</div><div class="review-name">${r.customer}</div></div>
          <div class="review-stars">${stars(r.rating)}</div><p class="review-text">"${r.text}"</p><span class="demo-tag">Sample review</span></div>`).join("")}</div>`}
      </div>

      <div class="section-head" style="margin-top:52px;"><h2>You May Also Like</h2></div>
      <div class="product-grid" id="relatedGrid"></div>`;

    // Related products (same category, excluding current)
    const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    document.getElementById("relatedGrid").innerHTML = related.map(productCardHTML).join("");
    wireProductGridEvents(document.getElementById("relatedGrid"));

    wirePdpEvents(product);
  }

  function wirePdpEvents(product) {
    const root = document.getElementById("pdpRoot");

    root.querySelectorAll(".pdp-thumb").forEach(t => t.addEventListener("click", () => {
      root.querySelectorAll(".pdp-thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("pdpMainImg").src = t.dataset.img;
    }));
    document.getElementById("pdpMainImgWrap")?.addEventListener("click", function () { this.classList.toggle("zoomed"); });

    root.querySelectorAll("[data-pdp-color]").forEach(el => el.addEventListener("click", () => {
      root.querySelectorAll("[data-pdp-color]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
      pdpState.color = el.dataset.pdpColor;
      document.getElementById("selColorLabel").textContent = pdpState.color;
    }));

    root.querySelectorAll("[data-pdp-size]").forEach(el => el.addEventListener("click", () => {
      root.querySelectorAll("[data-pdp-size]").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
      pdpState.size = el.dataset.pdpSize;
      document.getElementById("sizeError").classList.remove("show");
    }));

    root.querySelector('[data-qty="inc"]')?.addEventListener("click", () => {
      if (pdpState.qty < product.stock) { pdpState.qty++; document.getElementById("pdpQty").textContent = pdpState.qty; }
      else showToast(`Only ${product.stock} unit(s) available.`, "warn");
    });
    root.querySelector('[data-qty="dec"]')?.addEventListener("click", () => {
      if (pdpState.qty > 1) { pdpState.qty--; document.getElementById("pdpQty").textContent = pdpState.qty; }
    });

    document.getElementById("pdpWishlist")?.addEventListener("click", function () {
      const active = window.DFwishlist.toggleWishlist(product.id);
      this.querySelector("i").className = "bi " + (active ? "bi-heart-fill" : "bi-heart");
    });

    async function addCurrentToCart() {
      if (!pdpState.size) { document.getElementById("sizeError").classList.add("show"); showToast("Please select a size first.", "warn"); return false; }
      return window.DFcart.addToCart(product.id, pdpState.qty, pdpState.size, pdpState.color);
    }
    document.getElementById("pdpAddCart")?.addEventListener("click", addCurrentToCart);
    document.getElementById("pdpBuyNow")?.addEventListener("click", async () => { if (await addCurrentToCart()) window.location.href = "checkout.html"; });

    root.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => {
      root.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      root.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    }));
  }

  window.DFproducts = { productCardHTML, wireProductGridEvents, finalPrice, stockInfo, stars, labelForCategory, initHomePage, initShopPage, initProductPage, COLOR_HEX };

  document.addEventListener("DOMContentLoaded", () => {
    initHomePage();
    initShopPage();
    initProductPage();
  });
})();
