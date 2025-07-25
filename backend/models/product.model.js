import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    ProductName: {
        type: String,
        required: true
    },
    Price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: "https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product; 