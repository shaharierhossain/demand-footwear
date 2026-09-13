/* =========================================================================
   DEMAND FOOTWEAR — app.js
   Shared shell: header, footer, mobile nav, toasts, modals, back-to-top,
   newsletter, scroll-reveal. Loaded on every customer-facing page.
   ========================================================================= */

(function () {
  "use strict";

  const CATEGORY_LINKS = [
    { id: "sneakers", name: "Sneakers" },
    { id: "leather-shoes", name: "Leather Shoes" },
    { id: "formal", name: "Formal Shoes" },
    { id: "casual", name: "Casual Shoes" },
    { id: "boots", name: "Boots" },
    { id: "sandals", name: "Sandals" },
    { id: "accessories", name: "Accessories" },
  ];

  function catLinks(cls) {
    return CATEGORY_LINKS.map(c => `<a class="${cls || ""}" href="shop.html?category=${c.id}">${c.name}</a>`).join("");
  }

  function headerHTML() {
    return `
    <div class="announce-bar">Free delivery on selected orders &nbsp;|&nbsp; <strong>Discover your next favorite pair</strong></div>
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="brand" aria-label="Demand Footwear home">
          <span class="mark">DF</span>
          <span>Demand Footwear<span class="tag">Step Into Your Demand</span></span>
        </a>
        <nav class="main-nav" aria-label="Primary">
          <a href="index.html">Home</a>
          <a href="shop.html">Shop</a>
          <div class="nav-drop">
            <a href="shop.html" aria-haspopup="true">Categories</a>
            <div class="nav-drop-panel">${catLinks()}</div>
          </div>
          <a href="shop.html?filter=new">New Arrivals</a>
          <a href="shop.html?filter=bestseller">Best Sellers</a>
          <a href="shop.html?filter=sale">Offers</a>
          <a href="about.html">About</a>
          <a href="contact.html">Contact</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" id="searchToggle" aria-label="Search"><i class="bi bi-search"></i></button>
          <a href="wishlist.html" class="icon-btn" aria-label="Wishlist"><i class="bi bi-heart"></i><span class="badge-count" id="wishlistCount" hidden>0</span></a>
          <a href="cart.html" class="icon-btn" aria-label="Shopping cart"><i class="bi bi-bag"></i><span class="badge-count" id="cartCount" hidden>0</span></a>
          <a href="account.html" class="icon-btn" aria-label="Account"><i class="bi bi-person"></i></a>
          <button class="icon-btn mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu"><i class="bi bi-list"></i></button>
        </div>
      </div>
      <div class="search-flyout" id="searchFlyout">
        <div class="container">
          <form id="headerSearchForm" role="search">
            <input type="search" id="headerSearchInput" placeholder="Search sneakers, boots, leather shoes…" aria-label="Search products" autocomplete="off">
          </form>
        </div>
      </div>
    </header>
    <div class="mobile-nav-backdrop" id="mobileBackdrop"></div>
    <aside class="mobile-nav" id="mobileNav" aria-label="Mobile navigation">
      <div class="mobile-nav-head">
        <span class="brand"><span class="mark">DF</span> Demand Footwear</span>
        <button class="icon-btn" id="mobileCloseBtn" aria-label="Close menu"><i class="bi bi-x-lg"></i></button>
      </div>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="shop.html">Shop</a></li>
        ${CATEGORY_LINKS.map(c => `<li><a href="shop.html?category=${c.id}">${c.name}</a></li>`).join("")}
        <li><a href="shop.html?filter=new">New Arrivals</a></li>
        <li><a href="shop.html?filter=bestseller">Best Sellers</a></li>
        <li><a href="shop.html?filter=sale">Offers</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="wishlist.html">Wishlist</a></li>
        <li><a href="cart.html">Cart</a></li>
        <li><a href="account.html">My Account</a></li>
      </ul>
    </aside>`;
  }

  function footerHTML() {
    return `
    <div class="container footer-top">
      <div class="footer-col">
        <div class="footer-brand"><span class="mark" style="background:var(--df-accent)">DF</span> Demand Footwear</div>
        <p class="footer-desc">Premium footwear designed for your everyday journey. Sneakers, leather shoes, boots and accessories built to move with you.</p>
        <div class="social-row">
          <a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
          <a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
          <a href="#" aria-label="X (Twitter)"><i class="bi bi-twitter-x"></i></a>
          <a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h5>Shop</h5>
        <ul>
          <li><a href="shop.html?category=sneakers">Sneakers</a></li>
          <li><a href="shop.html?category=leather-shoes">Leather Shoes</a></li>
          <li><a href="shop.html?category=formal">Formal Shoes</a></li>
          <li><a href="shop.html?category=boots">Boots</a></li>
          <li><a href="shop.html?category=sandals">Sandals</a></li>
          <li><a href="shop.html?category=accessories">Accessories</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Customer Support</h5>
        <ul>
          <li><a href="contact.html">Contact Us</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="account.html">Order Tracking</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms &amp; Conditions</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Company</h5>
        <ul>
          <li><a href="about.html">About Us</a></li>
          <li><a href="admin-login.html">Admin Login</a></li>
          <li><a href="contact.html">Careers</a></li>
          <li><a href="contact.html">Store Locations</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Contact</h5>
        <ul>
          <li>House 12, Road 5, Dhaka, Bangladesh</li>
          <li>hello@demandfootwear.example</li>
          <li>+880 1700-000000</li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>&copy; ${new Date().getFullYear()} Demand Footwear. All rights reserved. Demo storefront — no real transactions occur.</span>
      <span class="payment-icons">
        <i class="bi bi-credit-card"></i><i class="bi bi-wallet2"></i><i class="bi bi-bank"></i><i class="bi bi-cash-coin"></i>
      </span>
    </div>`;
  }

  function mountShell() {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();

    // Mobile nav
    const mobileNav = document.getElementById("mobileNav");
    const backdrop = document.getElementById("mobileBackdrop");
    const openBtn = document.getElementById("mobileMenuBtn");
    const closeBtn = document.getElementById("mobileCloseBtn");
    function openMenu() { mobileNav?.classList.add("open"); backdrop?.classList.add("open"); document.body.style.overflow = "hidden"; }
    function closeMenu() { mobileNav?.classList.remove("open"); backdrop?.classList.remove("open"); document.body.style.overflow = ""; }
    openBtn?.addEventListener("click", openMenu);
    closeBtn?.addEventListener("click", closeMenu);
    backdrop?.addEventListener("click", closeMenu);

    // Search flyout
    const searchToggle = document.getElementById("searchToggle");
    const searchFlyout = document.getElementById("searchFlyout");
    searchToggle?.addEventListener("click", () => {
      searchFlyout.classList.toggle("open");
      if (searchFlyout.classList.contains("open")) document.getElementById("headerSearchInput")?.focus();
    });
    document.getElementById("headerSearchForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("headerSearchInput").value.trim();
      window.location.href = "shop.html?q=" + encodeURIComponent(q);
    });

    updateHeaderCounts();
  }

  /* ---- Counts on cart / wishlist icons ---- */
  function updateHeaderCounts() {
    const cart = window.DF?.api.getCart() || [];
    const wishlist = window.DF?.api.getWishlist() || [];
    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const cartEl = document.getElementById("cartCount");
    const wishEl = document.getElementById("wishlistCount");
    if (cartEl) { cartEl.textContent = cartCount; cartEl.hidden = cartCount === 0; }
    if (wishEl) { wishEl.textContent = wishlist.length; wishEl.hidden = wishlist.length === 0; }
  }
  window.DFupdateHeaderCounts = updateHeaderCounts;

  /* ---- Toast notifications ---- */
  function ensureToastWrap() {
    let wrap = document.getElementById("toastWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "toastWrap";
      wrap.className = "toast-wrap";
      wrap.setAttribute("role", "status");
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    return wrap;
  }
  function showToast(message, type) {
    const wrap = ensureToastWrap();
    const toast = document.createElement("div");
    toast.className = "toast" + (type ? " " + type : "");
    const icon = type === "success" ? "bi-check-circle" : type === "error" ? "bi-exclamation-circle" : type === "warn" ? "bi-exclamation-triangle" : "bi-info-circle";
    toast.innerHTML = `<i class="bi ${icon}"></i><span>${message}</span>`;
    wrap.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity .3s"; setTimeout(() => toast.remove(), 300); }, 3200);
  }
  window.showToast = showToast;

  /* ---- Confirm dialog (returns a Promise<boolean>) ---- */
  function confirmDialog(message, confirmLabel) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop open";
      backdrop.innerHTML = `
        <div class="modal-box confirm-box">
          <h3>Are you sure?</h3>
          <p class="muted">${message}</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" data-act="cancel">Cancel</button>
            <button class="btn btn-danger" data-act="ok">${confirmLabel || "Confirm"}</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop || e.target.dataset.act === "cancel") { backdrop.remove(); resolve(false); }
        if (e.target.dataset.act === "ok") { backdrop.remove(); resolve(true); }
      });
    });
  }
  window.confirmDialog = confirmDialog;

  /* ---- Generic modal helper (for quick view etc.) ---- */
  function openModal(innerHTML, id) {
    closeModal(id);
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop open";
    backdrop.id = id || "genericModal";
    backdrop.innerHTML = `<div class="modal-box">
        <button class="icon-btn modal-close" aria-label="Close"><i class="bi bi-x-lg"></i></button>
        ${innerHTML}
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop || e.target.closest(".modal-close")) backdrop.remove();
    });
    return backdrop;
  }
  function closeModal(id) { document.getElementById(id || "genericModal")?.remove(); }
  window.openModal = openModal;
  window.closeModal = closeModal;

  /* ---- Back to top ---- */
  function mountBackToTop() {
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    document.body.appendChild(btn);
    window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 500));
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---- Scroll reveal (single, restrained pass) ---- */
  function mountScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length || !("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(i => io.observe(i));
  }

  /* ---- Newsletter (demo only — does not really send emails) ---- */
  function mountNewsletter() {
    document.addEventListener("submit", (e) => {
      if (e.target.matches("#newsletterForm")) {
        e.preventDefault();
        const input = e.target.querySelector("input[type=email]");
        if (input && input.value) {
          showToast("Thanks for subscribing! (Demo only — no email was actually sent.)", "success");
          e.target.reset();
        }
      }
    });
  }

  /* ---- FAQ accordion (used on faq.html) ---- */
  function mountFaq() {
    document.addEventListener("click", (e) => {
      const q = e.target.closest(".faq-q");
      if (q) q.closest(".faq-item").classList.toggle("open");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    mountShell();
    mountBackToTop();
    mountNewsletter();
    mountFaq();
    setTimeout(mountScrollReveal, 30);
  });
})();
