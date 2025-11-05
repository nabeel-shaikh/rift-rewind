// server/src/routes/riot.routes.js
const { Router } = require("express");
const { getSummary, getProfile, getRecentMatches, getChampionMastery, getDerivedRankedStats, compareSummoners} = require("../controllers/riot.controller");
const { validateSummoner } = require("../middleware/validate");

const router = Router();
router.get("/compareStats", compareSummoners);
router.get("/:summonerName", validateSummoner, getSummary); // /api/riot/:summonerName
router.get("/:summonerName/profile", validateSummoner, getProfile);
router.get("/:summonerName/matches", validateSummoner, getRecentMatches);
router.get("/:summonerName/mastery", validateSummoner, getChampionMastery);
router.get("/:summonerName/derived", validateSummoner, getDerivedRankedStats); 

module.exports = router;
