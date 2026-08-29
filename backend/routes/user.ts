/**
 * @fileoverview 使用者相關路由
 * 處理用戶資料、購買課程、頭像上傳等功能
 */

import express, { Request, Response, Router } from "express";
import sharp from "sharp";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { logSecurityEvent } from "../utils/sanitizer.js";

const router: Router = express.Router();

/** 頭像設定常數 */
const AVATAR_CONFIG = {
  /** 輸出尺寸 (px) */
  SIZE: 200,
  /** JPEG 畫質 (1-100) */
  QUALITY: 60,
  /** 最大上傳大小 (bytes) — 5MB */
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024,
} as const;

/**
 * 取得用戶已購買的課程列表
 * @route GET /api/user/courses
 */
router.get(
  "/courses",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("user_courses")
        .select(
          `
          *,
          course:course_id (
            course_id,
            course_title,
            course_slug,
            course_thumbnail_url,
            course_description
          )
        `,
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("access_granted_at", { ascending: false });

      if (error) throw error;

      res.json(data || []);
    } catch (err) {
      console.error("Get user courses error:", err);
      res.status(500).json({ error: "取得購買課程失敗" });
    }
  },
);

/**
 * 檢查用戶是否已購買指定課程
 * @route GET /api/user/courses/:courseId/access
 */
router.get(
  "/courses/:courseId/access",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      // 檢查是否為管理員
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (adminCheck) {
        res.json({ hasAccess: true, isAdmin: true });
        return;
      }

      // 檢查是否已購買
      const { data: userCourse } = await supabaseAdmin
        .from("user_courses")
        .select("user_course_id, is_active, access_expires_at")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      if (!userCourse) {
        res.json({ hasAccess: false });
        return;
      }

      // 檢查是否過期
      const isExpired =
        userCourse.access_expires_at &&
        new Date(userCourse.access_expires_at) < new Date();

      res.json({
        hasAccess: userCourse.is_active && !isExpired,
        isExpired,
      });
    } catch (err) {
      console.error("Check course access error:", err);
      res.status(500).json({ error: "檢查課程權限失敗" });
    }
  },
);

/**
 * 取得用戶個人資料
 * @route GET /api/user/profile
 */
router.get(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .select(
          "user_id, username, email, display_name, phone_number, avatar_url, avatar_base64, created_at",
        )
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        res.status(404).json({ error: "用戶不存在" });
        return;
      }

      res.json(data);
    } catch (err) {
      console.error("Get user profile error:", err);
      res.status(500).json({ error: "取得個人資料失敗" });
    }
  },
);

/** 顯示名稱限制 */
const DISPLAY_NAME_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 30,
  /** 只允許中英文、數字、常見標點、空格、常見 emoji */
  PATTERN: /^[\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}\s._\-]+$/u,
} as const;

