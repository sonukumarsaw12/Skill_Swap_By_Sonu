const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2) Define the email options
    const mailOptions = {
        from: `SkillSwap <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // 3) Actually send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error("Error sending email:", error);
        console.log("-----------------------------------------");
        console.log(`DEVELOPMENT OTP for ${options.email}:`);
        console.log(`Subject: ${options.subject}`);
        console.log(`OTP: ${options.message}`);
        console.log("-----------------------------------------");
        // Re-throw if it's not a dev environment, or just let it pass for now
        // throw error; 
    }
};

module.exports = sendEmail;
