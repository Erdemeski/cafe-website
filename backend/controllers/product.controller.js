import Product from "../models/product.model.js";

// GET /api/product
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ message: "Ürünler alınamadı." });
  }
}; 