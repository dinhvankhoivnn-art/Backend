// ! lấy tất cả bootcamp
const getAllBootcamps = (req, res) => {
  res.status(200).json({ success: true, msg: "Show all bootcamps" });
};
// ! tạo bootcamp
const createBootcamp = (req, res) => {
  res.status(200).json({ success: true, msg: "Create new bootcamp" });
};
// ! cập nhật bootcamp
const updateBootcamp = (req, res) => {
  res
    .status(200)
    .json({ success: true, msg: `Update bootcamp with id ${req.params.id}` });
};
// ! lấy bootcamp theo id

const getBootcampForID = (req, res) => {
  res
    .status(200)
    .json({ success: true, msg: `Show bootcamp with id ${req.params.id}` });
};
// ! xóa bootcamp
const deleteBootcamp = (req, res) => {
  res
    .status(200)
    .json({ success: true, msg: `Delete bootcamp with id ${req.params.id}` });
};

module.exports = {
  getAllBootcamps,
  createBootcamp,
  updateBootcamp,
  getBootcampForID,
  deleteBootcamp,
};
