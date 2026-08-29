/**
 * @fileoverview 聯絡表單路由 - 透過 Resend API 發送郵件
 * @module routes/contact
 *
 * @description
 * 處理聯絡表單提交，將訪客訊息透過 Resend 發送郵件給教練。
 * 實施多層輸入驗證與消毒機制，防止 XSS、注入攻擊。
 *
 * @security
 * - Rate Limiting（每 IP 每 15 分鐘最多 5 次）
 * - 輸入長度限制
 * - HTML/Script 標籤過濾
 * - Email 格式驗證
 */

import express, { Request, Response, Router } from "express";
import { logger } from "../utils/logger.js";
import rateLimit from "express-rate-limit";

const router: Router = express.Router();

// ===== Rate Limiter（聯絡表單專用，較嚴格） =====
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 5, // 每 IP 最多 5 次
  message: { error: "送出次數過多，請 15 分鐘後再試" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== 輸入消毒工具 =====

/**
 * 移除 HTML 標籤與危險字元
 *
 * @param input - 原始輸入字串
 * @returns 消毒後的安全字串
 */
function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // 移除 HTML 標籤
    .replace(/javascript:/gi, "") // 移除 javascript: 協議
    .replace(/on\w+\s*=/gi, "") // 移除事件處理器 (onclick=, onerror= 等)
    .replace(/data:/gi, "") // 移除 data: URI
    .replace(/vbscript:/gi, "") // 移除 vbscript: 協議
    .trim();
}

/**
 * 驗證 Email 格式
 *
 * @param email - 電子郵件地址
 * @returns 是否為有效格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * 驗證電話格式（選填欄位）
 *
 * @param phone - 電話號碼
 * @returns 是否為有效格式
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return true; // 選填
  const phoneRegex = /^[0-9+\-() ]{7,20}$/;
  return phoneRegex.test(phone);
}

// ===== 聯絡表單提交 =====

/**
 * 處理聯絡表單提交
 * @route POST /api/contact
 *
 * @description
 * 接收訪客訊息，消毒後透過 Resend API 發送郵件給教練。
 * 使用 Resend 免費方案的 onboarding@resend.dev 作為寄件者。
 */
router.post(
  "/",
  contactLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, subject, message } = req.body;

      // ===== 1. 必填欄位檢查 =====
      if (!name || !email || !subject || !message) {
        res.status(400).json({ error: "請填寫所有必填欄位" });
        return;
      }

      // ===== 2. 輸入消毒 =====
      const sanitized = {
        name: sanitizeString(String(name)).slice(0, 50),
        email: sanitizeString(String(email)).slice(0, 254),
        phone: phone ? sanitizeString(String(phone)).slice(0, 20) : "",
        subject: sanitizeString(String(subject)).slice(0, 100),
        message: sanitizeString(String(message)).slice(0, 2000),
      };

      // ===== 3. 格式驗證 =====
      if (sanitized.name.length < 2) {
        res.status(400).json({ error: "姓名至少 2 個字" });
        return;
      }

      if (!isValidEmail(sanitized.email)) {
        res.status(400).json({ error: "Email 格式不正確" });
        return;
      }

      if (!isValidPhone(sanitized.phone)) {
        res.status(400).json({ error: "電話格式不正確" });
        return;
      }

      if (sanitized.subject.length < 2) {
        res.status(400).json({ error: "主旨至少 2 個字" });
        return;
      }

      if (sanitized.message.length < 10) {
        res.status(400).json({ error: "訊息至少 10 個字" });
        return;
      }

      // ===== 4. 檢查環境變數 =====
      const resendApiKey = process.env.RESEND_API_KEY;
      const coachEmail = process.env.COACH_EMAIL || "s330221@gmail.com";

      if (!resendApiKey) {
        logger.error("RESEND_API_KEY 未設定");
        res.status(500).json({ error: "郵件服務未設定，請稍後再試" });
        return;
      }

      // ===== 5. 組裝郵件 HTML =====
      // 郵件內的圖片必須是絕對 URL，且多數郵件客戶端不支援 SVG，
      // 因此用點陣圖 /logo/logo-email.png（400×125，白底，2x 供高解析螢幕）。
      const siteUrl = (
        process.env.SITE_URL || "https://coach-aaron-test.vercel.app"
      ).replace(/\/+$/, "");

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; padding: 30px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #d4af37;">
            <!-- logo 為白底圖，外層給一塊白色底片，讓它在深色卡片上看起來是刻意的品牌帶 -->
            <div style="display: inline-block; background: #ffffff; border-radius: 8px; padding: 14px 20px; margin-bottom: 18px;">
              <img
                src="${siteUrl}/logo/logo-email.png"
                alt="阿倫教官 Coach Aaron"
                width="200"
                style="display: block; width: 200px; max-width: 100%; height: auto; border: 0;"
              />
            </div>
            <h1 style="color: #d4af37; font-size: 22px; margin: 0;">📩 網站聯絡表單 - 新訊息</h1>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 12px; color: #d4af37; font-weight: bold; width: 80px; vertical-align: top;">姓名</td>
              <td style="padding: 10px 12px; color: #eee;">${sanitized.name}</td>
            </tr>
            <tr style="background: rgba(255,255,255,0.05);">
              <td style="padding: 10px 12px; color: #d4af37; font-weight: bold; vertical-align: top;">Email</td>
              <td style="padding: 10px 12px; color: #eee;"><a href="mailto:${sanitized.email}" style="color: #87ceeb;">${sanitized.email}</a></td>
            </tr>
            ${
              sanitized.phone
                ? `<tr>
              <td style="padding: 10px 12px; color: #d4af37; font-weight: bold; vertical-align: top;">電話</td>
              <td style="padding: 10px 12px; color: #eee;">${sanitized.phone}</td>
            </tr>`
                : ""
            }
            <tr style="background: rgba(255,255,255,0.05);">
              <td style="padding: 10px 12px; color: #d4af37; font-weight: bold; vertical-align: top;">主旨</td>
              <td style="padding: 10px 12px; color: #eee;">${sanitized.subject}</td>
            </tr>
          </table>

          <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #d4af37; font-weight: bold; margin: 0 0 8px 0;">訊息內容</p>
            <p style="color: #eee; line-height: 1.6; margin: 0; white-space: pre-wrap;">${sanitized.message}</p>
          </div>

          <div style="text-align: center; color: #888; font-size: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
            <p>此郵件由 Coach Aaron 網站自動發送</p>
            <p>發送時間: ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</p>
          </div>
        </div>
      `;

      // ===== 6. 透過 Resend API 發送郵件 =====
      logger.info("發送聯絡表單郵件", {
        from: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
      });

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Coach Aaron 網站 <onboarding@resend.dev>",
          to: [coachEmail],
          reply_to: sanitized.email,
          subject: `[網站聯絡] ${sanitized.subject} - from ${sanitized.name}`,
          html: htmlContent,
        }),
      });

      const resendResult = await resendResponse.json();

      if (!resendResponse.ok) {
        logger.error("Resend API 錯誤", {
          status: resendResponse.status,
          error: resendResult,
        });
        res.status(500).json({ error: "郵件發送失敗，請稍後再試" });
        return;
      }

      logger.info("聯絡郵件發送成功", {
        resendId: resendResult.id,
        to: coachEmail,
      });

      res.json({
        success: true,
        message: "訊息已送出，教練會盡快回覆您！",
      });
    } catch (err) {
      logger.error("聯絡表單處理錯誤", err as Error);
      res.status(500).json({ error: "處理失敗，請稍後再試" });
    }
  },
);

export default router;
