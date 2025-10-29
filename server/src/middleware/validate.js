function validateSummoner(req, res, next) {
  const { summonerName } = req.params;
  
  // Riot IDs can include #tagLine (e.g., Faker#T1)
  if (!summonerName || !/^[A-Za-z0-9]+(#\w+)?$/.test(summonerName)) {
    return res.status(400).json({ error: "Invalid summoner name format" });
  }

  next();
}

module.exports = { validateSummoner };
