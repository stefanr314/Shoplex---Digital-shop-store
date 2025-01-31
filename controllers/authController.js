require("dotenv").config();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/user");

const { validationResult } = require("express-validator");

const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

exports.getLogin = (req, res, next) => {
  let message = res.locals.errorMsg;
  if (message.length > 0) message = message[0];
  else message = null;

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login - Shoplex",
    errorMsg: message,
    oldInput: {
      email: "",
      password: "",
    },
  });
};

exports.getSignUp = (req, res, next) => {
  let message = res.locals.errorMsg;
  if (message.length > 0) message = message[0];
  else message = null;
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Sign Up - Shoplex",
    errorMsg: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      lastName: "",
    },
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    const { email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login - Shoplex",
        errorMsg: errors.array()[0].msg,
        oldInput: { email: email, password: password },
      });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      req.flash("error_msg", "Invalid email or password");

      // console.log(req.flash("error_msg"));
      return res.redirect("/login");
    }

    const pwdMatch = await bcrypt.compare(password, user.password);

    if (pwdMatch) {
      req.session.isLoggedIn = true;
      req.session.user = user;

      return req.session.save((err) => {
        console.log(err);
        req.flash("success_msg", "Successfully logged in!");
        res.redirect("/");

        transporter
          .sendMail({
            from: '"Shoplex" shop.lex.store.online@gmail.com',
            to: email,
            subject: "Login confirmed",
            text: "You successfully logged in for online store Shoplex.  Shoplex - don't buy it tomorrow, buy it now. ",
            html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <h1 style="color: #4CAF50;">Welcome to Our Shoplex Service</h1>
      <p>Hello from Shoplex,</p>
      <p>You successfully logged in for online store Shoplex.</p>
      <hr style="border: 1px solid #4CAF50;">
      <p style="font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
      <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
        <p style="font-size: 12px; color: #999;">&copy; 2024 Shoplex. All rights reserved.</p>
        <p style="font-size: 12px; color: #999;">Shoplex - don't buy it tomorrow, buy it now.</p>
        <p style="font-size: 12px; color: #999;">Company Address: 7100 Mustrala 2114, Sarajevo, BiH</p>
      </footer>
    </div>`,
            headers: {
              "X-Custom-Header": "This is a custom header value",
            },
          })
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      });
    }

    //sifre se ne mečuju
    req.flash("error_msg", "Invalid email or password");
    // console.log(req.flash("error_msg"));
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

exports.postSignUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    const email = req.body.email;
    const name = req.body.name;
    const lastName = req.body.lastName;
    const password = req.body.pwd;

    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).render("auth/signup", {
        path: "/signup",
        pageTitle: "Sign Up - Shoplex",
        errorMsg: errors.array()[0].msg,
        oldInput: {
          email: email,
          password: password,
          confirmPassword: req.body.cPwd,
          name: name,
          lastName: lastName,
        },
      });
    }

    const user = new User({
      name: name,
      lastName: lastName,
      email: email,
      password: await bcrypt.hash(password, 12),
      cart: { items: [] },
    });

    await user.save();
    console.log("User successfully added");
    req.flash("success_msg", "You have successfully created an account!");
    res.redirect("/login");
    try {
      await transporter.sendMail({
        from: '"Shoplex" shop.lex.store.online@gmail.com',
        to: email,
        subject: "Signup confirmed",
        text: "You successfully signed up for online store Shoplex.  Shoplex - don't buy it tomorrow, buy it now. ",
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <h1 style="color: #4CAF50;">Welcome to Our Shoplex</h1>
      <p>Hello from Shoplex,</p>
      <p>You successfully logged in for online store Shoplex.</p>
      <hr style="border: 1px solid #4CAF50;">
      <p style="font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
      <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
        <p style="font-size: 12px; color: #999;">&copy; 2024 Shoplex. All rights reserved.</p>
        <p style="font-size: 12px; color: #999;">Shoplex - don't buy it tomorrow, buy it now.</p>
        <p style="font-size: 12px; color: #999;">Company Address: 7100 Mustrala 2114, Sarajevo, BiH</p>
      </footer>
    </div>`,
        headers: {
          "X-Custom-Header": "This is a custom header value",
        },
      });
    } catch (errMail) {
      console.log("Mail not send due to: ", errMail);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getForget = (req, res, next) => {
  let message = res.locals.errorMsg;
  if (message.length > 0) message = message[0];
  else message = null;

  res.render("auth/reset", {
    pageTitle: "Reset Your Password",
    path: "/forget",
    errorMsg: message,
  });
};

exports.postForget = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email);
    const token = crypto.randomBytes(32).toString("hex");
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error_msg", "No account associated with that email!");
      return res.redirect("/reset");
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    console.log(user);
    await user.save();

    const resetLink = `http://localhost:3000/reset/${token}`;
    res.redirect("/");
    try {
      await transporter.sendMail({
        from: '"Shoplex" shop.lex.store.online@gmail.com',
        to: email,
        subject: "Reset password",
        text: "You successfully signed up for online store Shoplex.  Shoplex - don't buy it tomorrow, buy it now. ",
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <h1 style="color: #4CAF50;">Welcome to Our Shoplex Service</h1>
        <p>Hello from Shoplex,</p>
        <p>Visit this <a href="${resetLink}">link</a> in order to reset your password.</p>
        <hr style="border: 1px solid #4CAF50;">
        <p style="font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
        <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
          <p style="font-size: 12px; color: #999;">&copy; 2024 Shoplex. All rights reserved.</p>
          <p style="font-size: 12px; color: #999;">Shoplex - don't buy it tomorrow, buy it now.</p>
          <p style="font-size: 12px; color: #999;">Company Address: 7100 Mustrala 2114, Sarajevo, BiH</p>
        </footer>
      </div>`,
        headers: {
          "X-Custom-Header": "This is a custom header value",
        },
      });
    } catch (err) {
      console.log("Email not send due to:", err);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getNewPwd = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    console.log("User: ", user);
    if (!user) {
      console.log("Invalid or expired token");
      req.flash("error_msg", "Invalid or expired token");

      return res.redirect("/login");
    }

    let message = res.locals.errorMsg;
    if (message.length > 0) message = message[0];
    else message = null;

    res.render("auth/new-password", {
      pageTitle: "Reset Your Password",
      path: "/new-password",
      errorMsg: message,
      userId: user._id.toString(),
      token: token,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postNewPwd = async (req, res, next) => {
  const { password, userId, token } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/new-password", {
      pageTitle: "Reset Your Password",
      path: "/new-password",
      errorMsg: errors.array()[0].msg,
      userId: userId.toString(),
      token: token,
    });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    });

    if (!user) {
      console.log("Invalid or expired token");
      req.flash("error_msg", "Invalid or expired token");

      return res.redirect("/signup");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.redirect("/login");

    try {
      await transporter.sendMail({
        from: '"Shoplex" shop.lex.store.online@gmail.com',
        to: user.email,
        subject: "Completed password reset",
        text: "You successfully completed password reset for online store Shoplex.  Shoplex - don't buy it tomorrow, buy it now. ",
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <h1 style="color: #4CAF50;">Welcome to Our Shoplex Service</h1>
        <p>Hello from Shoplex,</p>
        <p>You successfully completed password reset for online store Shoplex. Thank you for using Our App.</p>
        <hr style="border: 1px solid #4CAF50;">
        <p style="font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
        <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
          <p style="font-size: 12px; color: #999;">&copy; 2024 Shoplex. All rights reserved.</p>
          <p style="font-size: 12px; color: #999;">Shoplex - don't buy it tomorrow, buy it now.</p>
          <p style="font-size: 12px; color: #999;">Company Address: 7100 Mustrala 2114, Sarajevo, BiH</p>
        </footer>
      </div>`,
        headers: {
          "X-Custom-Header": "This is a custom header value",
        },
      });
    } catch (err) {
      console.log("Email not send due to:", err);
    }
  } catch (error) {
    console.log(error);
  }
};
