import { Resend } from 'resend';

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing. Email service will not work.");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

export class EmailService {
  static async sendInvitationEmail(toEmail: string, inviteLink: string, role: string, tenantName: string) {
    const resend = getResend();
    if (!resend) {
      console.log(`[Email Simulation] To: ${toEmail}, Link: ${inviteLink}, Role: ${role}, Tenant: ${tenantName}`);
      return true;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Menuin <noreply@boluanisa.store>', // Use verified domain
        to: [toEmail],
        subject: `You have been invited to join ${tenantName} on Menuin`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Invitation to join Menuin</h2>
            <p>You have been invited to join <strong>${tenantName}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to set up your account.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background-color:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Set up Account</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend Error:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }
}
