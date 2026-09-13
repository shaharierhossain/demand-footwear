const router = require("express").Router();
const ctrl = require("../controllers/category.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

router.get("/", ctrl.listCategories);
router.post("/", requireAuth, requireRole("ADMIN"), ctrl.createCategory);
router.put("/:id", requireAuth, requireRole("ADMIN"), ctrl.updateCategory);
router.delete("/:id", requireAuth, requireRole("ADMIN"), ctrl.deleteCategory);

module.exports = router;
