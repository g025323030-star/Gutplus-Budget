import nodemailer, { Transporter } from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; 
}

// Debug: Check environment variables
console.log('[EMAIL DEBUG] Loaded ENV variables:', {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_SECURE: process.env.EMAIL_SECURE,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS ? '***' : 'undefined',
  EMAIL_PASS: process.env.EMAIL_PASS ? '***' : 'undefined',
});

// יצירת הטרנספורטר עם הגדרת טיפוס
const transporter: Transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
  },
});

//בבדיקת תקינות החיבור לשרת הדוא"ל
transporter.verify((error, success) => {
  if (error) {
    console.error("Connection to email server failed:", error);
  } else {
    console.log("Email server is ready to take our messages");
  }
});

/**
 * פונקציה גנרית לשליחת מייל
 */
export const sendEmail = async ({ to, subject, html, text }: MailOptions): Promise<void> => {
  const emailName = process.env.EMAIL_FROM_NAME || "Gutplus Finance";
  const emailAddress = process.env.EMAIL_ADDRESS;
  try {
    const mailOptions = {
      from: `"${emailName}" <${emailAddress}>`,
      to,
      subject,
      text,
      html,
    };
        const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};