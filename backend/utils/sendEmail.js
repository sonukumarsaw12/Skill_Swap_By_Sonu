const axios = require('axios');

/**
 * Send email using Google Apps Script Proxy (To bypass Render SMTP and Resend Domain restrictions)
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
    try {
        const proxyUrl = process.env.EMAIL_PROXY_URL;

        if (!proxyUrl) {
            console.error("EMAIL_PROXY_URL is missing in environment variables!");
            return;
        }

        console.log(`Attempting to send email via Google Proxy to ${options.email}...`);

        const response = await axios.post(proxyUrl, {
            to: options.email,
            subject: options.subject,
            html: options.html || options.message,
            name: "Skill Swap"
        });

        if (response.data === "Success") {
            console.log(`Email sent successfully via Proxy to ${options.email}`);
        } else {
            console.error("Proxy returned unexpected response:", response.data);
        }

    } catch (error) {
        console.error("Critical Email Error (Proxy):", error.message);

        // Final fallback log for OTP visibility in logs
        console.log("-----------------------------------------");
        console.log(`FALLBACK OTP for ${options.email}:`);
        console.log(`Subject: ${options.subject}`);
        console.log(`OTP Message: ${options.message}`);
        console.log("-----------------------------------------");
    }
};

module.exports = sendEmail;