/**
 * 更新用戶個人資料
 * 包含完整的輸入消毒與驗證
 *
 * @route PUT /api/user/profile
 * @body {string} [displayName] - 顯示名稱（1-30 字元，禁止 HTML/SQL/特殊字元）
 * @body {string} [phoneNumber] - 手機號碼（09xxxxxxxx）
 * @body {string} [gender] - 性別（male/female/other/prefer_not_to_say）
 */
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawUserId = (req as any).user?.userId;
      // 確保 userId 為數字（JWT payload 可能存為字串）
      const userId =
        typeof rawUserId === "string" ? parseInt(rawUserId, 10) : rawUserId;
      console.log(
        `[User] PUT /profile — rawUserId=${rawUserId}(${typeof rawUserId}), userId=${userId}, body keys=${Object.keys(req.body).join(",")}`,
      );
      if (!userId || isNaN(userId)) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { displayName, phoneNumber } = req.body;

      // 僅允許白名單欄位，拒絕未知欄位
      const allowedFields = ["displayName", "phoneNumber"];
      const unknownFields = Object.keys(req.body).filter(
        (k) => !allowedFields.includes(k),
      );
      if (unknownFields.length > 0) {
        logSecurityEvent("unknown_profile_fields", {
          userId,
          fields: unknownFields,
        });
        // 静默忽略未知欄位，不報錯
      }

      const updateData: Record<string, unknown> = {};
      const errors: string[] = [];

      // ── 顯示名稱消毒 ──
      if (displayName !== undefined) {
        if (typeof displayName !== "string") {
          errors.push("顯示名稱必須是文字");
        } else {
          // 基礎清理：移除控制字元、HTML 標籤、前後空白
          let cleaned = displayName
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
            .replace(/<[^>]*>/g, "")
            .trim();

          // 合併連續空白
          cleaned = cleaned.replace(/\s+/g, " ");

          // 長度驗證
          if (
            cleaned.length < DISPLAY_NAME_LIMITS.MIN_LENGTH ||
            cleaned.length > DISPLAY_NAME_LIMITS.MAX_LENGTH
          ) {
            errors.push(
              `顯示名稱長度需為 ${DISPLAY_NAME_LIMITS.MIN_LENGTH}-${DISPLAY_NAME_LIMITS.MAX_LENGTH} 字元`,
            );
          } else {
            // 手動檢查關鍵注入模式
            const criticalPatterns = [
              /<script/i,
              /javascript:/i,
              /on\w+\s*=/i,
              /<iframe/i,
              /\bunion\b\s+\bselect\b/i,
            ];
            const hasCriticalThreat = criticalPatterns.some((p) =>
              p.test(cleaned),
            );

            if (hasCriticalThreat) {
              logSecurityEvent("display_name_injection_attempt", {
                userId,
                input: cleaned.substring(0, 100),
              });
              errors.push("顯示名稱包含不允許的內容");
            } else {
              // 白名單字元驗證（包在 try-catch 防止 regex 異常）
              let patternValid = true;
              try {
                patternValid = DISPLAY_NAME_LIMITS.PATTERN.test(cleaned);
              } catch (regexErr) {
                console.error(
                  "[User] DISPLAY_NAME PATTERN regex error:",
                  regexErr,
                );
                // regex 失敗時使用簡單 fallback 驗證
                patternValid = /^[\w\s._\-\u4e00-\u9fff\u3400-\u4dbf]+$/.test(
                  cleaned,
                );
              }
              if (!patternValid) {
                errors.push("顯示名稱只能包含中英文、數字、空格和常見標點");
              } else {
                updateData.display_name = cleaned;
              }
            }
          }
        }
      }

      // ── 電話消毒 ──
      if (phoneNumber !== undefined) {
        if (typeof phoneNumber !== "string") {
          errors.push("電話必須是文字");
        } else if (phoneNumber.trim() === "") {
          // 允許清空
          updateData.phone_number = null;
        } else {
          const cleaned = phoneNumber.replace(/[\s\-]/g, "");
          if (!/^09\d{8}$/.test(cleaned)) {
            errors.push("電話格式不正確，請輸入 09 開頭的10位數字");
          } else {
            updateData.phone_number = cleaned;
          }
        }
      }

      // 如果有驗證錯誤，回傳所有錯誤
      if (errors.length > 0) {
        res.status(400).json({ error: errors.join("；") });
        return;
      }

      // 沒有任何欄位要更新
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: "請提供要更新的欄位" });
        return;
      }

      // 加上更新時間
      updateData.updated_at = new Date().toISOString();

      console.log(
        `[User] Updating profile for userId=${userId}:`,
        JSON.stringify(updateData),
      );

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("user_id", userId)
        .select(
          "user_id, username, email, display_name, phone_number, avatar_url",
        )
        .maybeSingle();

      if (error) {
        console.error(`[User] Supabase update error:`, error);
        throw error;
      }

      if (!data) {
        console.error(`[User] userId=${userId} 查無此用戶`);
        res.status(404).json({ error: "用戶不存在" });
        return;
      }

      console.log(`[User] 使用者 ${userId} 個人資料更新成功`);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Update user profile error:", errMsg, err);
      // 回傳詳細錯誤以便除錯（含 Supabase 錯誤碼）
      const supaErr = err as {
        code?: string;
        details?: string;
        hint?: string;
        message?: string;
      };
      res.status(500).json({
        error: "更新個人資料失敗",
        detail: supaErr?.message || errMsg,
        code: supaErr?.code,
        hint: supaErr?.hint,
      });
    }
  },
);

