import express from 'express';
import { 
    getUsers, 
    signout, 
    test, 
    getUser, 
    getUsersPP, 
    getStaffByStaffId,
    updateStaffPermissions,
    deleteStaff,
    updateUserInfo
} from '../controllers/user.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);
router.post('/signout', signout);

// Protected routes - Admin only
router.get('/getusers', verifyToken, verifyAdmin, getUsers);
router.get('/getUsersPP', verifyToken, verifyAdmin, getUsersPP);
router.put('/update-permissions/:userId', verifyToken, verifyAdmin, updateStaffPermissions);
router.put('/update/:userId', verifyToken, verifyAdmin, updateUserInfo);
router.delete('/delete/:userId', verifyToken, verifyAdmin, deleteStaff);

// Public routes
router.get('/staff/:staffId', getStaffByStaffId);
router.get('/:userId', getUser);

export default router;