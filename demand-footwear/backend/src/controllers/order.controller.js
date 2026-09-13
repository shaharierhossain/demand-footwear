const prisma = require("../services/prisma");

const TAX_RATE = 0.05;
const STANDARD_FEE = 5.99;
const EXPRESS_FEE = 14.99;
const FREE_DELIVERY_THRESHOLD = 150;

async function listOrders(req, res, next) {
  try {
    const { status, from, to } = req.query;
    const where = {
      AND: [
        status ? { status } : {},
        from ? { createdAt: { gte: new Date(from) } } : {},
        to ? { createdAt: { lte: new Date(to) } } : {},
      ],
    };
    const orders = await prisma.order.findMany({ where, include: { items: true, payment: true }, orderBy: { createdAt: "desc" } });
    res.json(orders);
  } catch (err) { next(err); }
}

async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: { include: { product: true } }, payment: true } });
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json(order);
  } catch (err) { next(err); }
}

/**
 * SECURITY-CRITICAL: this endpoint NEVER trusts prices, discounts, or
 * totals sent by the client. It re-reads each product's authoritative
 * price from the database and recomputes every total server-side, then
 * decrements stock atomically inside the same transaction — this is the
 * behavior the browser-only prototype cannot guarantee.
 */
async function createOrder(req, res, next) {
  const { customerName, email, phone, address, deliveryMethod, paymentMethod, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Order must contain at least one item." });

  try {
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const line of items) {
        const product = await tx.product.findUnique({ where: { id: line.productId }, include: { inventory: true } });
        if (!product) throw Object.assign(new Error(`Product ${line.productId} not found.`), { status: 404 });
        if (!product.inventory || product.inventory.totalStock < line.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}.`), { status: 409 });
        }
        const unitPrice = Number(product.price) * (1 - product.discountPercent / 100);
        subtotal += unitPrice * line.quantity;
        orderItemsData.push({ productId: product.id, size: line.size, color: line.color, quantity: line.quantity, unitPrice });

        // Decrement stock atomically as part of the same transaction.
        const newQty = product.inventory.totalStock - line.quantity;
        await tx.inventory.update({ where: { productId: product.id }, data: { totalStock: newQty } });
        await tx.inventoryTransaction.create({
          data: { inventoryId: product.inventory.id, previousQty: product.inventory.totalStock, adjustment: -line.quantity, newQty, reason: "Order placed", performedBy: req.user?.id || "system" },
        });
      }

      const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : (deliveryMethod === "express" ? EXPRESS_FEE : STANDARD_FEE);
      const tax = +(subtotal * TAX_RATE).toFixed(2);
      const total = +(subtotal + deliveryFee + tax).toFixed(2);
      const orderNumber = "DF-" + Date.now().toString(36).toUpperCase();

      return tx.order.create({
        data: {
          orderNumber, userId: req.user?.id || null, customerName, email, phone,
          addressLine1: address.line1, city: address.city, state: address.state, zip: address.zip, country: address.country,
          deliveryMethod, subtotal, deliveryFee, tax, total, status: "PENDING",
          items: { create: orderItemsData },
          payment: { create: { method: paymentMethod, status: paymentMethod === "cod" ? "CASH_ON_DELIVERY" : "PENDING" } },
        },
        include: { items: true, payment: true },
      });
    });

    res.status(201).json(order);
  } catch (err) { next(err); }
}

async function updateOrderStatus(req, res, next) {
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(order);
  } catch (err) { next(err); }
}

module.exports = { listOrders, getOrder, createOrder, updateOrderStatus };
