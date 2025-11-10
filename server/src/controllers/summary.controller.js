const { fetchRiotStats } = require("../services/riot.service");
const { generateSummaries } = require("../services/bedrock.service");
const { buildStatsByCount } = require("../utils/statsByCount");

async function getSummary(req, res, next) {
  try {
    const { summonerName } = req.params;
    const {
      region = "na1",
      tagLine = "NA1",
      count,
    } = req.query;

    const parsedCount = count ? parseInt(count, 10) : undefined;
    const options = {};
    if (!Number.isNaN(parsedCount) && parsedCount) {
      options.count = Math.max(1, Math.min(parsedCount, 100));
    }

    const stats = await fetchRiotStats(region, summonerName, tagLine, options);
    const statsByCount = buildStatsByCount(stats?.matches || [], [5, 10, 15]);

    const summaries = await generateSummaries({
      summonerName,
      statsByCount,
    });

    res.json({
      summonerName,
      stats,
      summaries,
      summary: summaries["15"],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
