// server/src/controllers/riot.controller.js
const { fetchRiotStats, fetchProfile, fetchRecentMatches, fetchMastery, fetchDerivedRankedStats } = require("../services/riot.service");
const { generateSummary } = require("../services/bedrock.service");

// GET /api/riot/:summonerName
async function getSummary(req, res) {
  try {
    const { summonerName } = req.params;
    const { region = "na1", tagLine = "NA1" } = req.query;

    console.log("Requesting data for:", summonerName, "in", region);

    const stats = await fetchRiotStats(region, summonerName, tagLine);
    const summary = await generateSummary({ summonerName, stats });
    res.json({ summonerName, region, tagLine, stats, summary }); // ✅ just return Riot data

  } catch (err) {
    console.error("Error in getRiotData:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch Riot data" });
  }
}

// GET /api/riot/:summonerName/profile
async function getProfile(req, res) {
  try {
    const { summonerName } = req.params;
    const { region = "na1", tagLine = "NA1" } = req.query;
    const profile = await fetchProfile(region, summonerName, tagLine);
    res.json(profile);

  } catch (err) {
    console.error("Error in getProfile:", err);
    res.status(500).json({ error: "profile fetch failed" });
  }
}


// GET /api/riot/:summonerName/matches
async function getRecentMatches(req, res) {
  try {
    const { summonerName } = req.params;
    const { region = "na1", tagLine = "NA1", count = 10, rankedOnly = "false" } = req.query;
    const recentMatches = await fetchRecentMatches(region, summonerName, tagLine, { count: Number(count), rankedOnly: rankedOnly === "true" });
    res.json(recentMatches);

  } catch (err) {
    console.error("Error in getRecentMatches:", err);
    res.status(500).json({ error: "recent matches fetch failed" });
  }
}

// GET /api/riot/:summonerName/derived
// computed ranked-like stats from match-v5 only
async function getDerivedRankedStats(req, res) {
  try {
    const { summonerName } = req.params;
    const { region = "na1", tagLine = "NA1", rankedCount = 20 } = req.query;

    const derived = await fetchDerivedRankedStats(
      region,
      summonerName,
      tagLine,
      Number(rankedCount)
    );

    res.json(derived);
  } catch (err) {
    console.error("Error in getDerivedRankedStats:", err);
    res.status(500).json({ error: "derived ranked fetch failed" });
  }
}

// GET /api/riot/:summonerName/mastery
async function getChampionMastery(req, res) {
  try {
    const { summonerName } = req.params;
    const { region = "na1", tagLine = "NA1", top = 10 } = req.query;
    console.log(region, summonerName, tagLine, Number(top))
    const mastery = await fetchMastery(region, summonerName, tagLine, Number(top));
    res.json(mastery);

  } catch (err) {
    console.error("Error in getChampionMastery:", err);
    res.status(500).json({ error: "champion mastery fetch failed" });
  }
}

// GET /api/riot/compareStats?region=na1&a=Foo&atag=NA1&b=Bar&btag=NA1
async function compareSummoners(req, res) {
  try {
    const {
      region = "na1",
      a,
      atag = "NA1",
      b,
      btag = "NA1",
      count = 8
    } = req.query;

    if (!a || !b) {
      return res.status(400).json({ error: "query params 'a' and 'b' are required" });
    }

    const [aStats, bStats] = await Promise.all([
      fetchRiotStats(region, a, atag, { count: Number(count) }),
      fetchRiotStats(region, b, btag, { count: Number(count) })
    ]);

    // tiny compare object you can display on frontend
    const comparison = {
      region,
      players: [
        { name: aStats.summoner.name, tagLine: aStats.summoner.tagLine, ...aStats },
        { name: bStats.summoner.name, tagLine: bStats.summoner.tagLine, ...bStats },
      ],
      winnerByWinRate:
        Number(aStats.winRate) === Number(bStats.winRate)
          ? "tie"
          : Number(aStats.winRate) > Number(bStats.winRate)
            ? aStats.summoner.name
            : bStats.summoner.name
    };

    res.json(comparison);
  } catch (err) {
    console.error("Error in compareSummoners:", err);
    res.status(500).json({ error: "comparisons fetch failed" });
  }
}



module.exports = { getSummary, getProfile, getRecentMatches, getChampionMastery, getDerivedRankedStats, compareSummoners };
