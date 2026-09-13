const { body, validationResult } = require("express-validator");

const productRules = [
  body("name").isString().trim().isLength({ min: 2, max: 160 }),
  body("sku").isString().trim().isLength({ min: 2, max: 60 }),
  body("categoryId").isString().notEmpty(),
  body("brand").isString().trim().notEmpty(),
  body("description").isString().trim().isLength({ max: 4000 }),
  // Never trust a price sent as a string with symbols — coerce and bound it.
  body("price").isFloat({ min: 0, max: 100000 }),
  body("discountPercent").optional().isInt({ min: 0, max: 90 }),
  body("lowStockThreshold").optional().isInt({ min: 0 }),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

module.exports = { productRules, validate };
