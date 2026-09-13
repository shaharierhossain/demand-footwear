/* =========================================================================
   DEMAND FOOTWEAR — wishlist.js
   Wishlist data model: array of product IDs, persisted via DF.api.
   ========================================================================= */

(function () {
  "use strict";

  function getWishlist() { return window.DF.api.getWishlist(); }
  function setWishlist(list) { window.DF.api.saveWishlist(list); window.DFupdateHeaderCounts?.(); }
  function isWishlisted(productId) { return getWishlist().includes(productId); }

  function toggleWishlist(productId) {
    let list = getWishlist();
    if (list.includes(productId)) {
      list = list.filter(id => id !== productId);
      setWishlist(list);
      showToast("Removed from wishlist.", "");
    } else {
      list.push(productId);
      setWishlist(list);
      showToast("Added to wishlist.", "success");
    }
    document.querySelectorAll(`[data-wishlist-btn="${productId}"]`).forEach(btn => btn.classList.toggle("active", list.includes(productId)));
    return list.includes(productId);
  }

  async function moveToCart(productId) {
    const product = await window.DF.api.fetchProductById(productId);
    if (!product) return;
    await window.DFcart.addToCart(productId, 1, product.sizes[0], product.colors[0]);
    toggleWishlist(productId);
    renderWishlistPage();
  }

  async function renderWishlistPage() {
    const root = document.getElementById("wishlistContent");
    if (!root) return;
    const ids = getWishlist();
    if (ids.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon"><i class="bi bi-heart"></i></div>
          <h3>Your wishlist is empty</h3>
          <p>Save the pairs you love and find them here anytime.</p>
          <a href="shop.html" class="btn btn-primary">Browse the Shop</a>
        </div>`;
      return;
    }
    const products = await window.DF.api.fetchProducts();
    const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
    root.innerHTML = `<div class="product-grid">${items.map(p => window.DFproducts.productCardHTML(p)).join("")}</div>`;
    window.DFproducts.wireProductGridEvents(root);
  }

  window.DFwishlist = { getWishlist, isWishlisted, toggleWishlist, moveToCart, renderWishlistPage };

  document.addEventListener("DOMContentLoaded", renderWishlistPage);
})();
