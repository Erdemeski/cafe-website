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
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product; 