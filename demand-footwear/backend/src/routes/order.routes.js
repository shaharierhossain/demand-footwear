const router = require("express").Router();
const ctrl = require("../controllers/order.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

// Order creation is allowed for guests or logged-in customers (requireAuth
// omitted here); if you require accounts to check out, add requireAuth.
router.post("/", ctrl.createOrder);

router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.listOrders);
router.get("/:id", requireAuth, ctrl.getOrder);
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.updateOrderStatus);

module.exports = router;
