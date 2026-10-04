/**
 * @fileoverview AEO/GEO 來源流量量測
 *
 * `POST /api/track/pageview`（公開、無需登入）：前端每次換頁打一次，
 * 後端只記「站內路徑 + referrer 的 host + 來源分類 + 語言」。
 *
 * 隱私：**不設 cookie、不存 IP、不存 User-Agent、不存 referrer 的路徑/查詢字串**，
 * 也不做跨站追蹤 —— 所以沒有個資（見 database/migrations/041 檔頭與隱私權政策）。
 *
 * `GET /api/admin/traffic/summary`（requireAdmin）：彙總最近 N 天（≤ 90）。
 * PostgREST 不做 group by，所以撈回 rows 在 Node 彙總（有分頁與硬上限）。
 *
 * 容錯：041 還沒貼（traffic_events 不存在）時 →
 *   - pageview 靜默回 204（絕不讓前端看到錯誤、也不重試）
 *   - summary 回空彙總 + `migrationPending: true`
 *
 * @module routes/track
 */

import express, { Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { toZonedTime } from "date-fns-tz/toZonedTime";
import { format } from "date-fns/format";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { classifyReferrer, type SourceClass } from "../utils/trafficSource.js";
import { isUndefinedTable } from "../utils/selectWithFallback.js";

const router: Router = express.Router();

const TAIPEI = "Asia/Taipei";

/** 單一 IP 每分鐘最多 60 次（獨立計數，不吃全域 apiLimiter 的額度） */
const pageviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: false,
  legacyHeaders: false,
  // 超量就安靜丟掉，不要讓前端看到 429 而重試
  handler: (_req: Request, res: Response) => {
    res.status(204).end();
  },
});

const MAX_PATH = 300;
const MAX_REFERRER = 2000;
const MAX_LANG = 10;

/**
 * 記錄一次頁面瀏覽
 * @route POST /api/track/pageview
 */
router.post(
  "/pageview",
  pageviewLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body = (req.body || {}) as {
        path?: unknown;
        referrer?: unknown;
        lang?: unknown;
      };

      // ── 驗證（任何不合格都安靜回 204，不給攻擊者回饋，也不吵前端） ──
      if (typeof body.path !== "string") {
        res.status(204).end();
        return;
      }
      const path = body.path.trim();
      if (!path.startsWith("/") || path.length > MAX_PATH) {
        res.status(204).end();
        return;
      }

      const referrerRaw =
        typeof body.referrer === "string" && body.referrer.length <= MAX_REFERRER
          ? body.referrer
          : "";

      const lang =
        typeof body.lang === "string" && body.lang.trim()
          ? body.lang.trim().slice(0, MAX_LANG)
          : null;

      // referrer 只取 host（丟掉路徑/查詢），分類交給純函式
      const { host, sourceClass } = classifyReferrer(referrerRaw);

      const { error } = await supabaseAdmin.from("traffic_events").insert({
        day: format(toZonedTime(new Date(), TAIPEI), "yyyy-MM-dd"),
        path,
        referrer_host: host,
        source_class: sourceClass,
        lang,
      });

      // 表還沒建（041 未貼）→ 當作沒這回事，不噴錯、不留 error log 洗 quota
      if (error && !isUndefinedTable(error)) {
        logger.warn("traffic_events 寫入失敗", {
          code: error.code,
          message: error.message,
        });
      }

      res.status(204).end();
    } catch (err) {
      // 量測永遠不該讓使用者看到錯誤
      logger.warn("pageview 記錄異常", {
        message: (err as Error)?.message,
      });
      res.status(204).end();
    }
  },
);

// ===== 後台彙總（掛在 /api/admin） =====

/** 一次最多撈幾列（PostgREST 單次上限 1000，分頁到 20000 列為止） */
const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

interface TrafficRow {
  day: string;
  path: string;
  referrer_host: string | null;
  source_class: SourceClass;
}

function topN(
  counter: Map<string, number>,
  key: "source_class" | "referrer_host" | "path",
  n: number,
): Array<Record<string, string | number>> {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ [key]: value, count }));
}

export const trafficAdminRouter: Router = express.Router();

/**
 * 來源流量彙總
 * @route GET /api/admin/traffic/summary?days=30
 */
trafficAdminRouter.get(
  "/traffic/summary",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requested = Number(req.query.days);
      const days =
        Number.isFinite(requested) && requested >= 1
          ? Math.min(Math.floor(requested), 90)
          : 30;

      // 起始日（含當天）以 Asia/Taipei 計算
      const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      const startDay = format(toZonedTime(start, TAIPEI), "yyyy-MM-dd");

      const rows: TrafficRow[] = [];
      let truncated = false;

      for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
        const { data, error } = await supabaseAdmin
          .from("traffic_events")
          .select("day, path, referrer_host, source_class")
          .gte("day", startDay)
          .order("id", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          // 041 未貼 → 回空彙總而不是 500，後台頁面照常顯示
          if (isUndefinedTable(error)) {
            res.json({
              days,
              total: 0,
              bySource: [],
              byReferrer: [],
              byPath: [],
              daily: [],
              migrationPending: true,
            });
            return;
          }
          throw error;
        }

        const batch = (data || []) as unknown as TrafficRow[];
        rows.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        if (rows.length >= MAX_ROWS) {
          truncated = true;
          break;
        }
      }

      const bySource = new Map<string, number>();
      const byReferrer = new Map<string, number>();
      const byPath = new Map<string, number>();
      const daily = new Map<string, number>();

      for (const row of rows) {
        bySource.set(row.source_class, (bySource.get(row.source_class) || 0) + 1);
        byPath.set(row.path, (byPath.get(row.path) || 0) + 1);
        daily.set(row.day, (daily.get(row.day) || 0) + 1);
        if (row.referrer_host) {
          byReferrer.set(
            row.referrer_host,
            (byReferrer.get(row.referrer_host) || 0) + 1,
          );
        }
      }

      res.json({
        days,
        total: rows.length,
        bySource: topN(bySource, "source_class", 10),
        byReferrer: topN(byReferrer, "referrer_host", 20),
        byPath: topN(byPath, "path", 20),
        daily: [...daily.entries()]
          .sort((a, b) => (a[0] < b[0] ? -1 : 1))
          .map(([day, count]) => ({ day, count })),
        truncated,
      });
    } catch (err) {
      logger.error("取得流量彙總失敗", err as Error);
      res.status(500).json({ error: "取得流量彙總失敗" });
    }
  },
);

export default router;
