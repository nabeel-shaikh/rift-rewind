// server/src/routes/riot.routes.js
const { Router } = require("express");
const { getRiotData } = require("../controllers/riot.controller");

const router = Router();
router.get("/:region/:summonerName", getRiotData);

module.exports = router;
