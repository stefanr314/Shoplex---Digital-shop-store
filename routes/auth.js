const express = require("express");
const { check, body } = require("express-validator");

const User = require("../models/user");

const router = express.Router();

const authController = require("../controllers/authController");

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Enter the valid email")
      .custom(async (value, { req }) => {
        try {
          const loggedUser = await User.findOne({ email: value });
          if (!loggedUser) {
            return Promise.reject(
              "This email does not exist. Do you want to sign up?"
            );
          }
          return true;
        } catch (error) {
          console.log(error);
        }
      })
      .normalizeEmail(),
    body(
      "password",
      "Password must be at least 8 characters long and only alphanumeric."
    )
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post("/logout", authController.postLogout);

router.get("/signUp", authController.getSignUp);

router.post(
  "/signUp",
  [
    check("email")
      .isEmail()
      .withMessage("Enter a valid email address")
      .custom(async (value, { req }) => {
        try {
          const existingUser = await User.findOne({ email: value });
          if (existingUser) {
            return Promise.reject(
              "Email already existing. Please choose another one."
            );
          }

          return true;
        } catch (error) {
          console.log("L1 ", error);
        }
      })
      .normalizeEmail(),
    body(
      "pwd",
      "Password must be at least 8 characters long and alphanumeric only."
    )
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),
    body("name").notEmpty().withMessage("Name can not be empty").trim(),
    body("lastName")
      .notEmpty()
      .withMessage("Last name can not be empty")
      .trim(),
    body("cPwd")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.pwd) {
          throw new Error("Passwords have to match");
        }
        return true;
      }),
  ],
  authController.postSignUp
);

router.get("/reset", authController.getForget);

router.post("/reset", authController.postForget);

router.get("/reset/:token", authController.getNewPwd);

router.post(
  "/new-password",
  [
    body(
      "password",
      "Password must be at least 8 characters long and only alphanumeric."
    )
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postNewPwd
);

module.exports = router;
