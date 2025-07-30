import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { errorHandler } from '../utils/error.js';

// GET /api/product
export const getProducts = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, "Bu işlemi yapmak için yetkiniz yok."));
  }
  try {
    const products = await Product.find().populate('category', 'name description image color');
    res.json({ success: true, products });
  } catch (err) {
    next(errorHandler(500, "Ürünler alınamadı."));
  }
}; 

// GET /api/product/public 
export const getProductsPublic = async (req, res, next) => {
  try {
    const { category } = req.query;
    
    let query = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    const products = await Product.find(query)
      .populate('category', 'name description image color')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, products });
  } catch (err) {
    next(errorHandler(500, "Ürünler alınamadı."));
  }
};

// POST /api/product
export const createProduct = async (req, res, next) => {
 // if (!req.user.isAdmin) {
   // return next(errorHandler(403, "Bu işlemi yapmak için yetkiniz yok."));
  //}
  
  try {
    const { ProductName, Price, image, category, isActive, ShortDescription, Description, Ingredients, Allergens, isPopular, isNewOne, isVegetarian, isVegan, isGlutenFree, isLactoseFree } = req.body;
    
    if (!ProductName || !Price || !category) {
      return next(errorHandler(400, "Eksik parametre."));
    }
    
    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(errorHandler(400, "Geçersiz kategori."));
    }
    
    const newProduct = new Product({ 
      ProductName, 
      Price, 
      image, 
      category, 
      isActive: isActive !== undefined ? isActive : true, 
      ShortDescription,
      Description,
      Ingredients,
      Allergens,
      isPopular,
      isNewOne,
      isVegetarian,
      isVegan,
      isGlutenFree,
      isLactoseFree,
    });
    
    const savedProduct = await newProduct.save();
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('category', 'name description image color');
      
    res.status(201).json({ success: true, product: populatedProduct });
  } catch (err) {
    next(errorHandler(500, "Ürün oluşturulamadı."));
  }
}

// PUT /api/product/:id
export const updateProduct = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, "Bu işlemi yapmak için yetkiniz yok."));
  }
  
  try {
    const { id } = req.params;
    const { ProductName, Price, image, category, isActive, ShortDescription, Description, Ingredients, Allergens, isPopular, isNewOne, isVegetarian, isVegan, isGlutenFree, isLactoseFree } = req.body;
    
    // En az bir güncelleme alanı olmalı
    if (!ProductName && !Price && !image && !category && isActive === undefined && !ShortDescription && !Description && !Ingredients && !Allergens && isPopular === undefined && isNewOne === undefined && isVegetarian === undefined && isVegan === undefined && isGlutenFree === undefined && isLactoseFree === undefined) {
      return next(errorHandler(400, "En az bir güncelleme alanı gerekli."));
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return next(errorHandler(404, "Ürün bulunamadı."));
    }
    
    // If category is being updated, check if it exists
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return next(errorHandler(400, "Geçersiz kategori."));
      }
    }
    
    const updateData = {};
    if (ProductName) updateData.ProductName = ProductName;
    if (Price !== undefined) updateData.Price = Price;
    if (image) updateData.image = image;
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (ShortDescription) updateData.ShortDescription = ShortDescription;
    if (Description) updateData.Description = Description;
    if (Ingredients) updateData.Ingredients = Ingredients;
    if (Allergens) updateData.Allergens = Allergens;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isNewOne !== undefined) updateData.isNewOne = isNewOne;
    if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian;
    if (isVegan !== undefined) updateData.isVegan = isVegan;
    if (isGlutenFree !== undefined) updateData.isGlutenFree = isGlutenFree;
    if (isLactoseFree !== undefined) updateData.isLactoseFree = isLactoseFree;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name description image color');
    
    res.json({ success: true, product: updatedProduct });
  } catch (err) {
    next(errorHandler(500, "Ürün güncellenemedi."));
  }
}

// DELETE /api/product/:id
export const deleteProduct = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, "Bu işlemi yapmak için yetkiniz yok."));
  }
  
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return next(errorHandler(404, "Ürün bulunamadı."));
    }
    
    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: "Ürün başarıyla silindi." });
  } catch (err) {
    next(errorHandler(500, "Ürün silinemedi."));
  }
}

// GET /api/product/:id
export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id).populate('category', 'name description image');
    if (!product) {
      return next(errorHandler(404, "Ürün bulunamadı."));
    }
    
    res.json({ success: true, product });
  } catch (err) {
    next(errorHandler(500, "Ürün alınamadı."));
  }
}

// GET /api/product/category/:categoryId
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.query;
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(errorHandler(404, "Kategori bulunamadı."));
    }
    
    let query = { category: categoryId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const products = await Product.find(query)
      .populate('category', 'name description image isActive')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, products, category });
  } catch (err) {
    next(errorHandler(500, "Kategori ürünleri alınamadı."));
  }
}
