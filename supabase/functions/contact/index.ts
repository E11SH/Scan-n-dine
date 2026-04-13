import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { name?: string; email?: string; business?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { name, email, business, message } = body;

  // Validation
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: "Name, email, and message are required." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Save submission to Supabase database
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: dbError } = await supabase
    .from("contact_submissions")
    .insert({ name, email, business: business || null, message });

  if (dbError) {
    console.error("DB insert error:", dbError);
  }

  // Send email via Gmail SMTP
  const smtpHost     = Deno.env.get("SMTP_HOST")!;
  const smtpPort     = Number(Deno.env.get("SMTP_PORT")) || 465;
  const smtpSecure   = Deno.env.get("SMTP_SECURE") === "true";
  const smtpUser     = Deno.env.get("SMTP_USER")!;
  const smtpPass     = Deno.env.get("SMTP_PASS")!;
  const recipientEmail = Deno.env.get("RECIPIENT_EMAIL")!;

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: smtpSecure,
      auth: { username: smtpUser, password: smtpPass },
    },
  });

  try {
    await client.send({
      from: `ScannDine Contact Form <${smtpUser}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `New Contact Form Submission — ${name}`,
      content: [
        `Name:            ${name}`,
        `Email:           ${email}`,
        `Restaurant Name: ${business || "—"}`,
        ``,
        `Message:`,
        message,
      ].join("\n"),
      html: `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:15px;">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td><strong>Restaurant Name</strong></td><td>${escapeHtml(business || "—")}</td></tr>
        </table>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      `,
    });
    await client.close();
  } catch (err) {
    console.error("SMTP error:", err);
    return new Response(JSON.stringify({ error: "Failed to send message. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
