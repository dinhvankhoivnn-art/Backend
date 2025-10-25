const router = require("express").Router();
// ! get all bootcamps
router.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: `get all bootcamps successfully`,
  });
});
// ! create bootcamp
router.post("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: `create bootcamp successfully`,
  });
});
// ! get bootcamp for ID
router.get("/:id", (req, res) => {
  res.status(200).json({
    status: true,
    message: `get bootcamp with id ${req.params.id} successfully`,
  });
});

// ! update bootcamp for ID
router.put("/:id", (req, res) => {
  res.status(200).json({
    status: true,
    message: `update bootcamp with id ${req.params.id} successfully`,
  });
});

// ! delete bootcamp for ID
router.delete("/:id", (req, res) => {
  res.status(200).json({
    status: true,
    message: `delete bootcamp with id ${req.params.id} successfully`,
  });
});
module.exports = router;
