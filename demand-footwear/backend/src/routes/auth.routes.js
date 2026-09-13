const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/auth.controller");

// Stricter limiter for auth endpoints to slow down credential-stuffing attempts.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many login attempts. Please try again later." } });

router.post("/register", ctrl.register);
router.post("/login", loginLimiter, ctrl.login);
router.post("/logout", ctrl.logout);

module.exports = router;
