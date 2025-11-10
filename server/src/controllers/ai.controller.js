"use strict";

const { suggestChampions } = require("../services/bedrock.service");

async function postChampionSuggestions(req, res, next) {
  try {
    const { topChamps = [], matches = [] } = req.body || {};
    const suggestions = await suggestChampions({ topChamps, matches });
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

module.exports = { postChampionSuggestions };

