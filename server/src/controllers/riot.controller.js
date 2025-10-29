

const { fetchRiotStats } = require("../services/riot.service");
const { generateSummary } = require("../services/bedrock.service");

async function getSummary(req, res, next) {
  try {
    const { summonerName } = req.params;
    const { region = "na1" } = req.query; // default to NA1

    const stats = await fetchRiotStats(region, summonerName);
    const summary = await generateSummary({ summonerName, stats });

    res.json({ summonerName, stats, summary });
  } catch (err) {
    console.error("Error in getSummary:", err);
    res.status(500).json({ error: "fetch failed" });
  }
}

module.exports = { getSummary };