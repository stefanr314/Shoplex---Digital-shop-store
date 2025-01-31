const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
      items: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: { type: Number, required: true },
        },
      ],
    },
  },
  {
    methods: {
      addToCart(product, quantity = 1) {
        const cartItemIndex = this.cart.items.findIndex(
          (cartItem) => cartItem.productId.toString() === product._id.toString()
        );
        //let newQuantity = 1;
        const updateCartItems = [...this.cart.items];

        if (cartItemIndex !== -1) {
          updateCartItems[cartItemIndex].quantity += quantity;
        } else {
          updateCartItems.push({
            productId: product._id,
            quantity: quantity,
          });
        }

        const updateCart = { items: updateCartItems };
        return this.updateOne({ cart: updateCart });
      },

      deleteFromCart(productId) {
        const deleteCartItems = this.cart.items.filter(
          (cartItem) => cartItem.productId.toString() !== productId
        );

        return this.updateOne({ cart: { items: deleteCartItems } });
      },

      clearCart() {
        const updateCart = { items: [] };
        return this.updateOne({ cart: updateCart });
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
