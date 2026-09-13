# Demand Footwear — "Step Into Your Demand."

A complete, modern e-commerce demo for a footwear & accessories brand: a full customer storefront and an admin dashboard for products, inventory, orders, customers, and sales — built with plain HTML5, CSS3, and vanilla JavaScript (ES6+), plus a production-ready Node.js/Express/Prisma backend starter.

> **This is a front-end demonstration.** Products, orders, customers, and analytics are simulated with `localStorage` in your browser. No real payments are processed and no data leaves your device. See [Security & Limitations](#security--limitations) before using any of this in production.

---

## 1. Features

**Storefront:** home, shop with filters/search/sort/pagination, product details with gallery & reviews, cart, wishlist, checkout, order confirmation, customer account (login/register/order history), about, contact, FAQ, privacy, terms.

**Admin dashboard:** login-gated SPA with sidebar navigation, sales analytics (Chart.js), product management (CRUD, duplicate, images, sizes/colors/pricing/stock), category management, inventory management (stock adjustments with logged history, low/out-of-stock reports), order management (status + payment status updates, printable detail), customer management, sales reports with CSV export, and store settings.

**Reset demo data:** Settings → "Reset Demo Data" restores the original sample catalog, orders, and customers.

## 2. Technologies used

- HTML5, CSS3 (custom design system, no framework build step), Vanilla JavaScript ES6+
- [Bootstrap Icons](https://icons.getbootstrap.com/) (CDN)
- [Google Fonts](https://fonts.google.com/) — Fraunces (display) + Inter (body)
- [Chart.js](https://www.chartjs.org/) (CDN) for dashboard analytics
- `localStorage` as a simulated database for the demo
- Backend starter: Node.js, Express, Prisma ORM, PostgreSQL/MySQL, JWT + bcrypt

## 3. File structure

```
demand-footwear/
├── index.html, shop.html, product.html, cart.html, wishlist.html,
│   checkout.html, order-confirmation.html, account.html,
│   about.html, contact.html, faq.html, privacy.html, terms.html
├── admin-login.html, admin.html
├── css/style.css
├── js/
│   ├── api.js         # simulated backend/data layer (see section 6)
│   ├── app.js          # shared header/footer/toasts/modals
│   ├── products.js     # product rendering, shop filters, PDP logic
│   ├── cart.js          # cart logic & totals
│   ├── wishlist.js       # wishlist logic
│   ├── checkout.js        # checkout validation + order creation
│   ├── account.js          # customer login/register/orders
│   ├── admin.js              # admin dashboard routing & CRUD
│   └── inventory.js            # inventory section of the admin dashboard
├── images/ (products/, categories/, logo/)
├── backend/                       # Node/Express/Prisma starter — see section 7
└── README.md
```

## 4. Running the front-end demo

No build step required.

1. Download/clone the project folder.
2. Open `index.html` directly in a browser, **or** serve it locally for the most reliable experience (recommended, since some browsers restrict certain features on `file://`):
   ```bash
   npx serve .
   # or
   python3 -m http.server 5500
   ```
3. Browse the storefront. Cart/wishlist/orders persist in your browser's `localStorage`.
4. Visit `admin-login.html` to reach the dashboard. **Demo credentials:** `admin` / `demand2026` (front-end only — see security notes).

## 5. Replacing product images

Demo products use royalty-free Unsplash photo URLs (`js/api.js`, `img()` helper) with an automatic SVG fallback (`onImgError`) if a URL fails to load.

**To use your own photos:**
- **Quick swap (still remote):** edit the `images: [...]` array for each product in `js/api.js`, or use the Admin → Products → Edit form's "Product Images" field (one URL per line).
- **Local files:** place images in `images/products/your-file.jpg` and reference them as relative paths, e.g. `images: ["images/products/urban-runner-1.jpg"]`.
- **Production:** upload through the backend to a cloud image service (Cloudinary, AWS S3 + CloudFront, Bunny CDN, etc.) rather than committing large binaries to your web server or git repo. Validate file type and size server-side before accepting an upload (see `backend/.env.example` for `IMAGE_STORAGE_PROVIDER`).

## 6. How the front-end connects to a real backend

`js/api.js` is written as a drop-in API client: every function (`fetchProducts`, `createOrder`, `updateInventory`, `loginAdmin`, …) already has the exact name and return shape a real API client would have — it just reads/writes `localStorage` instead of calling `fetch()`. To connect the real backend, replace the body of each function with a fetch call, for example:

```js
// Before (demo):
async fetchProducts() { return read(STORAGE_KEYS.PRODUCTS, []); }

// After (production):
async fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const response = await fetch(`/api/products?${qs}`);
  if (!response.ok) throw new Error("Unable to load products");
  return response.json();
}
```

No other file needs to change — `products.js`, `cart.js`, `admin.js`, etc. all call `window.DF.api.*` and don't know or care whether the data came from `localStorage` or a network request. Add loading states around `await` calls and `try/catch` blocks for error states as you wire up each screen.

## 7. Backend architecture (`/backend`)

```
backend/
├── src/
│   ├── server.js         # starts the HTTP server
│   ├── app.js             # Express app, middleware, route mounting
│   ├── config/             # (add environment/config loaders here)
│   ├── controllers/          # product, category, inventory, order, customer, auth
│   ├── routes/                 # REST endpoints per resource
│   ├── middleware/               # auth.middleware.js (JWT + role checks)
│   ├── services/                  # prisma.js (DB client singleton)
│   ├── utils/                      # (add shared helpers here)
│   └── validations/                 # express-validator rule sets
├── prisma/schema.prisma               # Users, Products, ProductImages, Categories,
│                                        # ProductVariants, Inventory, InventoryTransactions,
│                                        # Orders, OrderItems, Payments, Addresses, Reviews,
│                                        # Wishlists/WishlistItems
├── package.json
└── .env.example
```

### Setting it up

```bash
cd backend
npm install
cp .env.example .env        # fill in your real DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate dev --name init
npm run dev                 # starts on http://localhost:4000
```

### Example REST endpoints

```
GET    /api/products                 List/search/filter products
GET    /api/products/:id             Product detail
POST   /api/products                 Create product (admin/staff)
PUT    /api/products/:id             Update product (admin/staff)
DELETE /api/products/:id             Delete product (admin)

GET    /api/categories
POST   /api/categories               (admin)

GET    /api/inventory                (admin/staff)
GET    /api/inventory/log            (admin/staff)
PATCH  /api/inventory/:productId     Adjust stock — runs in a DB transaction (admin/staff)

GET    /api/orders                   (admin/staff)
POST   /api/orders                   Create order — server recomputes price/stock/totals
PATCH  /api/orders/:id/status        (admin/staff)

GET    /api/customers                (admin/staff)

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
```

## 8. Security & limitations

The front-end prototype **simulates** an inventory and order system for demonstration; it cannot be secure on its own because a browser can never be trusted with authority over money, stock, or access control. The `backend/` starter shows the pattern a real deployment must follow:

- **Never trust the client for price, discount, tax, or total.** `backend/src/controllers/order.controller.js` re-reads each product's price from the database and recomputes every total server-side before creating an order — it never uses numbers submitted by the browser.
- **Stock adjustments run inside database transactions** (`prisma.$transaction`) with an authoritative row check, so two simultaneous checkouts can never both succeed against the last unit of stock. The demo's `localStorage` version has no such protection and is not safe for concurrent/multi-tab use.
- **No password is ever stored or checked in front-end JavaScript.** The demo's `admin`/`demand2026` gate and "any email logs in" customer flow exist purely to let you click through the UI. Real authentication must hash passwords with bcrypt/argon2 server-side (`backend/src/controllers/auth.controller.js` shows this) and issue signed, short-lived JWTs or HTTP-only session cookies — never store a real password or API key in `localStorage`.
- **Admin routes must be protected server-side**, not just hidden behind a front-end login page. See `requireAuth`/`requireRole` in `backend/src/middleware/auth.middleware.js`.
- **No real payment processing occurs anywhere in this repository.** Checkout payment options are demonstration placeholders. A production integration must use a PCI-compliant gateway (Stripe, Adyen, SSLCommerz, etc.) with card data handled entirely by the gateway's hosted fields/SDK — your servers should never see raw card numbers.
- **Validate and sanitize all input server-side** (see `express-validator` usage in `backend/src/validations/`), restrict uploaded file types/sizes, and rate-limit sensitive endpoints (login is rate-limited in `backend/src/routes/auth.routes.js`).
- **Use HTTPS everywhere** in production, and keep all secrets in environment variables (`backend/.env`, which is git-ignored) — never commit `.env` or hardcode credentials.

## 9. Customizing branding

- Colors, type, spacing: edit the CSS custom properties at the top of `css/style.css` (`:root { --df-black, --df-beige, --df-accent, ... }`).
- Store name/tagline: Admin → Settings, or edit the `<title>`/hero copy directly in the HTML files.
- Logo mark: the "DF" monogram is inline HTML/CSS (`.brand .mark`) — replace with an `<img>` tag pointing to `images/logo/your-logo.svg` if you have one.

## 10. Deployment

- **Front-end:** any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3+CloudFront, or your own web server) — it's plain HTML/CSS/JS with no build step.
- **Backend:** deploy `backend/` to a Node-friendly host (Render, Railway, Fly.io, a VPS, or a container platform) with a managed PostgreSQL/MySQL database. Set all variables from `.env.example` in your host's environment configuration, run `npx prisma migrate deploy`, and point the front-end's API base URL (once wired per section 6) at your backend's public URL.

## 11. Future improvements

- Wire `js/api.js` to the real backend endpoints listed above.
- Add real image upload (multer + cloud storage) in the admin product form.
- Integrate a payment gateway's hosted checkout/SDK.
- Add automated tests (unit tests for cart/pricing logic, integration tests for the API).
- Add pagination/infinite scroll to the admin order/customer tables for large datasets.
- Internationalization (multi-currency, multi-language) if expanding beyond one market.

---

*Demo data, reviews, and customer records throughout this project are fictional and generated solely for demonstration purposes.*
