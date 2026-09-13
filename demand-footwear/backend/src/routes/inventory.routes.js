const router = require("express").Router();
const ctrl = require("../controllers/inventory.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.listInventory);
router.get("/log", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.getInventoryLog);
router.patch("/:productId", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.adjustInventory);

module.exports = router;
