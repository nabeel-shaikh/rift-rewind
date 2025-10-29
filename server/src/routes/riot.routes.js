const { Router } = require("express");
const { getSummary } = require("../controllers/riot.controller");
const { validateSummoner } = require("../middleware/validate");

const router = Router();
router.get("/:summonerName", validateSummoner, getSummary); // /api/riot/:summonerName
module.exports = router;

