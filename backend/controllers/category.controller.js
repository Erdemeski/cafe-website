import Category from '../models/category.model.js';
import { errorHandler } from '../utils/error.js';

// Create a new category
export const createCategory = async (req, res, next) => {
    try {
        const { name, description, image, isActive} = req.body;

        // Check if category with same name already exists
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return next(errorHandler(400, 'Category with this name already exists'));
        }

        const newCategory = new Category({
            name: name.trim(),
            description,
            image,
            isActive
        });

        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        next(error);
    }
};

// Get all categories
export const getCategories = async (req, res, next) => {
    try {
        const { isActive } = req.query;
        
        let query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const categories = await Category.find(query).sort({ order: 1, createdAt: -1 });
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
};

// Get a single category by ID
export const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return next(errorHandler(404, 'Category not found'));
        }
        
        res.status(200).json(category);
    } catch (error) {
        next(error);
    }
};

// Update a category
export const updateCategory = async (req, res, next) => {
    try {
        const { name, description, image, isActive, } = req.body;
        
        // Check if category exists
        const category = await Category.findById(req.params.id);
        if (!category) {
            return next(errorHandler(404, 'Category not found'));
        }

        // If name is being updated, check for duplicates
        if (name && name.trim() !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: name.trim(),
                _id: { $ne: req.params.id }
            });
            if (existingCategory) {
                return next(errorHandler(400, 'Category with this name already exists'));
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: name ? name.trim() : category.name,
                description,
                image,
                isActive,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedCategory);
    } catch (error) {
        next(error);
    }
};

// Delete a category
export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return next(errorHandler(404, 'Category not found'));
        }

        // Check if category has products (you might want to add this check)
        // const productsWithCategory = await Product.find({ category: req.params.id });
        // if (productsWithCategory.length > 0) {
        //     return next(errorHandler(400, 'Cannot delete category with existing products'));
        // }

        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
};
