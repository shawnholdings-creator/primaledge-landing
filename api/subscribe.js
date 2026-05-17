// Vercel Serverless API Route: /api/subscribe
// Sends access request notifications via:
// 1. ntfy push notification (primary — instant, always works)
// 2. Resend email API (when RESEND_API_KEY env var is set)

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

    // ── Channel 2: Resend email (if API key is configured) ──
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
              <div style="font-family: 'Courier New', monospace; background: #0a0e14; color: #e0e0e0; padding: 32px; border-radius: 12px; max-width: 500px;">
                <div style="border-bottom: 1px solid #1a2332; padding-bottom: 16px; margin-bottom: 24px;">
                  <h2 style="color: #00d4aa; margin: 0 0 4px 0; font-size: 18px;">🚀 New Access Request</h2>
                  <p style="color: #555; margin: 0; font-size: 11px;">via primaledge-landing.vercel.app/subscribe</p>
                </div>
                <table style="border-collapse: collapse; width: 100%;">
                  <tr><td style="padding: 10px 12px; color: #888; font-size: 12px; border-bottom: 1px solid #1a2332;">Name</td><td style="padding: 10px 12px; color: #fff; font-weight: bold; font-size: 14px; border-bottom: 1px solid #1a2332;">${name}</td></tr>
                  <tr><td style="padding: 10px 12px; color: #888; font-size: 12px; border-bottom: 1px solid #1a2332;">Email</td><td style="padding: 10px 12px; color: #00d4aa; font-size: 14px; border-bottom: 1px solid #1a2332;"><a href="mailto:${data.email}" style="color: #00d4aa;">${data.email}</a></td></tr>
                  <tr><td style="padding: 10px 12px; color: #888; font-size: 12px; border-bottom: 1px solid #1a2332;">Phone</td><td style="padding: 10px 12px; color: #fff; font-size: 14px; border-bottom: 1px solid #1a2332;">${data.phone || "—"}</td></tr>
                  <tr><td style="padding: 10px 12px; color: #888; font-size: 12px; border-bottom: 1px solid #1a2332;">Experience</td><td style="padding: 10px 12px; color: #fff; font-size: 14px; border-bottom: 1px solid #1a2332;">${data.tradingExp || "—"}</td></tr>
                  <tr><td style="padding: 10px 12px; color: #888; font-size: 12px;">Alert Username</td><td style="padding: 10px 12px; color: #fff; font-size: 14px;">${data.ntfyTopic || "—"}</td></tr>
                </table>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1a2332;">
                  <p style="color: #333; font-size: 10px; margin: 0;">PRIMAL EDGE · Adaptive Intelligence · Decisive Signals</p>
                </div>
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
    }

    console.log("Subscribe results:", results);

    // Success as long as ntfy delivered
    if (results.ntfy) {
      return res.status(200).json({ success: true, channels: results });
    }

    return res.status(500).json({ error: "Notification delivery failed" });
  } catch (err) {
    console.error("Subscribe API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
