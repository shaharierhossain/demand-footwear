/* =========================================================================
   DEMAND FOOTWEAR — checkout.js
   Demo checkout: validates fields, renders order summary, creates a
   simulated order and deducts simulated stock. NO REAL PAYMENT IS
   PROCESSED. See README > Security for how this must work in production.
   ========================================================================= */

(function () {
  "use strict";

  let deliveryMethod = "standard";
  let paymentMethod = "cod";

  async function renderSummary() {
    const el = document.getElementById("checkoutSummary");
    if (!el) return;
    const { detailed, subtotal, delivery, tax, total } = await window.DFcart.computeTotals(deliveryMethod);
    if (detailed.length === 0) {
      window.location.href = "cart.html";
      return;
    }
    el.innerHTML = `
      <h3>Order Summary</h3>
      <div style="max-height:280px;overflow-y:auto;margin-bottom:12px;">
        ${detailed.map(i => `
          <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--df-border);align-items:center;">
            <div class="cart-thumb" style="width:56px;height:56px;"><img src="${i.product.images[0]}" alt="${i.product.name}" onerror="onImgError(this,'${i.product.name}')"></div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:.88rem;">${i.product.name}</div>
              <div class="cart-item-meta">Size ${i.selectedSize} &middot; ${i.selectedColor} &middot; Qty ${i.quantity}</div>
            </div>
            <div style="font-weight:600;">$${(window.DFcart.finalPrice(i.product) * i.quantity).toFixed(2)}</div>
          </div>`).join("")}
      </div>
      <div class="summary-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="summary-line"><span>Delivery (${deliveryMethod === "express" ? "Express" : "Standard"})</span><span>${delivery === 0 ? "Free" : "$" + delivery.toFixed(2)}</span></div>
      <div class="summary-line"><span>Estimated Tax (5%)</span><span>$${tax.toFixed(2)}</span></div>
      <div class="summary-line total"><span>Grand Total</span><span>$${total.toFixed(2)}</span></div>
      <div class="notice-box"><i class="bi bi-shield-lock"></i> This is a demonstration checkout. No real payment will be charged.</div>
    `;
  }

  function validateField(input) {
    const errorEl = document.getElementById(input.id + "Error");
    let valid = true, message = "";
    if (input.hasAttribute("required") && !input.value.trim()) { valid = false; message = "This field is required."; }
    else if (input.type === "email" && input.value && !/^\S+@\S+\.\S+$/.test(input.value)) { valid = false; message = "Enter a valid email address."; }
    else if (input.type === "tel" && input.value && !/^[0-9+\-\s()]{7,}$/.test(input.value)) { valid = false; message = "Enter a valid phone number."; }
    input.classList.toggle("error", !valid);
    if (errorEl) { errorEl.textContent = message; errorEl.classList.toggle("show", !valid); }
    return valid;
  }

  function validateForm(form) {
    let allValid = true;
    form.querySelectorAll(".form-control[required], input[type=email], input[type=tel]").forEach(input => {
      if (!validateField(input)) allValid = false;
    });
    return allValid;
  }

  async function placeOrder(form) {
    if (!validateForm(form)) { showToast("Please fix the highlighted fields.", "error"); return; }
    const fd = new FormData(form);
    const { detailed, subtotal, delivery, tax, total } = await window.DFcart.computeTotals(deliveryMethod);

    const order = {
      customerId: window.DF.api.getSession()?.email || "guest",
      customerName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      items: detailed.map(i => ({ productId: i.product.id, name: i.product.name, image: i.product.images[0], price: window.DFcart.finalPrice(i.product), qty: i.quantity, size: i.selectedSize, color: i.selectedColor })),
      subtotal, delivery, tax, discount: 0, total,
      status: "Pending",
      paymentStatus: paymentMethod === "cod" ? "Cash on Delivery" : "Pending",
      paymentMethod: { cod: "Cash on Delivery", card: "Card Payment (demo)", mobile: "Mobile Payment (demo)", bank: "Bank Transfer (demo)" }[paymentMethod],
      address: { line1: fd.get("address"), city: fd.get("city"), state: fd.get("state"), zip: fd.get("zip"), country: fd.get("country") },
      deliveryMethod: deliveryMethod === "express" ? "Express" : "Standard",
    };

    const btn = document.getElementById("placeOrderBtn");
    btn.disabled = true; btn.innerHTML = '<i class="bi bi-arrow-repeat"></i>&nbsp; Placing order…';

    try {
      const created = await window.DF.api.createOrder(order);
      window.DF.api.saveCart([]);
      sessionStorage.setItem("df_last_order", created.id);
      window.location.href = "order-confirmation.html?order=" + created.id;
    } catch (err) {
      showToast("Something went wrong placing your order. Please try again.", "error");
      btn.disabled = false; btn.innerHTML = "Place Order";
    }
  }

  function wireOptionGroup(selector, stateSetter, onChange) {
    document.querySelectorAll(selector).forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll(selector).forEach(o => { o.classList.remove("selected"); o.querySelector("input") && (o.querySelector("input").checked = false); });
        opt.classList.add("selected");
        const input = opt.querySelector("input");
        if (input) input.checked = true;
        stateSetter(opt.dataset.value);
        onChange?.();
      });
    });
  }

  async function initCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    const session = window.DF.api.getSession();
    if (session) {
      form.querySelector("[name=fullName]").value = session.name || "";
      form.querySelector("[name=email]").value = session.email || "";
    }

    renderSummary();
    wireOptionGroup(".delivery-option", (v) => { deliveryMethod = v; }, renderSummary);
    wireOptionGroup(".pay-option", (v) => { paymentMethod = v; });

    // default selections
    document.querySelector('.delivery-option[data-value="standard"]')?.classList.add("selected");
    document.querySelector('.pay-option[data-value="cod"]')?.classList.add("selected");

    form.querySelectorAll(".form-control").forEach(input => {
      input.addEventListener("blur", () => validateField(input));
    });

    form.addEventListener("submit", (e) => { e.preventDefault(); placeOrder(form); });
  }

  async function initOrderConfirmation() {
    const root = document.getElementById("orderConfirmRoot");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order") || sessionStorage.getItem("df_last_order");
    const order = orderId ? await window.DF.api.fetchOrderById(orderId) : null;
    if (!order) { root.innerHTML = `<div class="empty-state"><h3>No recent order found</h3><a href="shop.html" class="btn btn-primary">Continue Shopping</a></div>`; return; }

    root.innerHTML = `
      <div class="confirm-hero">
        <div class="check-circle"><i class="bi bi-check-lg"></i></div>
        <h1>Thank you, ${order.customerName.split(" ")[0]}!</h1>
        <p class="muted">Your order has been placed successfully. This is a demo order — no real charge or shipment occurs.</p>
        <h3 style="margin-top:18px;">Order # ${order.id}</h3>
      </div>
      <div class="card-surface" style="max-width:640px;margin:0 auto;">
        <div class="summary-line"><span>Order Date</span><span>${new Date(order.date).toLocaleString()}</span></div>
        <div class="summary-line"><span>Payment Method</span><span>${order.paymentMethod}</span></div>
        <div class="summary-line"><span>Delivery Method</span><span>${order.deliveryMethod}</span></div>
        <div class="summary-line"><span>Shipping To</span><span>${order.address.line1}, ${order.address.city}</span></div>
        <div class="summary-line total"><span>Grand Total</span><span>$${order.total.toFixed(2)}</span></div>
      </div>
      <div class="text-center" style="margin-top:28px;">
        <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
        <a href="account.html" class="btn btn-ghost">View Order History</a>
      </div>`;
  }

  document.addEventListener("DOMContentLoaded", () => { initCheckout(); initOrderConfirmation(); });
})();
