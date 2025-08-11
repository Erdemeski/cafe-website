import User from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
    const { staffId, firstName, lastName, password } = req.body;

    if (!staffId || !firstName || !lastName || !password ||
        staffId === '' || firstName === '' || lastName === '' || password === '') {
        return next(errorHandler(400, 'All fields are required!'));
    }

    // Staff ID validation - should be numeric and 6 digits
    if (!/^\d{6}$/.test(staffId)) {
        return next(errorHandler(400, 'Staff ID must be 6 digits!'));
    }

    // Name validation
    if (firstName.trim().length < 2) {
        return next(errorHandler(400, 'First name must be at least 2 characters long'));
    }
    if (lastName.trim().length < 2) {
        return next(errorHandler(400, 'Last name must be at least 2 characters long'));
    }

    // Password validation
    if (password.length < 6) {
        return next(errorHandler(400, 'Password must be at least 6 characters long'));
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newUser = new User({
        staffId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: hashedPassword
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'Staff account created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return next(errorHandler(400, 'Staff ID already exists'));
        }
        next(error);
    }
};

export const signin = async (req, res, next) => {
    const { staffId, password } = req.body;

    if (!staffId || !password || staffId === '' || password === '') {
        return next(errorHandler(400, 'Staff ID and password are required'));
    }

    try {
        const validUser = await User.findOne({ staffId });
        if (!validUser) {
            return next(errorHandler(404, 'Staff not found'));
        }

        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) {
            return next(errorHandler(400, 'Invalid password'));
        }

        const token = jwt.sign(
            {
                id: validUser._id,
                staffId: validUser.staffId,
                isAdmin: validUser.isAdmin,
                isWaiter: validUser.isWaiter,
                isManager: validUser.isManager,
                isReception: validUser.isReception
            },
            process.env.JWT_SECRET,
            { expiresIn: '10m' } // 10 minutes
        );

        const { password: pass, ...rest } = validUser._doc;

        const isProd = process.env.NODE_ENV === 'production';
        const sessionDurationMs = 10 * 60 * 1000; // 10 minutes
        res
            .status(200)
            .cookie('access_token', token, {
                httpOnly: true,
                maxAge: sessionDurationMs,
                sameSite: 'lax',
                secure: isProd,
            })
            .json({ ...rest, sessionExpiresAt: Date.now() + sessionDurationMs });
    } catch (error) {
        next(error);
    }
}

function replaceTurkishChars(str) {
    const turkishMap = {
        'ç': 'c',
        'Ç': 'C',
        'ğ': 'g',
        'Ğ': 'G',
        'ı': 'i',
        'İ': 'I',
        'ö': 'o',
        'Ö': 'O',
        'ş': 's',
        'Ş': 'S',
        'ü': 'u',
        'Ü': 'U'
    };

    return str.split('').map(char => turkishMap[char] || char).join('');
}

// Refresh session if user is active (requires a valid, unexpired token)
export const refreshSession = async (req, res, next) => {
    try {
        // req.user is set by verifyToken middleware (decoded JWT)
        const { id, staffId, isAdmin, isWaiter, isManager, isReception } = req.user || {};
        if (!id) {
            return next(errorHandler(401, 'Unauthorized - Please sign in'));
        }

        const token = jwt.sign(
            { id, staffId, isAdmin, isWaiter, isManager, isReception },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        const isProd = process.env.NODE_ENV === 'production';
        const sessionDurationMs = 10 * 60 * 1000; // 10 minutes

        res
            .cookie('access_token', token, {
                httpOnly: true,
                maxAge: sessionDurationMs,
                sameSite: 'lax',
                secure: isProd,
            })
            .status(200)
            .json({ sessionExpiresAt: Date.now() + sessionDurationMs });

    } catch (error) {
        next(error);
    }
};

/* export const google = async (req, res, next) => {
    const { email, firstName, lastName, googlePhotoUrl } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = user._doc;
            res.status(200).cookie('access_token', token, {
                httpOnly: true
            }).json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
            const username = replaceTurkishChars((firstName + lastName).toLowerCase().replace(/\s+/g, '') + Math.random().toString(9).slice(-4));
            
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                profilePicture: googlePhotoUrl,
                firstName,
                lastName
            });
            await newUser.save();
            const token = jwt.sign({ id: newUser._id, isAdmin: newUser.isAdmin }, process.env.JWT_SECRET);
            const { password, ...rest } = newUser._doc;
            res.status(200).cookie('access_token', token, {
                httpOnly: true
            }).json(rest);
        }
    } catch (error) {
        next(error);
    }
} */