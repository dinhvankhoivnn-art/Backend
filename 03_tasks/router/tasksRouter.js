const { Router } = require("express");
const {
  getAllTasks,
  createTasks,
  getTasksForID,
  updatedTaskForID,
  deleteTaskForID,
} = require("../controller/Tasks.controller");
const tasksRouter = Router();
tasksRouter.get("/", getAllTasks);
tasksRouter.post("/", createTasks);
tasksRouter.get("/:id", getTasksForID);
tasksRouter.put("/:id", updatedTaskForID);
tasksRouter.delete("/:id", deleteTaskForID);
module.exports = tasksRouter;
