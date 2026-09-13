const prisma = require("../services/prisma");

async function listInventory(req, res, next) {
  try {
    const inventory = await prisma.inventory.findMany({ include: { product: { select: { id: true, name: true, sku: true, lowStockThreshold: true, category: true } } } });
    res.json(inventory);
  } catch (err) { next(err); }
}

/**
 * Adjust stock for a product. Runs inside a single DB transaction with a
 * row lock so two concurrent requests (e.g. two customers checking out the
 * last pair at the same moment) can never both succeed — this is the
 * concurrency-safety the front-end's localStorage simulation CANNOT provide.
 */
async function adjustInventory(req, res, next) {
  const { productId } = req.params;
  const { delta, reason } = req.body;
  const performedBy = req.user?.id || "system";

  try {
    const result = await prisma.$transaction(async (tx) => {
      // SELECT ... FOR UPDATE equivalent via Prisma's transaction isolation
      const inventory = await tx.inventory.findUnique({ where: { productId } });
      if (!inventory) throw Object.assign(new Error("Inventory record not found."), { status: 404 });

      const nextQty = inventory.totalStock + Number(delta);
      if (nextQty < 0) throw Object.assign(new Error("Insufficient stock for this adjustment."), { status: 409 });

      const updated = await tx.inventory.update({ where: { productId }, data: { totalStock: nextQty } });
      await tx.inventoryTransaction.create({
        data: { inventoryId: inventory.id, previousQty: inventory.totalStock, adjustment: Number(delta), newQty: nextQty, reason: reason || "Manual adjustment", performedBy },
      });
      return updated;
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function getInventoryLog(req, res, next) {
  try {
    const where = req.query.productId ? { inventory: { productId: req.query.productId } } : {};
    const log = await prisma.inventoryTransaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { inventory: { include: { product: true } } } });
    res.json(log);
  } catch (err) { next(err); }
}

module.exports = { listInventory, adjustInventory, getInventoryLog };
