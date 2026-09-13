/**
 * Demand Footwear — backend/src/app.js
 * Express application setup: security middleware, parsers, and route mounting.
 * This file wires the app together; server.js starts it listening.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const orderRoutes = require("./routes/order.routes");
const customerRoutes = require("./routes/customer.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiting — tune per route as needed (e.g. stricter on /auth/login)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ---- Routes ----
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);

// ---- 404 + error handler ----
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
