import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        user.resetOtp = otp;
        user.resetOtpExpiry = otpExpiry;
        await user.save();

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@trackpricely.com',
            to: email,
            subject: 'TrackPricely - Password Reset OTP',
            html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You requested to reset your password. Use the following OTP to complete the process:</p>
                    <div style="background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #666; font-size: 14px;">This OTP is valid for 15 minutes. If you didn't request a password reset, please ignore this email.</p>
                </div>
            `,
        };

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log("No SMTP credentials provided. The OTP is:", otp);
            // We'll proceed in dev mode even if email fails
        }

        return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
