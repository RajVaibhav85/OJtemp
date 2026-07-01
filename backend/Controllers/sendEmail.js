const nodemailer = require('nodemailer');

// Gmail transporter. Requires EMAIL_USER (your gmail address) and
// EMAIL_PASS (a 16-character Gmail "App Password", NOT your normal password)
// in your .env file. App passwords: https://myaccount.google.com/apppasswords
// (Gmail account must have 2-Step Verification enabled to generate one.)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = async (toEmail, username, verifyUrl) => {
    const mailOptions = {
        from: `"Online Judge" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Verify your Online Judge account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0518; border-radius: 12px; color: #f3f0ff;">
                <h2 style="margin: 0 0 16px; color: #c4b5fd;">Welcome, ${username} 👋</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #b4aed1;">
                    Thanks for signing up for Online Judge. Please verify your email address to activate your account.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${verifyUrl}"
                       style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%); color: #0a0518; text-decoration: none; font-weight: 600; border-radius: 10px; font-size: 14px;">
                        Verify Email
                    </a>
                </div>
                <p style="font-size: 12px; color: #9d96b8; line-height: 1.5;">
                    Or copy and paste this link into your browser:<br/>
                    <a href="${verifyUrl}" style="color: #a78bfa; word-break: break-all;">${verifyUrl}</a>
                </p>
                <p style="font-size: 12px; color: #9d96b8; margin-top: 24px;">
                    This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };