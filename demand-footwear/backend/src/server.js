/**
 * Demand Footwear — backend/src/server.js
 * Starts the HTTP server. Kept separate from app.js so app.js can be
 * imported directly by test suites without binding a port.
 */
const app = require("./app");

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Demand Footwear API listening on port ${PORT}`);
});
