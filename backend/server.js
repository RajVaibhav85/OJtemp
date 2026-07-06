const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db')
const cookieParser = require('cookie-parser');
const { execSync } = require('child_process');

dotenv.config();

app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
connectDB()

const PORT = process.env.PORT || 5000;

// Resolve application metadata at boot time
let appVersion = '1.0.0';
let gitCommit = 'unknown';

try {
    // Dynamically grab version from package.json
    appVersion = require('./package.json').version;
} catch (err) {
    appVersion = process.env.APP_VERSION || '2.0.0';
}

try {
    // Extract short commit SHA via git CLI if available
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (err) {
    // Fallback for containerized environments without active .git directories
    gitCommit = process.env.GIT_COMMIT_SHA || 'N/A';
}

// ADVANCED HEALTH CHECK ROUTE
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'UP',
        health: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        version: appVersion,
        commit: gitCommit
    });
});

const authRoutes = require('./Routes/authRoutes')
app.use('/api/auth', authRoutes)

const compilerRoutes = require('./Routes/compilerRoutes')
app.use('/api/compiler', compilerRoutes)

const aiRoutes = require('./Routes/aiRoutes')
app.use('/api/ai', aiRoutes);

const dbRoutes = require('./Routes/dbRoutes')
app.use('/api/db', dbRoutes);

const profileRoutes = require('./Routes/profileRoutes')
app.use('/api/profile', profileRoutes);

const contestRoutes = require('./Routes/contestRoutes');
app.use('/api/contests', contestRoutes);

const adminRoutes = require('./Routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MONGODB Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `That ${field} is already taken.`;
    }

    console.error(`[Error Log]: ${message}`);
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        errors: process.env.NODE_ENV === 'development' ? err.errors || null : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

const JUDGE_IMAGES = [
  'frolvlad/alpine-gxx:latest',
  'python:3.11-alpine',
  'node:20-alpine',
  'eclipse-temurin:17-alpine',
];

console.log('Pre-pulling judge Docker images...');
JUDGE_IMAGES.forEach((img) => {
  try {
    execSync(`docker pull ${img}`, { stdio: 'inherit' });
    console.log(`✓ ${img}`);
  } catch (e) {
    console.warn(`⚠ Could not pull ${img}:`, e.message);
  }
});

app.listen(PORT , () => {
    console.log(`Listening to http://localhost:${PORT}`);
});