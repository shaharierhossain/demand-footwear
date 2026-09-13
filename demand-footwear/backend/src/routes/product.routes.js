const router = require("express").Router();
const ctrl = require("../controllers/product.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { productRules, validate } = require("../validations/product.validation");

// Public — browsing the catalog needs no auth
router.get("/", ctrl.listProducts);
router.get("/:id", ctrl.getProduct);

// Admin-only — protected + validated
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), productRules, validate, ctrl.createProduct);
router.put("/:id", requireAuth, requireRole("ADMIN", "STAFF"), ctrl.updateProduct);
router.delete("/:id", requireAuth, requireRole("ADMIN"), ctrl.deleteProduct);

module.exports = router;
