import sendEmail from "./email-manager";

/**
 * Sends an OTP email to the specified recipient.
 * @param to {String} - The recipient's email address.
 * @param subject {String} - The subject of the email.
 * @param otp {String | number} - The OTP to be sent.
 * @returns {Promise<boolean>}
 */
export default async function sendOtp(to: string, subject: string, otp: string | number): Promise<boolean> {
    try {
        await sendEmail(
            to,
            subject,
            './utils/templates/email/otp-template.html',
            {
                otp: otp,
            }
        );

        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
}

