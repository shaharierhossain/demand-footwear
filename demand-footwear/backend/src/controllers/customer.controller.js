const prisma = require("../services/prisma");

async function listCustomers(req, res, next) {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(customers);
  } catch (err) { next(err); }
}

async function getCustomer(req, res, next) {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true, orders: true, addresses: true },
    });
    if (!customer) return res.status(404).json({ error: "Customer not found." });
    res.json(customer);
  } catch (err) { next(err); }
}

module.exports = { listCustomers, getCustomer };
