import express from 'express';
import { 
    createCategory, 
    getCategories, 
    getCategory, 
    updateCategory, 
    deleteCategory, 
} from '../controllers/category.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);

// Protected routes (Admin only)
router.post('/categories', createCategory);
router.put('/categories/:id', verifyToken, verifyAdmin, updateCategory);
router.delete('/categories/:id', verifyToken, verifyAdmin, deleteCategory);




export default router; 