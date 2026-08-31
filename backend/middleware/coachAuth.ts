/**
 * 教練身份驗證中介軟體
 *
 * 三種 guard：
 *   - requireCoach         — 只有 coach_profile.user_id 本人
 *   - requireCoachOrAdmin  — coach 本人 OR admin_whitelist 成員（開發期用）
 *
 * 並在通過時把 req.coach = { id, userId } 塞進去，route 後續直接用。
 *
 * @module middleware/coachAuth
 */

import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase.js";

declare global {
  namespace Express {
    interface Request {
      coach?: { id: number; userId: number };
    }
  }
}

/** 找出目前啟用的 coach_profile（MVP：只有一筆） */
export async function getActiveCoach(): Promise<{
  id: number;
  userId: number;
} | null> {
  const { data, error } = await supabaseAdmin
    .from("coach_profile")
    .select("id, user_id")
    .eq("is_active", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, userId: data.user_id };
}

/** 取呼叫者的 email（從 JWT），失敗回 null */
function getRequesterEmail(req: Request): string | null {
  return req.user?.email || null;
}

/** 檢查該 email 是否為 admin（notes 等模組的混合權限判斷也重用） */
export async function isAdminEmail(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_whitelist")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

/**
 * 只允許教練本人
 */
export const requireCoach = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "未登入" });
      return;
    }
    const coach = await getActiveCoach();
    if (!coach) {
      res.status(404).json({ error: "尚未設定教練" });
      return;
    }
    if (Number(coach.userId) !== Number(userId)) {
      res.status(403).json({ error: "僅教練本人可執行此操作" });
      return;
    }
    req.coach = coach;
    next();
  } catch (err) {
    console.error("requireCoach error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * 允許教練本人 OR admin（開發期用）
 */
export const requireCoachOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const email = getRequesterEmail(req);
    if (!userId || !email) {
      res.status(401).json({ error: "未登入" });
      return;
    }
    const coach = await getActiveCoach();
    if (!coach) {
      res.status(404).json({ error: "尚未設定教練" });
      return;
    }
    const isCoachSelf = Number(coach.userId) === Number(userId);
    const isAdmin = isCoachSelf ? true : await isAdminEmail(email);
    if (!isCoachSelf && !isAdmin) {
      res.status(403).json({ error: "無權限" });
      return;
    }
    req.coach = coach;
    req.isAdmin = isAdmin;
    next();
  } catch (err) {
    console.error("requireCoachOrAdmin error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};
