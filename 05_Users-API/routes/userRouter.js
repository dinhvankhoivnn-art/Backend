const express = require("express");
const {
  getAllUsers,
  getUserForID,
  updatedForID,
  deleteForID,
  searchUser,
  createUserNew,
} = require("../controllers/userController");
const { body, param, query } = require("express-validator");

const userRouter = express.Router();

// Validate and route for getAllUsers
userRouter.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be a positive integer"),
  ],
  getAllUsers
);

// Validate and route for getUserForID
userRouter.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID format")],
  getUserForID
);

// Validate and route for updatedForID
userRouter.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid user ID format"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("age")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Age must be a non-negative integer"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role").optional().isArray().withMessage("Role must be an array"),
    body("location.lat")
      .optional()
      .isFloat()
      .withMessage("Latitude must be a number"),
    body("location.long")
      .optional()
      .isFloat()
      .withMessage("Longitude must be a number"),
    body("locations.city")
      .optional()
      .isString()
      .withMessage("City must be a string"),
    body("salary.amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Salary amount must be a non-negative number"),
    body("salary.currency")
      .optional()
      .isString()
      .withMessage("Currency must be a string"),
  ],
  updatedForID
);

// Validate and route for deleteForID
userRouter.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID format")],
  deleteForID
);

// Validate and route for searchUser
userRouter.get(
  "/search",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be a positive integer"),
    query("q")
      .optional()
      .isString()
      .withMessage("Search query must be a string"),
  ],
  searchUser
);

// Validate and route for createUserNew
userRouter.post(
  "/",
  [
    body("name")
      .notEmpty()
      .isString()
      .withMessage("Name is required and must be a string"),
    body("age")
      .notEmpty()
      .isInt({ min: 0 })
      .withMessage("Age is required and must be a non-negative integer"),
    body("email")
      .notEmpty()
      .isEmail()
      .withMessage("Email is required and must be a valid email"),
    body("password")
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage("Password is required and must be at least 6 characters"),
    body("role")
      .notEmpty()
      .isArray()
      .withMessage("Role is required and must be an array"),
    body("location.lat")
      .notEmpty()
      .isFloat()
      .withMessage("Latitude is required and must be a number"),
    body("location.long")
      .notEmpty()
      .isFloat()
      .withMessage("Longitude is required and must be a number"),
    body("locations.city")
      .notEmpty()
      .isString()
      .withMessage("City is required and must be a string"),
    body("salary.amount")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage(
        "Salary amount is required and must be a non-negative number"
      ),
    body("salary.currency")
      .notEmpty()
      .isString()
      .withMessage("Currency is required and must be a string"),
  ],
  createUserNew
);

module.exports = userRouter;
