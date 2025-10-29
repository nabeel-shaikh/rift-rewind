// server/src/middleware/error.js
function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status( Number(err.status) || 500 ).json({ error: err.message || "Server error" });
}
module.exports = { errorHandler };