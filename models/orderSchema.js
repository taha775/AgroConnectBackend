import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      required: true,
      ref: 'User',
    },
    cartItems: [
      {
        productId: { type: Schema.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
        totalProductDiscount: { type: Number, default: 0 },
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      phone: { type: Number, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      default: 'cash',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

export const orderModel = model('Order', orderSchema);
