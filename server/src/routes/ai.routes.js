"use strict";

const { Router } = require("express");
const { postChampionSuggestions } = require("../controllers/ai.controller");

const router = Router();

router.post("/suggestChampions", postChampionSuggestions);

module.exports = router;

