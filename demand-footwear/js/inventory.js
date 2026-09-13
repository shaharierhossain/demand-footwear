/* =========================================================================
   DEMAND FOOTWEAR — inventory.js
   Inventory Management section of the admin dashboard.

   PRODUCTION NOTE: every adjustment here is written straight to
   localStorage with no locking. A real backend must perform stock
   adjustments inside a single database transaction (e.g. `SELECT ...
   FOR UPDATE` then `UPDATE`) so two simultaneous orders can never both
   succeed against the same last unit of stock (overselling).
   ========================================================================= */

(function () {
  "use strict";

  function statusFor(p) {
    if (p.status === "discontinued") return { key: "discontinued", label: "Discontinued" };
    if (p.stock <= 0) return { key: "out-of-stock", label: "Out of Stock" };
    if (p.stock <= (p.lowStockThreshold || 8)) return { key: "low-stock", label: "Low Stock" };
    return { key: "in-stock", label: "In Stock" };
  }

  async function render(main) {
    const [products, categories] = await Promise.all([window.DF.api.fetchInventory(), window.DF.api.fetchCategories()]);
    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    main.innerHTML = `
      <div class="stat-grid">
        ${window.DFadmin.statCard("Total SKUs", products.length, "bi-upc-scan")}
        ${window.DFadmin.statCard("In Stock", products.filter(p => statusFor(p).key === "in-stock").length, "bi-check-circle")}
        ${window.DFadmin.statCard("Low Stock", products.filter(p => statusFor(p).key === "low-stock").length, "bi-exclamation-triangle")}
        ${window.DFadmin.statCard("Out of Stock", products.filter(p => statusFor(p).key === "out-of-stock").length, "bi-x-octagon")}
      </div>
      <div class="admin-panel">
        <div class="table-toolbar">
          <input type="search" class="form-control" id="invSearch" placeholder="Search product or SKU…" style="min-width:220px;">
          <select class="form-control" id="invStatusFilter">
            <option value="">All Statuses</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <button class="btn btn-ghost btn-sm" id="lowStockReportBtn"><i class="bi bi-file-earmark-text"></i> Low-Stock Report</button>
          <button class="btn btn-ghost btn-sm" id="outStockReportBtn"><i class="bi bi-file-earmark-x"></i> Out-of-Stock Report</button>
        </div>
        <div class="table-scroll" id="invTableWrap"></div>
      </div>
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Recent Stock Adjustments</h3></div>
        <div class="table-scroll" id="invLogWrap"></div>
      </div>`;

    function draw() {
      const q = document.getElementById("invSearch").value.toLowerCase();
      const status = document.getElementById("invStatusFilter").value;
      const filtered = products.filter(p => {
        const st = statusFor(p).key;
        return (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && (!status || st === status);
      });
      document.getElementById("invTableWrap").innerHTML = `<table class="data-table"><thead><tr>
        <th>Product</th><th>SKU</th><th>Category</th><th>Current Stock</th><th>Reserved</th><th>Available</th><th>Low-Stock Threshold</th><th>Status</th><th>Last Updated</th><th>Adjust</th>
      </tr></thead><tbody>
        ${filtered.map(p => {
          const st = statusFor(p);
          const available = Math.max(0, p.stock - (p.reserved || 0));
          return `<tr>
            <td>${p.name}</td><td>${p.sku}</td><td>${catMap[p.category] || p.category}</td>
            <td><strong>${p.stock}</strong></td><td>${p.reserved || 0}</td><td>${available}</td><td>${p.lowStockThreshold}</td>
            <td><span class="status-pill status-${st.key}">${st.label}</span></td>
            <td>${new Date(p.updatedAt).toLocaleDateString()}</td>
            <td><button class="btn btn-sm btn-ghost" data-adjust="${p.id}"><i class="bi bi-sliders"></i> Adjust</button></td>
          </tr>`;
        }).join("") || `<tr><td colspan="10" class="muted text-center" style="padding:30px;">No products match your filters.</td></tr>`}
      </tbody></table>`;
    }
    draw();
    document.getElementById("invSearch").addEventListener("input", draw);
    document.getElementById("invStatusFilter").addEventListener("input", draw);

    async function drawLog() {
      const log = await window.DF.api.fetchInventoryLog();
      document.getElementById("invLogWrap").innerHTML = log.length === 0 ? '<p class="muted">No stock adjustments recorded yet.</p>' : `
        <table class="data-table"><thead><tr><th>Date</th><th>Product</th><th>Previous</th><th>Adjustment</th><th>New Qty</th><th>Reason</th><th>User</th></tr></thead><tbody>
          ${log.slice(0, 25).map(l => `<tr>
            <td>${new Date(l.date).toLocaleString()}</td><td>${l.productName}</td><td>${l.previous}</td>
            <td style="color:${l.adjustment >= 0 ? "var(--df-success)" : "var(--df-danger)"};font-weight:600;">${l.adjustment >= 0 ? "+" : ""}${l.adjustment}</td>
            <td>${l.next}</td><td>${l.reason}</td><td>${l.user}</td>
          </tr>`).join("")}
        </tbody></table>`;
    }
    drawLog();

    document.getElementById("lowStockReportBtn").addEventListener("click", () => {
      document.getElementById("invStatusFilter").value = "low-stock"; draw();
    });
    document.getElementById("outStockReportBtn").addEventListener("click", () => {
      document.getElementById("invStatusFilter").value = "out-of-stock"; draw();
    });

    main.addEventListener("click", (e) => {
      const id = e.target.closest("[data-adjust]")?.dataset.adjust;
      if (id) openAdjustModal(products.find(p => p.id === id), () => { render(main); });
    });
  }

  function openAdjustModal(product, onDone) {
    const html = `<div style="padding:28px;max-width:460px;">
      <h3>Adjust Stock — ${product.name}</h3>
      <p class="muted">Current stock: <strong>${product.stock}</strong> units</p>
      <form id="adjustForm">
        <div class="form-group">
          <label>Adjustment Type</label>
          <select class="form-control" name="type">
            <option value="increase">Increase Stock (restock)</option>
            <option value="decrease">Decrease Stock (damage / correction)</option>
            <option value="set">Set Exact Quantity</option>
          </select>
        </div>
        <div class="form-group"><label>Amount *</label><input class="form-control" type="number" min="0" name="amount" required></div>
        <div class="form-group"><label>Reason *</label>
          <select class="form-control" name="reason">
            <option>Restock from supplier</option>
            <option>Damaged / defective units</option>
            <option>Inventory count correction</option>
            <option>Returned by customer</option>
            <option>Other</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Save Adjustment</button>
      </form>
    </div>`;
    const modal = openModal(html, "adjustModal");
    modal.querySelector("#adjustForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const type = fd.get("type");
      const amount = +fd.get("amount");
      let delta = type === "increase" ? amount : type === "decrease" ? -amount : (amount - product.stock);
      const session = window.DF.api.getAdminSession();
      await window.DF.api.updateInventory(product.id, delta, fd.get("reason"), session?.username || "admin");
      showToast("Stock adjustment saved.", "success");
      closeModal("adjustModal");
      onDone();
    });
  }

  window.DFinventory = { render };
})();
