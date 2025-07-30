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
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    ShortDescription: {
        type: String,
        default: "Lezzetli bir ürün"
    },
    Description: {
        type: String,
        default: "Lezzetli bir ürün"
    },
    Ingredients: {
        type: String,
        default: "No ingredients"
    },
    Allergens: {
        type: String,
        default: "No allergens"
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isNewOne: {
        type: Boolean,
        default: false
    },
    isVegetarian: {
        type: Boolean,
        default: false
    },
    isVegan: {
        type: Boolean,
        default: false
    },
    isGlutenFree: {
        type: Boolean,
        default: false
    },
    isLactoseFree: {
        type: Boolean,
        default: false
    },

}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product; 