/**
 * 上傳/更新使用者頭像
 * 支援兩種模式：
 *   - type="upload"（預設）：原始圖片 → sharp 裁剪圓形 → 壓縮 → 存入 DB
 *   - type="generated"：前端已裁切/生成的圖片 → sharp 縮放壓縮 → 存入 DB
 *
 * @route POST /api/user/avatar
 * @body {string} image - base64 編碼的圖片資料
 * @body {string} [type="upload"] - "upload" | "generated"
 */
router.post(
  "/avatar",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { image, type = "upload" } = req.body;
      if (!image || typeof image !== "string") {
        res.status(400).json({ error: "請提供圖片資料" });
        return;
      }

      // 移除 data URI prefix（如 "data:image/png;base64,"）
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      // 檢查大小
      if (imageBuffer.length > AVATAR_CONFIG.MAX_UPLOAD_SIZE) {
        res.status(400).json({ error: "圖片大小不可超過 5MB" });
        return;
      }

      const circleSize = AVATAR_CONFIG.SIZE;
      let processedBuffer: Buffer;

      if (type === "generated") {
        // 前端已裁切 / DiceBear / Boring Avatars 生成的圖片
        // 只做縮放 + 壓縮，不再做中央裁剪
        console.log(`[User] 使用者 ${userId} 使用生成式頭像`);
        processedBuffer = await sharp(imageBuffer)
          .resize(circleSize, circleSize, { fit: "cover" })
          .png({ quality: AVATAR_CONFIG.QUALITY, compressionLevel: 8 })
          .toBuffer();
      } else {
        // 原始上傳圖片：中央裁剪正方形 → 縮放 → 圓形遮罩 → 壓縮
        const metadata = await sharp(imageBuffer).metadata();
        const minDim = Math.min(metadata.width || 200, metadata.height || 200);

        const circleMask = Buffer.from(
          `<svg width="${circleSize}" height="${circleSize}">
            <circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${circleSize / 2}" fill="white"/>
          </svg>`,
        );

        processedBuffer = await sharp(imageBuffer)
          .extract({
            left: Math.floor(((metadata.width || minDim) - minDim) / 2),
            top: Math.floor(((metadata.height || minDim) - minDim) / 2),
            width: minDim,
            height: minDim,
          })
          .resize(circleSize, circleSize)
          .composite([
            {
              input: circleMask,
              blend: "dest-in",
            },
          ])
          .png({ quality: AVATAR_CONFIG.QUALITY, compressionLevel: 8 })
          .toBuffer();
      }

      // 轉為 data URI
      const avatarBase64 = `data:image/png;base64,${processedBuffer.toString("base64")}`;

      // 寫入 DB
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          avatar_base64: avatarBase64,
          avatar_url: avatarBase64,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("user_id, avatar_url, avatar_base64")
        .single();

      if (error) {
        console.error("更新頭像失敗:", error);
        throw error;
      }

      console.log(`[User] 使用者 ${userId} 頭像更新成功`);

      res.json({
        success: true,
        avatarUrl: data.avatar_base64 || data.avatar_url,
      });
    } catch (err) {
      console.error("Upload avatar error:", err);
      res.status(500).json({ error: "頭像上傳失敗" });
    }
  },
);

/**
 * 刪除使用者頭像
 *
 * @route DELETE /api/user/avatar
 */
router.delete(
  "/avatar",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          avatar_base64: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      console.log(`[User] 使用者 ${userId} 頭像已刪除`);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete avatar error:", err);
      res.status(500).json({ error: "刪除頭像失敗" });
    }
  },
);

export default router;
