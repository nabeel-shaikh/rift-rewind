// server/src/controllers/summary.controller.js
const { fetchRiotStats } = require("../services/riot.service");
const { generateSummary } = require("../services/bedrock.service");

async function getSummary(req, res, next) {
  try {
    const { summonerName } = req.params;
    const { region = "na1", tag = "NA1", rankedOnly = "false" } = req.query;

    const stats = await fetchRiotStats(region, summonerName, tag, {
      rankedOnly: rankedOnly === "true",
      count: 10,
    });

    const summary = await generateSummary({ summonerName: `${summonerName}#${tag}`, stats });
    res.json({ stats, summary });
  } catch (err) {
    next(err);
  }
}
module.exports = { getSummary };
