/* =========================================================================
   DEMAND FOOTWEAR — account.js
   Simulated customer account for the demo. No real password is stored —
   this "logs in" any email address to demonstrate the account UI. See
   README > Security for how real authentication must be implemented.
   ========================================================================= */

(function () {
  "use strict";

  function switchAuthTab(which) {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === which));
    document.getElementById("loginForm").style.display = which === "login" ? "block" : "none";
    document.getElementById("registerForm").style.display = which === "register" ? "block" : "none";
  }

  async function initAuthForms() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    if (!loginForm) return;

    document.querySelectorAll(".auth-tab").forEach(t => t.addEventListener("click", () => switchAuthTab(t.dataset.tab)));

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      if (!email) { showToast("Please enter your email.", "error"); return; }
      await window.DF.api.loginCustomer(email);
      showToast("Signed in (demo session).", "success");
      renderAccountArea();
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = registerForm.name.value.trim();
      const email = registerForm.email.value.trim();
      if (!name || !email) { showToast("Please fill in all required fields.", "error"); return; }
      await window.DF.api.registerCustomer({ name, email, phone: registerForm.phone.value.trim() });
      showToast("Account created (demo). You're now signed in.", "success");
      renderAccountArea();
    });
  }

  async function renderOrderHistory(email) {
    const root = document.getElementById("orderHistoryList");
    if (!root) return;
    const orders = await window.DF.api.fetchOrders();
    const mine = orders.filter(o => o.email === email);
    if (mine.length === 0) {
      root.innerHTML = `<div class="empty-state"><div class="icon"><i class="bi bi-receipt"></i></div><h3>No orders yet</h3><p>Your placed orders will show up here.</p><a href="shop.html" class="btn btn-primary">Start Shopping</a></div>`;
      return;
    }
    root.innerHTML = `<div class="table-scroll"><table class="data-table">
      <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>${mine.map(o => `
        <tr>
          <td>${o.id}</td>
          <td>${new Date(o.date).toLocaleDateString()}</td>
          <td>${o.items.length} item(s)</td>
          <td>$${o.total.toFixed(2)}</td>
          <td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td>
          <td><span class="status-pill status-${o.paymentStatus.toLowerCase().replace(/\s+/g, "-")}">${o.paymentStatus}</span></td>
        </tr>`).join("")}</tbody>
    </table></div>`;
  }

  async function renderAccountArea() {
    const session = window.DF.api.getSession();
    const guestView = document.getElementById("guestView");
    const memberView = document.getElementById("memberView");
    if (!guestView || !memberView) return;

    if (!session) { guestView.style.display = "block"; memberView.style.display = "none"; return; }
    guestView.style.display = "none";
    memberView.style.display = "block";

    document.getElementById("acctName").textContent = session.name;
    document.getElementById("acctEmail").textContent = session.email;
    document.getElementById("profileNameInput") && (document.getElementById("profileNameInput").value = session.name);
    document.getElementById("profileEmailInput") && (document.getElementById("profileEmailInput").value = session.email);

    renderOrderHistory(session.email);
    window.DFwishlist?.renderWishlistPage?.();

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      window.DF.api.logoutCustomer();
      showToast("You've been signed out.", "");
      renderAccountArea();
    }, { once: true });
  }

  function initAccountNav() {
    document.querySelectorAll(".account-nav a[data-section]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".account-nav a").forEach(a => a.classList.remove("active"));
        link.classList.add("active");
        document.querySelectorAll(".account-section").forEach(s => s.style.display = "none");
        document.getElementById(link.dataset.section).style.display = "block";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAuthForms();
    initAccountNav();
    renderAccountArea();
  });
})();
