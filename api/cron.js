/**
 * Vercel Cron Job - Keep Supabase Alive
 * 每天 0:00 和 12:00 (UTC+8) 各執行一次
 * 透過 Supabase REST API 查詢一筆資料，防止免費方案因不活躍被暫停
 */

module.exports = async function handler(req, res) {
  // 驗證是 Vercel Cron 呼叫
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("⚠️ [Cron] Unauthorized request");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?select=user_id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [Cron] Supabase responded ${response.status}: ${text}`);
      res.status(500).json({ error: `Supabase ${response.status}` });
      return;
    }

    const data = await response.json();
    const now = new Date().toISOString();
    console.log(`✅ [Cron] Keep-alive ping OK at ${now}, rows: ${data.length}`);
    res.status(200).json({ ok: true, timestamp: now });
  } catch (err) {
    console.error("❌ [Cron] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
