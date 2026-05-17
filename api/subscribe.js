// Vercel Serverless API Route: /api/subscribe
// Sends access request notifications via multiple channels:
// 1. ntfy push notification (primary — instant, reliable)
// 2. Email via Resend API if configured, or FormSubmit.co fallback

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data.firstName || !data.email) {
      return res.status(400).json({ error: "First name and email are required" });
    }

    const name = `${data.firstName} ${data.lastName || ""}`.trim();
    const results = { ntfy: false, email: false };

    // ── Channel 1: ntfy push notification (always fires) ──
    try {
      const ntfyResp = await fetch("https://ntfy.sh/primaledge-access-requests", {
        method: "POST",
        headers: {
          Title: `New Access Request: ${name}`,
          Tags: "rocket,bell",
          Priority: "high",
        },
        body: [
          `🚀 NEW ACCESS REQUEST`,
          ``,
          `Name: ${name}`,
          `Email: ${data.email}`,
          `Phone: ${data.phone || "—"}`,
          `Experience: ${data.tradingExp || "—"}`,
          `Alert Username: ${data.ntfyTopic || "—"}`,
          ``,
          `— Primal Edge Subscribe Form`,
        ].join("\n"),
      });
      results.ntfy = ntfyResp.ok;
    } catch (e) {
      console.error("ntfy error:", e);
    }

    // ── Channel 2: Email notification ──
    // Try Resend API first (if RESEND_API_KEY is set), then FormSubmit fallback
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      try {
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Primal Edge <onboarding@resend.dev>",
            to: ["shawnholdings@gmail.com"],
            subject: `🚀 New Access Request: ${name}`,
            html: `
              <div style="font-family: monospace; background: #0a0e14; color: #e0e0e0; padding: 24px; border-radius: 12px;">
                <h2 style="color: #00d4aa; margin-bottom: 20px;">🚀 New Access Request</h2>
                <table style="border-collapse: collapse; width: 100%;">
                  <tr><td style="padding: 8px; color: #888;">Name</td><td style="padding: 8px; color: #fff; font-weight: bold;">${name}</td></tr>
                  <tr><td style="padding: 8px; color: #888;">Email</td><td style="padding: 8px; color: #00d4aa;">${data.email}</td></tr>
                  <tr><td style="padding: 8px; color: #888;">Phone</td><td style="padding: 8px; color: #fff;">${data.phone || "—"}</td></tr>
                  <tr><td style="padding: 8px; color: #888;">Experience</td><td style="padding: 8px; color: #fff;">${data.tradingExp || "—"}</td></tr>
                  <tr><td style="padding: 8px; color: #888;">Alert Username</td><td style="padding: 8px; color: #fff;">${data.ntfyTopic || "—"}</td></tr>
                </table>
                <p style="margin-top: 20px; color: #555; font-size: 12px;">Submitted from primaledge-landing.vercel.app/subscribe</p>
              </div>
            `,
          }),
        });
        results.email = emailResp.ok;
        if (!emailResp.ok) {
          const errBody = await emailResp.text();
          console.error("Resend error:", emailResp.status, errBody);
        }
      } catch (e) {
        console.error("Resend error:", e);
      }
    } else {
      // Fallback: FormSubmit.co
      try {
        const fsResp = await fetch("https://formsubmit.co/ajax/shawnholdings@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            _subject: `🚀 New Access Request: ${name}`,
            _template: "table",
            _captcha: "false",
            _replyto: data.email,
            "First Name": data.firstName,
            "Last Name": data.lastName || "—",
            Email: data.email,
            Phone: data.phone || "—",
            "Trading Experience": data.tradingExp || "—",
            "Alert Username": data.ntfyTopic || "—",
          }),
        });
        results.email = fsResp.ok;
      } catch (e) {
        console.error("FormSubmit error:", e);
      }
    }

    console.log("Subscribe results:", results);

    // Success as long as at least ONE channel delivered
    if (results.ntfy || results.email) {
      return res.status(200).json({ success: true, channels: results });
    }

    return res.status(500).json({ error: "All notification channels failed" });
  } catch (err) {
    console.error("Subscribe API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
