import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
// Always load .env from the same folder as this file (backend dir), regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
import express from "express";
import mongoose from "mongoose";
import Order from './models/order.model.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from "cookie-parser";
import contactRoutes from './routes/contact.route.js';
import tableRoutes from './routes/table.route.js';
import orderRoutes from './routes/order.route.js';
import productRoutes from './routes/product.route.js';
import categoryRoutes from './routes/category.route.js';


if (!process.env.MONGO) {
    console.error("[Config Error] MONGO is not set in backend/.env. Example: MONGO=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error("[Config Error] JWT_SECRET is not set in backend/.env. Please set a strong secret string.");
    process.exit(1);
}

mongoose
    .connect(process.env.MONGO)
    .then(async () => {
        console.log("MongoDB is connected!");
        // Index bakım: cookieNumber üzerindeki unique index'i kaldır (birden fazla siparişe izin ver)
        try {
            const collection = mongoose.connection.collection('orders');
            const indexes = await collection.indexes();
            const cookieIdx = indexes.find((idx) => idx.key && idx.key.cookieNumber === 1);
            if (cookieIdx && cookieIdx.unique) {
                await collection.dropIndex(cookieIdx.name);
                await collection.createIndex({ cookieNumber: 1 });
                console.log('Updated orders.cookieNumber index to non-unique');
            }
        } catch (e) {
            console.warn('Order indexes check failed:', e?.message || e);
        }
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
app.use('/api/category', categoryRoutes);


app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error!';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});