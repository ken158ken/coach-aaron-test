/**
 * Vercel Serverless API Handler
 * 將所有請求轉發到 backend Express app
 *
 * @module api/server
 */

module.exports = async (req, res) => {
  try {
    // 動態載入 ES module backend
    const { default: app } = await import("../backend/dist/index.js");
    return app(req, res);
  } catch (error) {
    console.error("❌ Failed to load backend:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
