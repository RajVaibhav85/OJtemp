const express = require('express');
const User = require('../Models/Users');
const jwt = require('jsonwebtoken');



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
        const user = await User.create({ username, email, password, dob, role });

        sendTokens(res, user._id);

        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            dob: user.dob,
            role: user.role,
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
            sameSite: 'Strict',
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
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
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
    changePassword
};