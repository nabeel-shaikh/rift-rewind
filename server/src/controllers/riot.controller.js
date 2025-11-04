// server/src/controllers/riot.controller.js
const { fetchRiotStats } = require("../services/riot.service");

async function getRiotData(req, res, next) {
  try {
    const { region, summonerName } = req.params;
    console.log("Requesting data for:", summonerName, "in", region);

    const stats = await fetchRiotStats(region, summonerName);
    res.json({ summonerName, region, stats }); // ✅ just return Riot data
  } catch (err) {
    console.error("Error in getRiotData:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch Riot data" });
  }
}

module.exports = { getRiotData };
