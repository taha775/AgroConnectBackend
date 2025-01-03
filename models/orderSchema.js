import { Schema,model } from "mongoose";


const orderSchema = new Schema({
    userId:{
        type:Schema.ObjectId,
        required:true,
        ref:'User'
    },
    cartItems:[
        {
            productId:{type:Schema.ObjectId, ref : "Product"},
            quantity:{
              type:Number,
              default:1
            },
            price:Number,
            totalProductDiscount:Number
          }
    ],
    shippingAddress:{
        street:String,
        city:String,
        phone:Number
    },
    paymentMethod:{
        type:String,
        enum:['card','cash'],
        default:'cash'
    },
    isPaid:{
        type:Boolean,
        default:false
    },
    isDelivered:{
        type:Boolean,
        default:false
    },
    paidAt:Date,
    deliveredAt:Date
})

export const orderModel = model('Order',orderSchema)