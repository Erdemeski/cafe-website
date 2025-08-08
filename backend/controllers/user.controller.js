import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

export const test = (req, res) => {
    res.json({ 
        message: 'Cafe API is working!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: [
            'Staff Authentication',
            'Role-based Access Control',
            'Cafe Management System'
        ]
    });
};

export const signout = (req, res, next) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        res
            .clearCookie('access_token', {
                httpOnly: true,
                sameSite: 'lax',
                secure: isProd,
            })
            .status(200)
            .json('Staff has been signed out');
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to see staff list'));
    }

    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const users = await User.find().sort({ createdAt: sortDirection }).skip(startIndex).limit(limit);

        const usersWithoutPassword = users.map((user) => {
            const { password, ...rest } = user._doc;
            return rest;
        });

        const totalUsers = await User.countDocuments();
        const now = new Date();
        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
        );
        const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

        res.status(200).json({
            users: usersWithoutPassword,
            totalUsers,
            lastMonthUsers
        });

    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return next(errorHandler(404, 'Staff not found!'));
        }
        const { password, ...rest } = user._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

export const getUsersPP = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to see staff list'));
    }
    try {
        const users = await User.find().select('_id profilePicture staffId firstName lastName isAdmin isWaiter isManager isReception');
        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

// New function to get staff by staffId
export const getStaffByStaffId = async (req, res, next) => {
    try {
        const user = await User.findOne({ staffId: req.params.staffId });
        if (!user) {
            return next(errorHandler(404, 'Staff not found!'));
        }
        const { password, ...rest } = user._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

// New function to update staff permissions (admin only)
export const updateStaffPermissions = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'Only admins can update staff permissions'));
    }

    try {
        const { isAdmin, isWaiter, isManager, isReception } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
            $set: {
                isAdmin: isAdmin || false,
                isWaiter: isWaiter || false,
                isManager: isManager || false,
                isReception: isReception || false,
            },
        }, { new: true });

        if (!updatedUser) {
            return next(errorHandler(404, 'Staff not found'));
        }

        const { password, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

// New function to delete staff (admin only)
export const deleteStaff = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'Only admins can delete staff'));
    }
    
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return next(errorHandler(404, 'Staff not found'));
        }
        res.status(200).json({ message: 'Staff deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// New function to update user information (admin only)
export const updateUserInfo = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'Only admins can update user information'));
    }

    try {
        const { staffId, firstName, lastName, password, profilePicture, isAdmin, isWaiter, isManager, isReception } = req.body;

        // Check if staffId is being updated and if it's already taken
        if (staffId) {
            const existingUser = await User.findOne({ staffId, _id: { $ne: req.params.userId } });
            if (existingUser) {
                return next(errorHandler(400, 'Staff ID already exists'));
            }
        }

        const updateData = {
            staffId,
            firstName,
            lastName,
            profilePicture,
            isAdmin: isAdmin || false,
            isWaiter: isWaiter || false,
            isManager: isManager || false,
            isReception: isReception || false,
        };

        // Only update password if provided
        if (password) {
            updateData.password = bcryptjs.hashSync(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
            $set: updateData,
        }, { new: true });

        if (!updatedUser) {
            return next(errorHandler(404, 'User not found'));
        }

        const { password: hashedPassword, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
};

/* export const updateUserInfo = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to update user info'));
    }

    try {
        const { firstName, lastName, password } = req.body;

        const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
            $set: {
                firstName,
                lastName,
                password: password ? bcryptjs.hashSync(password, 10) : undefined,
            },
        }, { new: true });

        if (!updatedUser) {
            return next(errorHandler(404, 'User not found'));
        }

        const { password: hashedPassword, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
}
 */