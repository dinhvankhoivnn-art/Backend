const { Router } = require("express");
const { getLucky } = require("../controllers/lucky.controller");

const luckyNumberRouter = Router();

luckyNumberRouter.get("/", getLucky);
module.exports = {
  luckyNumberRouter,
};
