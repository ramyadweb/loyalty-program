import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function testEmail() {
    try {
        console.log("Checking SMTP connection...");

        await transporter.verify();

        console.log("SMTP connection successful!");

        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.SMTP_USER,
            subject: "Loyalty Program Email Test",
            text: "Your Gmail SMTP configuration is working successfully!",
        });

        console.log("Email sent successfully!");
        console.log("Message ID:", result.messageId);
    } catch (error) {
        console.error("Email sending failed:", error);
    }
}

testEmail();