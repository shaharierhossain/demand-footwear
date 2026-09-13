/* =========================================================================
   DEMAND FOOTWEAR — admin.js
   Single-page admin dashboard: auth guard, sidebar routing, dashboard
   analytics (Chart.js), product/order/customer/category management.
   Inventory-specific views live in inventory.js.
   ========================================================================= */

(function () {
  "use strict";

  /* ---------------- Auth guard ---------------- */
  function requireAdminAuth() {
    const session = window.DF.api.getAdminSession();
    if (!session) { window.location.href = "admin-login.html"; return null; }
    return session;
  }

  /* ---------------- Sidebar shell ---------------- */
  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { id: "products", label: "Products", icon: "bi-bag" },
    { id: "categories", label: "Categories", icon: "bi-tags" },
    { id: "inventory", label: "Inventory", icon: "bi-boxes" },
    { id: "orders", label: "Orders", icon: "bi-receipt" },
    { id: "customers", label: "Customers", icon: "bi-people" },
    { id: "reports", label: "Sales Reports", icon: "bi-graph-up" },
    { id: "settings", label: "Settings", icon: "bi-gear" },
  ];

  function mountAdminShell(activeSection) {
    document.getElementById("adminSidebar").innerHTML = `
      <div class="admin-brand"><span class="mark" style="background:var(--df-accent)">DF</span> Demand Footwear <span class="muted" style="font-size:.7rem;">Admin</span></div>
      <nav class="admin-nav">
        ${NAV_ITEMS.map(i => `<a href="#${i.id}" data-section="${i.id}" class="${i.id === activeSection ? "active" : ""}"><i class="bi ${i.icon}"></i> ${i.label}</a>`).join("")}
        <div class="divider"></div>
        <a href="index.html" target="_blank"><i class="bi bi-box-arrow-up-right"></i> View Storefront</a>
        <a href="#" id="adminLogoutBtn"><i class="bi bi-box-arrow-right"></i> Logout</a>
      </nav>`;
    document.getElementById("adminLogoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      window.DF.api.logoutAdmin();
      window.location.href = "admin-login.html";
    });
    document.getElementById("mobileSidebarToggle")?.addEventListener("click", () => document.getElementById("adminSidebar").classList.toggle("open"));
  }

  const SECTION_TITLES = { dashboard: "Dashboard", products: "Product Management", categories: "Category Management", inventory: "Inventory Management", orders: "Order Management", customers: "Customer Management", reports: "Sales Reports", settings: "Store Settings" };

  async function router() {
    const section = (window.location.hash || "#dashboard").replace("#", "");
    mountAdminShell(section);
    document.getElementById("adminSectionTitle").textContent = SECTION_TITLES[section] || "Dashboard";
    const main = document.getElementById("adminMain");
    main.innerHTML = `<div class="skeleton" style="height:200px;"></div>`;
    document.getElementById("adminSidebar").classList.remove("open");

    switch (section) {
      case "products": return renderProducts(main);
      case "categories": return renderCategories(main);
      case "inventory": return window.DFinventory.render(main);
      case "orders": return renderOrders(main);
      case "customers": return renderCustomers(main);
      case "reports": return renderReports(main);
      case "settings": return renderSettings(main);
      default: return renderDashboard(main);
    }
  }

  /* ---------------- DASHBOARD ---------------- */
  async function renderDashboard(main) {
    const [products, orders] = await Promise.all([window.DF.api.fetchProducts(), window.DF.api.fetchOrders()]);
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 8));
    const outStock = products.filter(p => p.stock <= 0);
    const pending = orders.filter(o => o.status === "Pending").length;
    const completed = orders.filter(o => o.status === "Delivered").length;
    const totalSales = orders.reduce((s, o) => s + o.total, 0);

    main.innerHTML = `
      <div class="stat-grid">
        ${statCard("Total Products", products.length, "bi-bag-check")}
        ${statCard("Inventory Units", totalUnits, "bi-boxes")}
        ${statCard("Low-Stock Products", lowStock.length, "bi-exclamation-triangle", lowStock.length ? "down" : "")}
        ${statCard("Out-of-Stock", outStock.length, "bi-x-octagon", outStock.length ? "down" : "")}
        ${statCard("Total Orders", orders.length, "bi-receipt")}
        ${statCard("Pending Orders", pending, "bi-hourglass-split")}
        ${statCard("Completed Orders", completed, "bi-check-circle", "up")}
        ${statCard("Total Sales", "$" + totalSales.toFixed(2), "bi-currency-dollar", "up")}
      </div>

      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Quick Actions</h3></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="#products" class="btn btn-primary btn-sm" data-quick="add-product"><i class="bi bi-plus-lg"></i> Add Product</a>
          <a href="#inventory" class="btn btn-ghost btn-sm"><i class="bi bi-boxes"></i> View Inventory</a>
          <a href="#orders" class="btn btn-ghost btn-sm"><i class="bi bi-receipt"></i> Manage Orders</a>
          <a href="#reports" class="btn btn-ghost btn-sm"><i class="bi bi-file-earmark-bar-graph"></i> Generate Report</a>
        </div>
      </div>

      <div class="chart-grid">
        <div class="admin-panel"><div class="admin-panel-head"><h3>Sales — Last 14 Days <span class="demo-tag">Demo data</span></h3></div><div class="chart-box"><canvas id="chartDailySales"></canvas></div></div>
        <div class="admin-panel"><div class="admin-panel-head"><h3>Orders by Status</h3></div><div class="chart-box"><canvas id="chartOrderStatus"></canvas></div></div>
      </div>
      <div class="chart-grid">
        <div class="admin-panel"><div class="admin-panel-head"><h3>Sales by Category</h3></div><div class="chart-box"><canvas id="chartCategorySales"></canvas></div></div>
        <div class="admin-panel"><div class="admin-panel-head"><h3>Top-Selling Products</h3></div><div class="chart-box"><canvas id="chartTopProducts"></canvas></div></div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Recent Orders</h3><a href="#orders" class="section-link" style="font-size:.82rem;">View all →</a></div>
        <div class="table-scroll">${ordersTableHTML(orders.slice(0, 6))}</div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Low-Stock Alerts</h3></div>
        ${lowStock.concat(outStock).length === 0 ? '<p class="muted">All products are sufficiently stocked.</p>' : `
        <div class="table-scroll"><table class="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Threshold</th><th>Status</th></tr></thead><tbody>
          ${lowStock.concat(outStock).map(p => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.stock}</td><td>${p.lowStockThreshold}</td><td><span class="status-pill ${p.stock <= 0 ? "status-out-of-stock" : "status-low-stock"}">${p.stock <= 0 ? "Out of Stock" : "Low Stock"}</span></td></tr>`).join("")}
        </tbody></table></div>`}
      </div>`;

    buildDashboardCharts(orders, products);
  }

  function statCard(label, value, icon, delta) {
    return `<div class="stat-card">
      <div class="label"><i class="bi ${icon}"></i> ${label}</div>
      <div class="value">${value}</div>
      ${delta ? `<div class="delta ${delta}"><i class="bi bi-arrow-${delta === "up" ? "up" : "down"}-short"></i> vs last period (demo)</div>` : ""}
    </div>`;
  }

  let chartRefs = [];
  function destroyCharts() { chartRefs.forEach(c => c.destroy()); chartRefs = []; }

  function buildDashboardCharts(orders, products) {
    destroyCharts();
    const palette = ["#17140f", "#c1591f", "#b6862c", "#6b6455", "#9a9488", "#a04616"];

    // Daily sales - last 14 days from order dates
    const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d; });
    const dailyTotals = days.map(d => orders.filter(o => new Date(o.date).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0));
    chartRefs.push(new Chart(document.getElementById("chartDailySales"), {
      type: "line",
      data: { labels: days.map(d => d.toLocaleDateString(undefined, { month: "short", day: "numeric" })), datasets: [{ label: "Sales ($)", data: dailyTotals, borderColor: palette[1], backgroundColor: "rgba(193,89,31,.12)", fill: true, tension: .35 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    }));

    // Orders by status
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
    const statusCounts = statuses.map(s => orders.filter(o => o.status === s).length);
    chartRefs.push(new Chart(document.getElementById("chartOrderStatus"), {
      type: "doughnut",
      data: { labels: statuses, datasets: [{ data: statusCounts, backgroundColor: palette.concat(["#e8dfcd", "#3f7a4e"]) }] },
      options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
    }));

    // Sales by category
    const cats = [...new Set(products.map(p => p.category))];
    const catSales = cats.map(c => orders.reduce((s, o) => s + o.items.filter(it => products.find(p => p.id === it.productId)?.category === c).reduce((s2, it) => s2 + it.price * it.qty, 0), 0));
    chartRefs.push(new Chart(document.getElementById("chartCategorySales"), {
      type: "bar",
      data: { labels: cats.map(c => window.DFproducts.labelForCategory(c)), datasets: [{ label: "Sales ($)", data: catSales, backgroundColor: palette[0] }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    }));

    // Top-selling products
    const soldMap = {};
    orders.forEach(o => o.items.forEach(it => { soldMap[it.name] = (soldMap[it.name] || 0) + it.qty; }));
    const top = Object.entries(soldMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    chartRefs.push(new Chart(document.getElementById("chartTopProducts"), {
      type: "bar",
      data: { labels: top.map(t => t[0]), datasets: [{ label: "Units Sold", data: top.map(t => t[1]), backgroundColor: palette[1] }] },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    }));
  }

  function ordersTableHTML(orders) {
    return `<table class="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead><tbody>
      ${orders.map(o => `<tr>
        <td>${o.id}</td><td>${o.customerName}</td><td>${new Date(o.date).toLocaleDateString()}</td><td>$${o.total.toFixed(2)}</td>
        <td><span class="status-pill status-${o.paymentStatus.toLowerCase().replace(/\s+/g, "-")}">${o.paymentStatus}</span></td>
        <td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td>
        <td><button class="btn btn-sm btn-ghost" data-view-order="${o.id}">View</button></td>
      </tr>`).join("")}
    </tbody></table>`;
  }

  /* ---------------- PRODUCTS ---------------- */
  async function renderProducts(main) {
    const [products, categories] = await Promise.all([window.DF.api.fetchProducts(), window.DF.api.fetchCategories()]);
    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    let filtered = products;

    main.innerHTML = `
      <div class="admin-panel">
        <div class="table-toolbar">
          <input type="search" class="form-control" id="prodSearch" placeholder="Search products…" style="min-width:220px;">
          <select class="form-control" id="prodCatFilter"><option value="">All Categories</option>${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
          <select class="form-control" id="prodStatusFilter"><option value="">All Statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="discontinued">Discontinued</option></select>
          <button class="btn btn-primary btn-sm" id="addProductBtn" style="margin-left:auto;"><i class="bi bi-plus-lg"></i> Add Product</button>
        </div>
        <div class="table-scroll" id="productsTableWrap"></div>
      </div>`;

    function draw() {
      const q = document.getElementById("prodSearch").value.toLowerCase();
      const cat = document.getElementById("prodCatFilter").value;
      const status = document.getElementById("prodStatusFilter").value;
      filtered = products.filter(p => (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && (!cat || p.category === cat) && (!status || p.status === status));
      document.getElementById("productsTableWrap").innerHTML = `<table class="data-table"><thead><tr><th>Image</th><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${filtered.map(p => `<tr>
          <td><img class="thumb-sm" src="${p.images[0]}" alt="${p.name}" onerror="onImgError(this,'${p.name}')"></td>
          <td>${p.name}</td><td>${p.sku}</td><td>${catMap[p.category] || p.category}</td>
          <td>$${window.DFproducts.finalPrice(p).toFixed(2)}${p.discount ? ` <span class="muted" style="text-decoration:line-through;">$${p.price.toFixed(2)}</span>` : ""}</td>
          <td>${p.stock}</td>
          <td><span class="status-pill status-${p.status}">${p.status}</span></td>
          <td><div class="row-actions">
            <button data-edit="${p.id}" title="Edit"><i class="bi bi-pencil"></i></button>
            <button data-dup="${p.id}" title="Duplicate"><i class="bi bi-files"></i></button>
            <button data-del="${p.id}" title="Delete"><i class="bi bi-trash"></i></button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="8" class="muted text-center" style="padding:30px;">No products match your filters.</td></tr>`}
      </tbody></table>`;
    }
    draw();
    ["prodSearch", "prodCatFilter", "prodStatusFilter"].forEach(id => document.getElementById(id).addEventListener("input", draw));

    document.getElementById("addProductBtn").addEventListener("click", () => openProductForm(null, categories, () => renderProducts(main)));
    document.getElementById("productsTableWrap").addEventListener("click", async (e) => {
      const editId = e.target.closest("[data-edit]")?.dataset.edit;
      const dupId = e.target.closest("[data-dup]")?.dataset.dup;
      const delId = e.target.closest("[data-del]")?.dataset.del;
      if (editId) { const p = await window.DF.api.fetchProductById(editId); openProductForm(p, categories, () => renderProducts(main)); }
      if (dupId) { await window.DF.api.duplicateProduct(dupId); showToast("Product duplicated.", "success"); renderProducts(main); }
      if (delId) {
        if (await confirmDialog("This will permanently delete the product from the demo catalog.", "Delete Product")) {
          await window.DF.api.deleteProduct(delId); showToast("Product deleted.", "success"); renderProducts(main);
        }
      }
    });
  }

  function openProductForm(product, categories, onSaved) {
    const isEdit = !!product;
    const p = product || { sizes: [], colors: [], images: [], tags: [], status: "active" };
    const html = `
      <div style="padding:28px;max-width:760px;">
        <h3>${isEdit ? "Edit Product" : "Add Product"}</h3>
        <form id="productForm">
          <div class="form-row">
            <div class="form-group"><label>Product Name *</label><input class="form-control" name="name" required value="${p.name || ""}"></div>
            <div class="form-group"><label>SKU *</label><input class="form-control" name="sku" required value="${p.sku || ""}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Category *</label><select class="form-control" name="category" required>${categories.map(c => `<option value="${c.id}" ${p.category === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select></div>
            <div class="form-group"><label>Brand *</label><input class="form-control" name="brand" required value="${p.brand || ""}"></div>
          </div>
          <div class="form-group"><label>Description</label><textarea class="form-control" name="description" rows="3">${p.description || ""}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Price ($) *</label><input class="form-control" type="number" step="0.01" min="0" name="price" required value="${p.price ?? ""}"></div>
            <div class="form-group"><label>Discount (%)</label><input class="form-control" type="number" min="0" max="90" name="discount" value="${p.discount ?? 0}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Stock Quantity *</label><input class="form-control" type="number" min="0" name="stock" required value="${p.stock ?? 0}"></div>
            <div class="form-group"><label>Low-Stock Threshold</label><input class="form-control" type="number" min="0" name="lowStockThreshold" value="${p.lowStockThreshold ?? 8}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Sizes (comma separated) *</label><input class="form-control" name="sizes" required value="${(p.sizes || []).join(", ")}"></div>
            <div class="form-group"><label>Colors (comma separated) *</label><input class="form-control" name="colors" required value="${(p.colors || []).join(", ")}"></div>
          </div>
          <div class="form-group">
            <label>Product Images (one URL per line — replace with your own hosted images for production)</label>
            <textarea class="form-control" name="images" rows="2" required>${(p.images || []).join("\n")}</textarea>
            <p class="hint">In production, upload files here and store them via a cloud image service (see README).</p>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="active" ${p.status === "active" ? "selected" : ""}>Active</option><option value="draft" ${p.status === "draft" ? "selected" : ""}>Draft</option><option value="discontinued" ${p.status === "discontinued" ? "selected" : ""}>Discontinued</option></select></div>
            <div class="form-group"><label>Tags (comma separated)</label><input class="form-control" name="tags" value="${(p.tags || []).join(", ")}"></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save Changes" : "Add Product"}</button>
        </form>
      </div>`;
    const modal = openModal(html, "productModal");
    modal.querySelector("#productForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        name: fd.get("name"), sku: fd.get("sku"), category: fd.get("category"), brand: fd.get("brand"),
        description: fd.get("description"), price: +fd.get("price"), discount: +fd.get("discount") || 0,
        stock: +fd.get("stock"), lowStockThreshold: +fd.get("lowStockThreshold") || 8,
        sizes: fd.get("sizes").split(",").map(s => s.trim()).filter(Boolean),
        colors: fd.get("colors").split(",").map(s => s.trim()).filter(Boolean),
        images: fd.get("images").split("\n").map(s => s.trim()).filter(Boolean),
        status: fd.get("status"), tags: fd.get("tags").split(",").map(s => s.trim()).filter(Boolean),
        rating: p.rating || 0, reviewCount: p.reviewCount || 0,
      };
      if (isEdit) await window.DF.api.updateProduct(p.id, data); else await window.DF.api.createProduct(data);
      showToast(isEdit ? "Product updated." : "Product added.", "success");
      closeModal("productModal");
      onSaved();
    });
  }

  /* ---------------- CATEGORIES ---------------- */
  async function renderCategories(main) {
    const [categories, products] = await Promise.all([window.DF.api.fetchCategories(), window.DF.api.fetchProducts()]);
    main.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Categories</h3><button class="btn btn-primary btn-sm" id="addCatBtn"><i class="bi bi-plus-lg"></i> Add Category</button></div>
        <div class="table-scroll"><table class="data-table"><thead><tr><th>Image</th><th>Name</th><th>Description</th><th>Products</th><th>Actions</th></tr></thead><tbody>
          ${categories.map(c => `<tr>
            <td><img class="thumb-sm" src="${c.image}" alt="${c.name}" onerror="onImgError(this,'${c.name}')"></td>
            <td>${c.name}</td><td class="muted">${c.description}</td>
            <td>${products.filter(p => p.category === c.id).length}</td>
            <td><div class="row-actions"><button data-cat-edit="${c.id}"><i class="bi bi-pencil"></i></button><button data-cat-del="${c.id}"><i class="bi bi-trash"></i></button></div></td>
          </tr>`).join("")}
        </tbody></table></div>
      </div>`;

    function catForm(cat) {
      const isEdit = !!cat; const c = cat || {};
      const html = `<div style="padding:28px;max-width:520px;">
        <h3>${isEdit ? "Edit Category" : "Add Category"}</h3>
        <form id="catForm">
          <div class="form-group"><label>Name *</label><input class="form-control" name="name" required value="${c.name || ""}"></div>
          <div class="form-group"><label>Description</label><textarea class="form-control" name="description" rows="2">${c.description || ""}</textarea></div>
          <div class="form-group"><label>Image URL</label><input class="form-control" name="image" value="${c.image || ""}"></div>
          <button class="btn btn-primary btn-block" type="submit">${isEdit ? "Save Changes" : "Add Category"}</button>
        </form></div>`;
      const modal = openModal(html, "catModal");
      modal.querySelector("#catForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = { name: fd.get("name"), description: fd.get("description"), image: fd.get("image") };
        if (isEdit) await window.DF.api.updateCategory(c.id, data); else await window.DF.api.createCategory(data);
        showToast("Category saved.", "success"); closeModal("catModal"); renderCategories(main);
      });
    }
    document.getElementById("addCatBtn").addEventListener("click", () => catForm(null));
    main.addEventListener("click", async (e) => {
      const editId = e.target.closest("[data-cat-edit]")?.dataset.catEdit;
      const delId = e.target.closest("[data-cat-del]")?.dataset.catDel;
      if (editId) catForm(categories.find(c => c.id === editId));
      if (delId && await confirmDialog("Delete this category? Products in it will remain but show an unlisted category.", "Delete Category")) {
        await window.DF.api.deleteCategory(delId); showToast("Category deleted.", "success"); renderCategories(main);
      }
    });
  }

  /* ---------------- ORDERS ---------------- */
  async function renderOrders(main) {
    const orders = await window.DF.api.fetchOrders();
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
    let filtered = orders;
    main.innerHTML = `
      <div class="admin-panel">
        <div class="table-toolbar">
          <input type="search" class="form-control" id="orderSearch" placeholder="Search order ID or customer…" style="min-width:220px;">
          <select class="form-control" id="orderStatusFilter"><option value="">All Statuses</option>${statuses.map(s => `<option>${s}</option>`).join("")}</select>
          <input type="date" class="form-control" id="orderDateFilter">
          <button class="btn btn-ghost btn-sm" id="printOrdersBtn"><i class="bi bi-printer"></i> Print</button>
        </div>
        <div class="table-scroll" id="ordersTableWrap"></div>
      </div>`;

    function draw() {
      const q = document.getElementById("orderSearch").value.toLowerCase();
      const status = document.getElementById("orderStatusFilter").value;
      const date = document.getElementById("orderDateFilter").value;
      filtered = orders.filter(o => (!q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)) && (!status || o.status === status) && (!date || o.date.slice(0, 10) === date));
      document.getElementById("ordersTableWrap").innerHTML = ordersTableHTML(filtered) || `<p class="muted">No orders match your filters.</p>`;
    }
    draw();
    ["orderSearch", "orderStatusFilter", "orderDateFilter"].forEach(id => document.getElementById(id).addEventListener("input", draw));
    document.getElementById("printOrdersBtn").addEventListener("click", () => window.print());

    main.addEventListener("click", async (e) => {
      const id = e.target.closest("[data-view-order]")?.dataset.viewOrder;
      if (id) openOrderDetail(await window.DF.api.fetchOrderById(id), main);
    });
  }

  function openOrderDetail(order, main) {
    if (!order) return;
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
    const payStatuses = ["Pending", "Paid", "Failed", "Refunded", "Cash on Delivery"];
    const html = `<div style="padding:28px;max-width:700px;">
      <h3>Order ${order.id}</h3>
      <p class="muted">${new Date(order.date).toLocaleString()}</p>
      <div class="form-row">
        <div><h4 style="font-size:.9rem;">Customer</h4><p>${order.customerName}<br>${order.email}</p></div>
        <div><h4 style="font-size:.9rem;">Delivery Address</h4><p>${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.zip}, ${order.address.country}</p></div>
      </div>
      <h4 style="font-size:.9rem;">Items</h4>
      <table class="data-table"><thead><tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th></tr></thead><tbody>
        ${order.items.map(i => `<tr><td>${i.name}</td><td>${i.size}</td><td>${i.color}</td><td>${i.qty}</td><td>$${i.price.toFixed(2)}</td></tr>`).join("")}
      </tbody></table>
      <div class="summary-line"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
      <div class="summary-line"><span>Delivery</span><span>$${order.delivery.toFixed(2)}</span></div>
      <div class="summary-line"><span>Tax</span><span>$${order.tax.toFixed(2)}</span></div>
      <div class="summary-line total"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
      <div class="form-row" style="margin-top:16px;">
        <div class="form-group"><label>Order Status</label><select class="form-control" id="orderStatusSelect">${statuses.map(s => `<option ${order.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div class="form-group"><label>Payment Status</label><select class="form-control" id="orderPayStatusSelect">${payStatuses.map(s => `<option ${order.paymentStatus === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      </div>
      <button class="btn btn-primary btn-block" id="saveOrderStatusBtn">Save Status</button>
    </div>`;
    const modal = openModal(html, "orderModal");
    modal.querySelector("#saveOrderStatusBtn").addEventListener("click", async () => {
      await window.DF.api.updateOrderStatus(order.id, modal.querySelector("#orderStatusSelect").value);
      await window.DF.api.updatePaymentStatus(order.id, modal.querySelector("#orderPayStatusSelect").value);
      showToast("Order updated.", "success");
      closeModal("orderModal");
      renderOrders(main);
    });
  }

  /* ---------------- CUSTOMERS ---------------- */
  async function renderCustomers(main) {
    const [customers, orders] = await Promise.all([window.DF.api.fetchCustomers(), window.DF.api.fetchOrders()]);
    main.innerHTML = `
      <div class="admin-panel">
        <div class="table-toolbar"><input type="search" class="form-control" id="custSearch" placeholder="Search customers…" style="min-width:240px;"></div>
        <div class="table-scroll" id="custTableWrap"></div>
      </div>`;
    function draw() {
      const q = document.getElementById("custSearch").value.toLowerCase();
      const filtered = customers.filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
      document.getElementById("custTableWrap").innerHTML = `<table class="data-table"><thead><tr><th>Customer ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Orders</th><th>Total Spent</th><th>Status</th><th></th></tr></thead><tbody>
        ${filtered.map(c => {
          const custOrders = orders.filter(o => o.customerId === c.id || o.email === c.email);
          const spent = custOrders.reduce((s, o) => s + o.total, 0);
          return `<tr>
            <td>${c.id}</td><td>${c.name}</td><td>${c.email}</td><td>${c.phone}</td><td>${c.registered}</td>
            <td>${custOrders.length}</td><td>$${spent.toFixed(2)}</td>
            <td><span class="status-pill status-${c.status}">${c.status}</span></td>
            <td><button class="btn btn-sm btn-ghost" data-view-cust="${c.id}">View</button></td>
          </tr>`;
        }).join("") || `<tr><td colspan="9" class="muted text-center" style="padding:30px;">No customers found.</td></tr>`}
      </tbody></table>`;
    }
    draw();
    document.getElementById("custSearch").addEventListener("input", draw);
    main.addEventListener("click", async (e) => {
      const id = e.target.closest("[data-view-cust]")?.dataset.viewCust;
      if (!id) return;
      const c = customers.find(x => x.id === id);
      const custOrders = orders.filter(o => o.customerId === c.id || o.email === c.email);
      openModal(`<div style="padding:28px;max-width:600px;">
        <h3>${c.name}</h3>
        <p class="muted">${c.email} &middot; ${c.phone}</p>
        <p class="muted">Registered ${c.registered} &middot; Status: ${c.status}</p>
        <h4 style="font-size:.9rem;margin-top:16px;">Order History</h4>
        ${custOrders.length ? ordersTableHTML(custOrders) : '<p class="muted">No orders yet.</p>'}
      </div>`, "custModal");
    });
  }

  /* ---------------- REPORTS ---------------- */
  async function renderReports(main) {
    const [orders, products] = await Promise.all([window.DF.api.fetchOrders(), window.DF.api.fetchProducts()]);
    const totalSales = orders.reduce((s, o) => s + o.total, 0);
    const avgOrder = orders.length ? totalSales / orders.length : 0;
    main.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Sales Report <span class="demo-tag">Demo analytics</span></h3><button class="btn btn-ghost btn-sm" id="exportCsvBtn"><i class="bi bi-download"></i> Export CSV</button></div>
        <div class="stat-grid" style="margin-bottom:0;">
          ${statCard("Total Revenue", "$" + totalSales.toFixed(2), "bi-cash-stack")}
          ${statCard("Total Orders", orders.length, "bi-receipt")}
          ${statCard("Average Order Value", "$" + avgOrder.toFixed(2), "bi-graph-up-arrow")}
          ${statCard("Active Products", products.filter(p => p.status === "active").length, "bi-bag-check")}
        </div>
      </div>
      <div class="chart-grid">
        <div class="admin-panel"><div class="admin-panel-head"><h3>Monthly Sales</h3></div><div class="chart-box"><canvas id="chartMonthlySales"></canvas></div></div>
        <div class="admin-panel"><div class="admin-panel-head"><h3>Sales by Category</h3></div><div class="chart-box"><canvas id="chartCategorySales2"></canvas></div></div>
      </div>
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Order Ledger</h3></div>
        <div class="table-scroll">${ordersTableHTML(orders)}</div>
      </div>`;

    destroyCharts();
    const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return d; });
    const monthlyTotals = months.map(m => orders.filter(o => { const od = new Date(o.date); return od.getMonth() === m.getMonth() && od.getFullYear() === m.getFullYear(); }).reduce((s, o) => s + o.total, 0));
    chartRefs.push(new Chart(document.getElementById("chartMonthlySales"), {
      type: "bar",
      data: { labels: months.map(m => m.toLocaleDateString(undefined, { month: "short", year: "2-digit" })), datasets: [{ label: "Sales ($)", data: monthlyTotals, backgroundColor: "#17140f" }] },
      options: { plugins: { legend: { display: false } } },
    }));
    const cats = [...new Set(products.map(p => p.category))];
    const catSales = cats.map(c => orders.reduce((s, o) => s + o.items.filter(it => products.find(p => p.id === it.productId)?.category === c).reduce((s2, it) => s2 + it.price * it.qty, 0), 0));
    chartRefs.push(new Chart(document.getElementById("chartCategorySales2"), {
      type: "pie",
      data: { labels: cats.map(c => window.DFproducts.labelForCategory(c)), datasets: [{ data: catSales, backgroundColor: ["#17140f", "#c1591f", "#b6862c", "#6b6455", "#9a9488", "#a04616", "#e8dfcd"] }] },
      options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
    }));

    document.getElementById("exportCsvBtn").addEventListener("click", () => {
      const rows = [["Order ID", "Customer", "Date", "Total", "Status", "Payment Status"]].concat(orders.map(o => [o.id, o.customerName, o.date, o.total, o.status, o.paymentStatus]));
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "demand-footwear-sales-report.csv"; a.click();
    });
  }

  /* ---------------- SETTINGS ---------------- */
  function renderSettings(main) {
    const saved = JSON.parse(localStorage.getItem("df_store_settings") || "{}");
    main.innerHTML = `
      <div class="admin-panel" style="max-width:640px;">
        <h3>Store Settings</h3>
        <form id="settingsForm">
          <div class="form-group"><label>Store Name</label><input class="form-control" name="storeName" value="${saved.storeName || "Demand Footwear"}"></div>
          <div class="form-group"><label>Tagline</label><input class="form-control" name="tagline" value="${saved.tagline || "Step Into Your Demand."}"></div>
          <div class="form-group"><label>Support Email</label><input class="form-control" type="email" name="supportEmail" value="${saved.supportEmail || "hello@demandfootwear.example"}"></div>
          <div class="form-group"><label>Support Phone</label><input class="form-control" name="supportPhone" value="${saved.supportPhone || "+880 1700-000000"}"></div>
          <div class="form-row">
            <div class="form-group"><label>Standard Delivery Fee ($)</label><input class="form-control" type="number" step="0.01" name="standardFee" value="${saved.standardFee ?? 5.99}"></div>
            <div class="form-group"><label>Express Delivery Fee ($)</label><input class="form-control" type="number" step="0.01" name="expressFee" value="${saved.expressFee ?? 14.99}"></div>
          </div>
          <div class="form-group"><label>Tax Rate (%)</label><input class="form-control" type="number" step="0.1" name="taxRate" value="${saved.taxRate ?? 5}"></div>
          <button type="submit" class="btn btn-primary">Save Settings</button>
        </form>
        <hr style="margin:24px 0;border-color:var(--df-border);">
        <h3>Demo Data</h3>
        <p class="muted" style="font-size:.86rem;">Reset all products, orders, customers and reviews back to their original sample state. Your cart and wishlist will also be cleared.</p>
        <button class="btn btn-danger" id="resetDemoBtn">Reset Demo Data</button>
      </div>`;
    document.getElementById("settingsForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      localStorage.setItem("df_store_settings", JSON.stringify(Object.fromEntries(fd.entries())));
      showToast("Settings saved.", "success");
    });
    document.getElementById("resetDemoBtn").addEventListener("click", async () => {
      if (await confirmDialog("This restores all original demo data and cannot be undone.", "Reset Data")) {
        window.DF.api.resetDemoData();
        showToast("Demo data has been reset.", "success");
        router();
      }
    });
  }

  window.DFadmin = { ordersTableHTML, statCard, destroyCharts };

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("adminSidebar")) return;
    if (!requireAdminAuth()) return;
    router();
    window.addEventListener("hashchange", router);
  });
})();
