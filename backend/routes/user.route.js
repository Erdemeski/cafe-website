import express from 'express';
import { 
    getUsers, 
    signout, 
    test, 
    getUser, 
    getUsersPP, 
    getStaffByStaffId,
    updateStaffPermissions,
    deleteStaff
} from '../controllers/user.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);
router.post('/signout', signout);

// Public routes
router.get('/:userId', getUser);
router.get('/staff/:staffId', getStaffByStaffId);

// Protected routes - Admin only
router.get('/getusers', verifyToken, verifyAdmin, getUsers);
router.get('/getUsersPP', verifyToken, verifyAdmin, getUsersPP);
router.put('/update-permissions/:userId', verifyToken, verifyAdmin, updateStaffPermissions);
router.delete('/delete/:userId', verifyToken, verifyAdmin, deleteStaff);

export default router;