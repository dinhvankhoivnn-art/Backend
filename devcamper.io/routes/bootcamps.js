const {
  getAllBootcamps,
  createBootcamp,
  getBootcampForID,
  updateBootcamp,
  deleteBootcamp,
} = require("../controllers/bootcamps");

const router = require("express").Router();
// ! lấy tất cả bootcamp - thêm bootcamp
router.route("/").get(getAllBootcamps).post(createBootcamp);

router
  .route("/:id")
  .get(getBootcampForID)
  .get(updateBootcamp)
  .delete(deleteBootcamp);

module.exports = router;
