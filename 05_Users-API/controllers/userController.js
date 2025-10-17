const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const totalResult = await User.countDocuments();
    const users = await User.find().skip(startIndex).limit(limit);

    const pagination = {
      pageCurrent: page,
      limit: limit,
      totalResult: totalResult,
      prev: page > 1 ? page - 1 : null,
      next: page < Math.ceil(totalResult / limit) ? page + 1 : null,
    };

    res.status(200).json({ users, pagination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserForID = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatedForID = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteForID = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const searchQuery = req.query.q
      ? { name: new RegExp(req.query.q, "i") }
      : {};
    const totalResult = await User.countDocuments(searchQuery);
    const users = await User.find(searchQuery).skip(startIndex).limit(limit);

    const pagination = {
      pageCurrent: page,
      limit: limit,
      totalResult: totalResult,
      prev: page > 1 ? page - 1 : null,
      next: page < Math.ceil(totalResult / limit) ? page + 1 : null,
    };

    res.status(200).json({ users, pagination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUserNew = async (req, res) => {
  try {
    console.log("Received body:", req.body); // Debug log
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
