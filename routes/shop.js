const express = require("express");

const router = express.Router();
const shopController = require("../controllers/shopController");
const isAuth = require("../middleware/is-auth");

router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);

// //npr da si imao neki rutu /products/delete morao bi je staviti iznad ove rute jer bi je products/:productId pokupio prvi
// // tako da specificnije rute se prvo pisu pa onda ove manje specificne

router.get("/products/:productId", shopController.getProduct); // ova : oznacava da se radi o dinamickoj putanji i moze imati bilo koju vrijednost

router.get("/search", shopController.getSearch);

router.get("/cart", isAuth, shopController.getCart);

router.post("/cart", isAuth, shopController.postCart);

router.post("/delete-cart-item", isAuth, shopController.postCartDeleteItem);

router.get("/checkout", isAuth, shopController.getCheckout);

router.get("/checkout/success", isAuth, shopController.getCheckoutSuccess);

router.get("/checkout/cancel", isAuth, shopController.getCheckout);

router.post("/create-order", isAuth, shopController.postOrder);

router.get("/orders", isAuth, shopController.getOrders);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
