import nodemailer from 'nodemailer';

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpEmail = async (email: string, otp: string, type: 'verification' | 'reset') => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const isVerification = type === 'verification';
    const subject = isVerification 
        ? 'TrackPricely - Email Verification OTP' 
        : 'TrackPricely - Password Reset OTP';
    
    const title = isVerification ? 'Verify Your Email' : 'Password Reset Request';
    const message = isVerification 
        ? 'Thank you for joining TrackPricely! Please use the following OTP to verify your email address and complete your registration:' 
        : 'You requested to reset your password. Use the following OTP to complete the process:';

    const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@trackpricely.com',
        to: email,
        subject: subject,
        html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3b82f6; margin: 0;">TrackPricely</h1>
                </div>
                <h2 style="color: #333; text-align: center;">${title}</h2>
                <p style="color: #444; line-height: 1.6;">Hello,</p>
                <p style="color: #444; line-height: 1.6;">${message}</p>
                <div style="background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 12px; margin: 30px 0; border: 1px solid #e4e4e7; color: #18181b;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">This OTP is valid for 15 minutes. If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} TrackPricely. All rights reserved.</p>
            </div>
        `,
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
    } else {
        console.log(`[Email Mock] To: ${email} | Subject: ${subject} | OTP: ${otp}`);
    }
};
