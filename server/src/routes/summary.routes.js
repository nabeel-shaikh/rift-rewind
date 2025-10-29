const { Router } = require("express");
const { getSummary } = require("../controllers/summary.controller");
const { validateSummoner } = require("../middleware/validate");

const router = Router();
router.get("/:summonerName", validateSummoner, getSummary); // /api/summary/:summonerName
module.exports = router;
