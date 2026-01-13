/**
 * 認證中介軟體
 *
 * 提供三種認證方式：
 * 1. authenticateToken - 需登入
 * 2. requireAdmin - 需管理員權限
 * 3. optionalAuth - 可選認證
 */

const jwt = require("jsonwebtoken");
const { supabaseAdmin } = require("../config/supabase");

/**
 * 驗證 JWT Token
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "未登入" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({ error: "伺服器配置錯誤" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Token 無效或已過期" });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "認證失敗" });
  }
};

// 驗證管理員權限
const requireAdmin = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: "未登入" });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_whitelist")
      .select("*")
      .eq("email", userEmail)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: "無管理員權限" });
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

// 可選認證 - 有登入就解析，沒有也繼續
const optionalAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

module.exports = { authenticateToken, requireAdmin, optionalAuth };
