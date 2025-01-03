import { Schema, model } from "mongoose";

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      ref: "User",
      required: true,
      index: true, // For faster lookups
    },
    cartItem: [
      {
        productId: {
          type: Schema.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, "Quantity must be at least 1"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        totalProductDiscount: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
    totalPriceAfterDiscount: {
      type: Number,
      default: 0,
      min: [0, "Total price after discount cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save hook to calculate totalPrice and totalPriceAfterDiscount
cartSchema.pre("save", function (next) {
  this.totalPrice = this.cartItem.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.totalPriceAfterDiscount = this.totalPrice - this.discount;
  next();
});

export const cartModel = model("Cart", cartSchema);
