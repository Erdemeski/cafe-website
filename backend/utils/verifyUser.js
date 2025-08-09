import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';
import User from '../models/user.model.js';

export const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return next(errorHandler(401, 'Unauthorized - Please sign in'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            const message = err.name === 'TokenExpiredError' ? 'Session expired - Please sign in again' : 'Unauthorized - Invalid token';
            return next(errorHandler(401, message));
        }
        req.user = user;
        next();
    });
};

export const verifyOptionalToken = async (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            req.user = null;
            return next();
        }
        req.user = user;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

// New middleware to verify admin access
export const verifyAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, 'Access denied - Admin privileges required'));
    }
    next();
};

// New middleware to verify waiter access
export const verifyWaiter = (req, res, next) => {
    if (!req.user.isWaiter && !req.user.isAdmin) {
        return next(errorHandler(403, 'Access denied - Waiter privileges required'));
    }
    next();
};

// New middleware to verify manager access
export const verifyManager = (req, res, next) => {
    if (!req.user.isManager && !req.user.isAdmin) {
        return next(errorHandler(403, 'Access denied - Manager privileges required'));
    }
    next();
};

// New middleware to verify reception access
export const verifyReception = (req, res, next) => {
    if (!req.user.isReception && !req.user.isAdmin) {
        return next(errorHandler(403, 'Access denied - Reception privileges required'));
    }
    next();
};

// New middleware to verify staff access (any role)
export const verifyStaff = (req, res, next) => {
    if (!req.user.isAdmin && !req.user.isWaiter && !req.user.isManager && !req.user.isReception) {
        return next(errorHandler(403, 'Access denied - Staff privileges required'));
    }
    next();
};