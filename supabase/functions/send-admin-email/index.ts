import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Validate admin session
async function validateAdmin(email: string, token: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data } = await supabase
    .from("staff_sessions")
    .select("id")
    .eq("email", email)
    .eq("session_token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!data) return false;
  const { data: staff } = await supabase
    .from("staff_members")
    .select("role")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  return staff?.role === "admin";
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin_email, admin_token, to_emails, subject, message } = await req.json();

    // Validate admin
    if (!admin_email || !admin_token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isAdmin = await validateAdmin(admin_email, admin_token);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate inputs
    if (!to_emails || !Array.isArray(to_emails) || to_emails.length === 0 || !subject || !message) {
      return new Response(JSON.stringify({ error: "Recipients, subject, and message are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send to each recipient (Resend free tier: max 2 emails/sec)
    for (const recipient of to_emails) {
      try {
        await resend.emails.send({
          from: "Desert Deal <notifications@desertdeal.site>",
          to: [recipient],
          subject: safeSubject,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px;text-align:center;background-color:#1a1a1a;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:4px;font-weight:600;">DESERT DEAL</h1>
          <p style="margin:10px 0 0;color:#999;font-size:11px;letter-spacing:2px;">PREMIUM COLLECTION</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 20px;color:#1a1a1a;font-size:20px;font-weight:600;">${safeSubject}</h2>
          <div style="color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${safeMessage}</div>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #e5e5e5;background-color:#1a1a1a;">
          <p style="margin:0;color:#fff;font-size:13px;letter-spacing:2px;font-weight:600;">DESERT DEAL</p>
          <p style="margin:8px 0 0;color:#999;font-size:11px;">UAE</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });
        results.push({ email: recipient, success: true });
      } catch (err: any) {
        results.push({ email: recipient, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Admin email sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
