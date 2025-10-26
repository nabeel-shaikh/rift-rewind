const { getHomeData, addPerson } = require("../services/home.services");

async function getHome(req, res, next) {
    try {
        const data = await getHomeData();
        res.json(data);
    } catch (err) { next(err); }
}

async function postHome(req, res, next) {
    try {
        const { name } = req.body || {};
        const out = await addPerson(name);
        res.status(201).json(out);
    } catch (err) { next(err); }
}

module.exports = { getHome, postHome };
