if (typeof window !== "undefined") {
  const bootstrap = require("bootstrap");
}
require("dotenv").config();

const express = require("express");
const path = require("path");

const port = 3000;
const hostname = "localhost";

const app = express();

const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },

  filename: function (req, file, cb) {
    const uniquePreffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniquePreffix + "-" + file.originalname);
  },
});

const fileFilter = function (req, file, cb) {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const csrfProtection = csrf();
const mongoose = require("mongoose");
const User = require("./models/user");

const adminRoutes = require("./routes/admin");
const shopRouter = require("./routes/shop");
const authRouter = require("./routes/auth");

const errorController = require("./controllers/error");

app.set("view engine", "ejs");
app.set("views", "views"); //ne moras ovo jer je difoltno svakako, ali da ti se templates zove mjesto views morao bi ovako

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("file")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "mySuperSecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store: store,
  })
);

app.use(flash());
app.use(cookieParser());
app.use(csrfProtection);

app.use(async (req, res, next) => {
  if (!req.session.user) return next();

  try {
    const user = await User.findById(req.session.user._id);
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
  }
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.errorMsg = req.flash("error_msg");

  //na ovaj nacin se setuju lokalne varijable koje se proslijedjuju views folderima
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes); //filter /admin primijenjen, sve lokacije sa adminRouter pocinju sa /admin
app.use(shopRouter);
app.use(authRouter);

app.use(errorController.get404);

mongoose
  .connect(process.env.MONGODB_URI)
  .then((_) => {
    app.listen(port, hostname, () => {
      console.log("Uspjesna konekcija");
      console.log(`Server running at this site http://${hostname}:${port}/`);
    });
  })
  .catch((err) => console.log("Konekcija neuspjesna:", err));

// mongoose
//   .connect("mongodb://3.73.112.35:27017/shop", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 5000, // Produženo vrijeme za konekciju
//     socketTimeoutMS: 45000, // Vrijeme za timeout na socketu
//     reconnectTries: Number.MAX_VALUE, // Neograničen broj pokušaja za reconnect
//     reconnectInterval: 5000, // Vremenski interval za reconnect
//   })
//   .then(() => {
//     console.log("Connected to the database!");
//   })
//   .catch((error) => {
//     console.error("Error connecting to the database:", error.message);
//   });
