/**
 * Auth controller — demonstrates the MINIMUM real-world requirements
 * the front-end demo intentionally skips:
 *   - passwords are hashed with bcrypt before being stored, never in plaintext
 *   - a signed JWT (or session cookie) is issued on success, not a fake token
 *   - admin accounts are just Users with role=ADMIN, checked server-side
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../services/prisma");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

function issueToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(422).json({ error: "Name, email and a password of at least 8 characters are required." });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({ data: { name, email, phone, passwordHash, role: "CUSTOMER" } });
    const token = issueToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Compare against a stored hash even if user is null, to reduce timing-based user enumeration.
    const validHash = user ? user.passwordHash : "$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsalt";
    const ok = await bcrypt.compare(password || "", validHash);
    if (!user || !ok) return res.status(401).json({ error: "Invalid email or password." });

    const token = issueToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

async function logout(req, res) {
  // With stateless JWTs, logout is handled client-side by discarding the
  // token. If using refresh tokens or session cookies, revoke/clear them here.
  res.clearCookie(process.env.ADMIN_SESSION_COOKIE_NAME || "df_admin_session");
  res.json({ success: true });
}

module.exports = { register, login, logout };
