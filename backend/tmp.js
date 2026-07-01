require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length, '(should be 16, no spaces)');

transporter.verify((err, success) => {
    if (err) {
        console.error('❌ SMTP auth failed:', err.message);
    } else {
        console.log('✅ SMTP auth succeeded — credentials are good.');
    }
});