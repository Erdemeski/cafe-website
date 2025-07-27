import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from "cookie-parser";
import contactRoutes from './routes/contact.route.js';
import tableRoutes from './routes/table.route.js';
import orderRoutes from './routes/order.route.js';
import productRoutes from './routes/product.route.js';
import categoryRoutes from './routes/category.route.js';


mongoose
    .connect(process.env.MONGO)
    .then(() => {
        console.log("MongoDB is connected!");
    }).catch((err) => {
        console.log(err);
    });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/product', productRoutes);
app.use('/api', categoryRoutes);


app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error!';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});