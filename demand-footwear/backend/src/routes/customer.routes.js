const router = require("express").Router();
const ctrl = require("../controllers/customer.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.listCustomers);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.getCustomer);

module.exports = router;
