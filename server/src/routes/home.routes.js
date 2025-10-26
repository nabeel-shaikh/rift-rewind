const { Router } = require("express");
const { getHome, postHome } = require("../controllers/home.controller");

const router = Router();
router.get("/home", getHome);
router.post("/home", postHome);

module.exports = router;
