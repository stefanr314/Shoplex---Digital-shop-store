const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51QHx9cGHSztBD1j34Rcvcv0ZCHUPQY6CglCYjVkd3CtIZikc4wIXCpBsG0SRKce58tUzBXKRrPmEbV0WVytRGXsz00lcnlZfD3"
);

const Product = require("../models/product");
const Order = require("../models/order");

const PDFDocument = require("pdfkit");

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  let totalItems = 0;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({})
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        products: products,
        pageTitle: "All Products",
        path: "/product-list",
        isAuth: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      res.render("shop/product-detail.ejs", {
        product: product,
        pageTitle: "Product Detail",
        path: "/products/" + productId,
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res) => {
  let message = res.locals.success_msg;
  if (message.length > 0) message = message[0];
  else message = null;

  Product.find({})
    .then((products) => {
      res.render("shop/index", {
        products: products,
        pageTitle: "Index Page",
        path: "/",
        hasProduct: products.length > 0,
        successMsg: message,
        isAuth: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

exports.getSearch = async (req, res, next) => {
  try {
    const { query } = req.query;
    const products = await Product.find({
      title: { $regex: query, $options: "i" }, // Pretraga po nazivu (case-insensitive)
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

exports.getCart = (req, res) => {
  req.user
    .populate("cart.items.productId")
    .then((populatedUser) => {
      const cartItems = populatedUser.cart.items;

      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        cartItems: cartItems,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postCart = async (req, res, next) => {
  const productId = req.body.productId;
  const quantity = Number(req.body.quantity);

  try {
    const product = await Product.findById(productId);
    await req.user.addToCart(product, quantity);

    console.log("ADDED TO CART!");
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
  }
};

exports.postCartDeleteItem = async (req, res, next) => {
  const productId = req.body.productId;
  console.log(productId);
  try {
    await req.user.deleteFromCart(productId);

    console.log("PRODUCT DELETED!");
    res.redirect("/cart");
  } catch (err) {
    console.log(err);
  }
};

exports.getCheckout = (req, res, next) => {
  let totalSum = 0;
  let cartItems;
  req.user
    .populate("cart.items.productId")
    .then((populatedUser) => {
      cartItems = populatedUser.cart.items;
      totalSum = 0;
      cartItems.forEach((item) => {
        totalSum += item.quantity * item.productId.price;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"], // Tipove plaćanja
        line_items: cartItems.map((i) => {
          return {
            price_data: {
              currency: "usd", // ili bilo koja druga valuta
              product_data: {
                name: i.productId.title,
                description: i.productId.description,
              },
              unit_amount: Math.round(i.productId.price * 100), //u centima
            },
            quantity: i.quantity,
          };
        }),
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`, // URL na koji ide korisnik nakon uspešne transakcije
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`, // URL ako korisnik otkaže
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        pageTitle: "Your Checkout",
        path: "/checkout",
        items: cartItems,
        totalSum: totalSum,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    const order = new Order({
      items: req.user.cart.items,
      userId: req.user,
    });

    await order.save();
    await req.user.clearCart();

    res.redirect("/orders");
  } catch (error) {
    console.log(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const order = new Order({
      items: req.user.cart.items,
      userId: req.user,
    });

    await order.save();
    await req.user.clearCart();

    res.redirect("/orders");
  } catch (error) {
    console.log(error);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userOrders = await Order.find(
      { userId: req.user?._id },
      "items"
    ).populate("items.productId");

    res.render("shop/orders", {
      pageTitle: "Your Orders",
      path: "/orders",
      orders: userOrders,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    //autorizacija
    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) {
      return next();
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return next();
    }
    //

    const invoiceName = "invoice-" + orderId + ".pdf";
    const invoicePath = path.join("data", "invoices", invoiceName);

    const pdfDocument = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="' + invoiceName + '"'
    );

    pdfDocument.pipe(fs.createWriteStream(invoicePath)); // pdf stored locally
    pdfDocument.pipe(res); // return it to the client

    // Zaglavlje
    pdfDocument.fontSize(20).text("Invoice", { align: "center" }).moveDown();

    // Crta za razdvajanje
    pdfDocument
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, 150)
      .lineTo(550, 150)
      .stroke();

    // Naslovi kolona
    pdfDocument
      .fontSize(10)
      .text("Title", 50, 160, { width: 100, continued: true })
      .text("Description", 150, 160, { width: 100, continued: true })
      .text("Price", 250, 160, { width: 50, align: "left", continued: true })
      .text("Quantity", 330, 149, {
        width: 70,
        align: "right",
        continued: true,
      })
      .text("Total", 450, 160, { width: 150, align: "right" })
      .moveDown();

    // Crta za razdvajanje
    pdfDocument
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, 175)
      .lineTo(550, 175)
      .stroke();

    // Sadržaj stavki
    let totalPrice = 0;
    let y = 185;

    order.items.forEach((item) => {
      const itemTotal = item.quantity * item.productId.price;
      totalPrice += itemTotal;

      const descriptionHeight = pdfDocument.heightOfString(
        item.productId.description,
        { width: 150 }
      );

      pdfDocument
        .fontSize(10)
        .text(item.productId.title, 50, y, { width: 100 })
        .text(item.productId.description, 150, y, {
          width: 150,
          height: descriptionHeight,
          align: "justify",
        })
        .text(`$${item.productId.price.toFixed(2)}`, 300, y, {
          width: 65,
          align: "right",
        })
        .text(item.quantity, 350, y, { width: 70, align: "right" })
        .text(`$${itemTotal.toFixed(2)}`, 420, y, {
          width: 130,
          align: "right",
        });

      y += descriptionHeight + 15;

      // Provjerite treba li dodati novu stranicu
      if (y > 700) {
        pdfDocument.addPage();
        y = 50; // Postavite novu početnu Y koordinate
      }
    });

    // Crta za razdvajanje
    pdfDocument
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y + 10)
      .lineTo(550, y + 10)
      .stroke();

    // Ukupna cijena
    pdfDocument
      .fontSize(12)
      .text("Total Price:", 400, y + 20, { width: 150, align: "left" })
      .text(`$${totalPrice.toFixed(2)}`, 460, y + 20, {
        width: 90,
        align: "right",
      });

    pdfDocument.end();

    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) return next(err);

    //   res.setHeader("Content-Type", "application/pdf");
    //   res.setHeader(
    //     "Content-Disposition",
    //     'inline; filename="' + invoiceName + '"'
    //   );
    //   res.send(data);
    // });
    // const file = fs.createReadStream(invoicePath);

    // file.pipe(res);
  } catch (error) {
    console.log(error);
  }
};
