function validateSummoner(req, res, next) {
  const { summonerName } = req.params;

  // basic validation
  if (!summonerName || summonerName.trim() === "") {
    return res.status(400).json({ error: "Summoner name is required" });
  }

  // ensure no invalid characters (optional)
  const isValid = /^[\w\s'.-]+$/.test(summonerName);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid summoner name format" });
  }

  next(); // pass control to controller
}

module.exports = { validateSummoner };
