const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend API (To bypass Render SMTP restrictions)
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
    try {
        console.log(`Attempting to send email via Resend to ${options.email}...`);
        
        const { data, error } = await resend.emails.send({
            from: 'SkillSwap <onboarding@resend.dev>',
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        });

        if (error) {
            console.error("Resend API Error:", error);
            throw new Error(error.message);
        }

        console.log(`Email sent successfully via Resend to ${options.email}. ID: ${data.id}`);
    } catch (error) {
        console.error("Critical Email Error (Resend):", error);
        
        // Final fallback log for OTP visibility in logs
        console.log("-----------------------------------------");
        console.log(`FALLBACK OTP for ${options.email}:`);
        console.log(`Subject: ${options.subject}`);
        console.log(`OTP Message: ${options.message}`);
        console.log("-----------------------------------------");
        
        throw error;
    }
};

module.exports = sendEmail;
