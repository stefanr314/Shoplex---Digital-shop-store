const express = require("express");

const router = express.Router();

const { body } = require("express-validator");

const isAuth = require("../middleware/is-auth");

const adminController = require("../controllers/adminController");

//admin/add-product => GET; sada se koristi i kontroler koji se odnosi samo na middleware
router.get("/add-product", isAuth, adminController.getAddProduct);

// //admin/add-product => POST
router.post(
  "/add-product",
  [
    body(
      "title",
      "Title can only be alphanumeric and has to be at least 3 characters long."
    )
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "Price can only be numeric").isNumeric(),
    body("description", "Description has to be at least 5 characters long.")
      .isLength({ min: 5 })
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/products", isAuth, adminController.getAdminProducts);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body(
      "title",
      "Title can only be alphanumeric and has to be at least 3 characters long."
    )
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "Price can only be numeric").isNumeric(),
    body("description", "Description has to be at least 5 characters long.")
      .isLength({ min: 5 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

router.get("/user-info", isAuth, adminController.getUserInfo);

module.exports = router;
