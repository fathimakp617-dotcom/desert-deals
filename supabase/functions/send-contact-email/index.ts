import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize all user inputs for HTML embedding
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    console.log("Processing contact form submission");

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Desert Deal <notifications@desertsdeals.com>",
      to: ["support@desertsdeals.com"],
      subject: `New Contact: ${safeSubject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px; text-align: center; background-color: #1a1a1a;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 4px; font-weight: 600;">DESERT DEAL</h1>
                      <p style="margin: 10px 0 0; color: #999; font-size: 11px; letter-spacing: 2px;">NEW CONTACT MESSAGE</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #888; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">From</p>
                            <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${safeName}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #888; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Email</p>
                            <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px;">${safeEmail}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #888; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Subject</p>
                            <p style="margin: 5px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${safeSubject}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 20px; background-color: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0;">
                            <p style="margin: 0; color: #888; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Message</p>
                            <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; color: #999; font-size: 12px;">Reply directly to this email to respond to the customer.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      reply_to: email,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // Send confirmation to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Desert Deal <notifications@desertsdeals.com>",
      to: [email],
      subject: "We received your message - Desert Deal",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px; text-align: center; background-color: #1a1a1a;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 4px; font-weight: 600;">DESERT DEAL</h1>
                      <p style="margin: 10px 0 0; color: #999; font-size: 11px; letter-spacing: 2px;">PREMIUM FOOTWEAR</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Thank You, ${safeName}!</h2>
                      <p style="margin: 0 0 30px; color: #555; font-size: 15px; line-height: 1.6;">
                        We have received your message and will get back to you as soon as possible.
                      </p>
                      
                      <div style="padding: 20px; background-color: #f5f5f5; border-left: 3px solid #1a1a1a; text-align: left; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #888; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Your Message</p>
                        <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
                      </div>
                      
                      <p style="margin: 0; color: #888; font-size: 14px;">
                        In the meantime, feel free to explore our collection at<br>
                        <a href="https://desertsdeals.com" style="color: #1a1a1a; text-decoration: underline; font-weight: 500;">desertsdeals.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; border-top: 1px solid #e5e5e5; background-color: #1a1a1a;">
                      <p style="margin: 0; color: #ffffff; font-size: 13px; letter-spacing: 2px; font-weight: 600;">DESERT DEAL</p>
                      <p style="margin: 8px 0 0; color: #999; font-size: 11px;">UAE</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Customer confirmation sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send message" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
