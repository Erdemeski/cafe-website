import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: "https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg"
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

export default Category; 