const Product = require("../models/product");

const { validationResult } = require("express-validator");

const fileHelper = require("../helper/file");

exports.getAdminProducts = (req, res) => {
  Product.find({ userId: req.user._id })
    .then((products) =>
      res.render("admin/products", {
        products: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      })
    )
    .catch((err) => console.log(err));
};

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    edit: false,
    hasError: false,
    errorMsg: null,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  const errors = validationResult(req);

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      edit: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMsg:
        "Invalide type of file. Only jpg, png and jpeg files are supported.",
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      edit: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMsg: errors.array()[0].msg,
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.user, //automatski uzima id od user object a
  });

  product
    .save()
    .then((_) => {
      console.log("CREATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
  const editMode = Boolean(req.query.edit);

  if (!editMode) {
    return res.redirect("/");
  }

  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      if (!product) return res.redirect("/");

      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        edit: editMode,
        hasError: false,
        product: product,
        errorMsg: null,
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const productId = req.body.productId;
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        edit: true,
        hasError: true,
        product: {
          title: title,
          price: price,
          description: description,
          _id: productId,
        },
        errorMsg: errors.array()[0].msg,
      });
    }

    let imageUrl;
    if (image) {
      imageUrl = image.path;
    }

    const update = {
      title: title,
      price: price,
      imageUrl: imageUrl,
      description: description,
    };

    const result = await Product.updateOne(
      { _id: productId, userId: req.user._id },
      update
    );

    if (result.matchedCount === 0) return res.redirect("/"); //sprecavanje editovanja od strane korisnika ciji nije proizvod

    console.log("UPDATE SUCCESSFULL!");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const productId = req.body.productId;
    const product = await Product.findById(productId);

    if (!product) return next();

    fileHelper.deleteFile(product.imageUrl); //forget and continue

    const result = await Product.deleteOne({
      _id: productId,
      userId: req.user._id,
    });
    if (result.deletedCount !== 0) console.log("DELETE SUCCESSFULL!");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

exports.getUserInfo = (req, res, next) => {
  const { name, lastName, email } = req.user;
  // console.log(user);

  res.render("admin/user-info", {
    pageTitle: "User Info",
    path: "/admin/user-info",
    name: name,
    lastName: lastName,
    email: email,
  });
};
