const express = require('express');
const crypto = require('crypto');
const User = require('../Models/Users');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('./sendEmail');



// {
//     "username": "abc123",
//     "email": "abc123@gmail.com",
//     "password": "123456"
// }

// {
//     "email": "abc123@gmail.com",
//     "password": "123456"
// }



const register = async (req, res, next) => { 
    let { username, email, password, dob, role } = req.body;
    if(!role) role = 'user'
    try {
        const user = await User.create({ username, email, password, dob, role, isVerified: false });

        const { rawToken, hashedToken, expires } = generateVerificationToken();
        user.verificationToken = hashedToken;
        user.verificationTokenExpires = expires;
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

        try {
            await sendVerificationEmail(user.email, user.username, verifyUrl);
        } catch (mailErr) {
            console.error('Failed to send verification email:', mailErr);
            // Registration still succeeds; user can request a resend.
        }

        // No auth cookies are set here on purpose — the account is not
        // usable until the email is verified.
        res.status(201).json({
            success: true,
            message: 'Account created. Please check your email to verify your account before logging in.',
            email: user.email,
        });
    }
    catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in.',
                needsVerification: true,
                email: user.email,
            });
        }

        sendTokens(res, user._id);

        return res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });

    } catch (err) {
        next(err);
    }
};

const me = async (req, res, next) => {
    try {
        const currentUser = await User.findById(req.user.id).select('-password');
        if (!currentUser) {
            return res.status(404).json({ message: "User no longer exists" });
        }
        res.status(200).json(currentUser);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        user.password = newPassword; 
        await user.save(); 

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ message: 'Verification token missing' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Verification link is invalid or has expired.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });

        // Log the user in immediately after successful verification.
        sendTokens(res, user._id);

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully.',
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        next(error);
    }
};

const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        // Respond the same way whether or not the account exists, to avoid
        // leaking which emails are registered.
        if (!user || user.isVerified) {
            return res.status(200).json({
                success: true,
                message: 'If an unverified account exists for that email, a new link has been sent.',
            });
        }

        const { rawToken, hashedToken, expires } = generateVerificationToken();
        user.verificationToken = hashedToken;
        user.verificationTokenExpires = expires;
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
        await sendVerificationEmail(user.email, user.username, verifyUrl);

        return res.status(200).json({
            success: true,
            message: 'If an unverified account exists for that email, a new link has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

const logout = (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.status(200).json({ message: 'Logged out' });
};

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh Token Missing" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = generateAccessToken(decoded.id);

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 15 * 60 * 1000,
        });

        return res.status(200).json({ message: "Token refreshed successfully" });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or Expired Refresh Token" });
    }
};

const sendTokens = (res, userId) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const generateVerificationToken = () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return { rawToken, hashedToken, expires };
};

const generateAccessToken = (id) => {
    console.log("Generating Access Token for user ID:", id);
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    console.log("Generating Refresh Token for user ID:", id);
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

module.exports = {
    register,
    login,
    logout,
    refresh,
    me,
    changePassword,
    verifyEmail,
    resendVerification
};