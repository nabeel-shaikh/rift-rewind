const { fetchRiotStats } = require("../services/riot.service");
const { generateSummary } = require("../services/bedrock.service");

async function getSummary(req, res, next) {
  try {
    const { summonerName } = req.params;
    const { region = "na1" } = req.query; // default to NA1
    console.log(summonerName,region);
    const stats = await fetchRiotStats(region, summonerName);
    console.log(stats);
    const summary = await generateSummary({ summonerName, stats });
    res.json({ summonerName, stats, summary });
  } catch (err) { next(err); }
}
module.exports = { getSummary };
