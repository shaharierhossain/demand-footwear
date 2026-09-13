/**
 * Auth middleware — verifies a JWT issued at login and attaches the
 * decoded user to req.user. Admin-only routes should chain
 * `requireAuth, requireRole("ADMIN")`.
 *
 * SECURITY NOTES:
 * - Tokens are verified against process.env.JWT_SECRET, never a value
 *   supplied by the client.
 * - Prefer HTTP-only, Secure, SameSite=strict cookies over storing the
 *   token in localStorage/sessionStorage in the browser, to reduce
 *   exposure to XSS-based token theft.
 * - Always fail closed: any verification error results in 401, never
 *   a silent pass-through.
 */
const jwt = require("jsonwebtoken");

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies && req.cookies[process.env.ADMIN_SESSION_COOKIE_NAME || "df_admin_session"]) {
    return req.cookies[process.env.ADMIN_SESSION_COOKIE_NAME || "df_admin_session"];
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
