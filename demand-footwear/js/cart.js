/* =========================================================================
   DEMAND FOOTWEAR — cart.js
   Cart data model (localStorage-backed in the demo):
   { productId, quantity, selectedSize, selectedColor }
   ========================================================================= */

(function () {
  "use strict";
  const DELIVERY_STANDARD = 5.99;
  const DELIVERY_EXPRESS = 14.99;
  const TAX_RATE = 0.05;
  const FREE_DELIVERY_THRESHOLD = 150;

  function lineKey(item) { return [item.productId, item.selectedSize, item.selectedColor].join("::"); }

  function getCart() { return window.DF.api.getCart(); }
  function setCart(cart) { window.DF.api.saveCart(cart); window.DFupdateHeaderCounts?.(); }

  /** Adds a product to the cart, respecting available stock. */
  async function addToCart(productId, quantity, selectedSize, selectedColor) {
    const product = await window.DF.api.fetchProductById(productId);
    if (!product) { showToast("Product not found.", "error"); return false; }
    if (product.stock <= 0) { showToast("This product is currently out of stock.", "error"); return false; }

    const cart = getCart();
    const key = lineKey({ productId, selectedSize, selectedColor });
    const existing = cart.find(i => lineKey(i) === key);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + quantity > product.stock) {
      showToast(`Only ${product.stock} unit(s) of "${product.name}" available.`, "warn");
      quantity = Math.max(0, product.stock - currentQty);
      if (quantity === 0) return false;
    }

    if (existing) existing.quantity += quantity;
    else cart.push({ productId, quantity, selectedSize, selectedColor });

    setCart(cart);
    showToast(`Added "${product.name}" to your cart.`, "success");
    return true;
  }

  function removeFromCart(productId, selectedSize, selectedColor) {
    const key = [productId, selectedSize, selectedColor].join("::");
    const cart = getCart().filter(i => lineKey(i) !== key);
    setCart(cart);
    renderCartPage();
  }

  async function updateQuantity(productId, selectedSize, selectedColor, newQty) {
    const cart = getCart();
    const key = [productId, selectedSize, selectedColor].join("::");
    const item = cart.find(i => lineKey(i) === key);
    if (!item) return;
    const product = await window.DF.api.fetchProductById(productId);
    if (newQty < 1) { removeFromCart(productId, selectedSize, selectedColor); return; }
    if (product && newQty > product.stock) {
      showToast(`Only ${product.stock} unit(s) available.`, "warn");
      newQty = product.stock;
    }
    item.quantity = newQty;
    setCart(cart);
    renderCartPage();
  }

  async function getCartDetailed() {
    const cart = getCart();
    const products = await window.DF.api.fetchProducts();
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    }).filter(i => i.product);
  }

  function finalPrice(p) { return +(p.price * (1 - (p.discount || 0) / 100)).toFixed(2); }

  async function computeTotals(deliveryMethod) {
    const detailed = await getCartDetailed();
    const subtotal = detailed.reduce((s, i) => s + finalPrice(i.product) * i.quantity, 0);
    const delivery = subtotal === 0 ? 0 : (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : (deliveryMethod === "express" ? DELIVERY_EXPRESS : DELIVERY_STANDARD));
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + delivery + tax).toFixed(2);
    return { detailed, subtotal: +subtotal.toFixed(2), delivery, tax, total };
  }

  /* ---- Rendering the cart page ---- */
  async function renderCartPage() {
    const root = document.getElementById("cartContent");
    if (!root) return;
    const { detailed, subtotal, delivery, tax, total } = await computeTotals();

    if (detailed.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon"><i class="bi bi-bag-x"></i></div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
        </div>`;
      return;
    }

    const rows = detailed.map(i => `
      <div class="cart-row" data-key="${i.productId}::${i.selectedSize}::${i.selectedColor}">
        <div class="cart-thumb"><img src="${i.product.images[0]}" alt="${i.product.name}" onerror="onImgError(this,'${i.product.name}')"></div>
        <div>
          <div class="cart-item-title"><a href="product.html?id=${i.product.id}">${i.product.name}</a></div>
          <div class="cart-item-meta">Size ${i.selectedSize} &middot; ${i.selectedColor} &middot; $${finalPrice(i.product).toFixed(2)} each</div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button aria-label="Decrease quantity" data-act="dec">−</button>
              <span>${i.quantity}</span>
              <button aria-label="Increase quantity" data-act="inc">+</button>
            </div>
            <button class="cart-remove" data-act="remove">Remove</button>
          </div>
        </div>
        <div class="cart-item-total">$${(finalPrice(i.product) * i.quantity).toFixed(2)}</div>
      </div>`).join("");

    root.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="card-surface">${rows}</div>
          <a href="shop.html" class="btn btn-ghost" style="margin-top:16px;"><i class="bi bi-arrow-left"></i>&nbsp; Continue Shopping</a>
        </div>
        <div class="card-surface">
          <h3>Order Summary</h3>
          <div class="summary-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="summary-line"><span>Delivery</span><span>${delivery === 0 ? "Free" : "$" + delivery.toFixed(2)}</span></div>
          <div class="summary-line"><span>Estimated Tax (5%)</span><span>$${tax.toFixed(2)}</span></div>
          <div class="summary-line total"><span>Grand Total</span><span>$${total.toFixed(2)}</span></div>
          <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:14px;">Proceed to Checkout</a>
          <p class="hint" style="margin-top:10px;">Free delivery on orders over $${FREE_DELIVERY_THRESHOLD}.</p>
        </div>
      </div>`;

    root.addEventListener("click", onCartRowClick);
  }

  function onCartRowClick(e) {
    const row = e.target.closest(".cart-row");
    if (!row) return;
    const [productId, selectedSize, selectedColor] = row.dataset.key.split("::");
    if (e.target.dataset.act === "remove") removeFromCart(productId, selectedSize, selectedColor);
    if (e.target.dataset.act === "inc" || e.target.dataset.act === "dec") {
      const span = row.querySelector(".qty-stepper span");
      let qty = parseInt(span.textContent, 10);
      qty = e.target.dataset.act === "inc" ? qty + 1 : qty - 1;
      updateQuantity(productId, selectedSize, selectedColor, qty);
    }
  }

  window.DFcart = { addToCart, removeFromCart, updateQuantity, getCartDetailed, computeTotals, finalPrice, renderCartPage, DELIVERY_STANDARD, DELIVERY_EXPRESS, TAX_RATE, FREE_DELIVERY_THRESHOLD };

  document.addEventListener("DOMContentLoaded", renderCartPage);
})();
