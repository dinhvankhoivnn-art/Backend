const express = require("express");
const {
  getAllStore,
  getStoreForID,
  createStore,
  updateForID,
  deleteStoreForID,
  findDataForQuery,
} = require("../controller/storeController");
const storeRouter = express.Router();

storeRouter.get("/", getAllStore);
storeRouter.get("/search", findDataForQuery);
storeRouter.post("/", createStore);
storeRouter.get("/:id", getStoreForID);
storeRouter.put("/:id", updateForID);
storeRouter.delete("/:id", deleteStoreForID);

module.exports = storeRouter;
