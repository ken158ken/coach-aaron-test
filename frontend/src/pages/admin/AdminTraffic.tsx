/**
 * AdminTraffic — 流量來源後台
 * @module pages/admin/AdminTraffic
 * @theme luxe
 *
 * 回答一個問題：「訪客從哪來、看了什麼」。資料來自
 * `GET /api/admin/traffic/summary?days=`（services/admin/traffic.service.ts）。
 *
 * 刻意**不引入圖表套件** —— 這頁只有「佔比橫條」與「每日長條」兩種圖形，
 * 用 div + inline width/height 百分比就夠了，省掉首載 100KB 以上的 vendor
 * 分包（見專案的 CPU／bundle 止血紀錄）。寬度是純數值，用 inline style 不會
 * 與主題覆寫打架。
 *
 * 透明度白名單：luxe-gold 只用 index.css 已定義的 /5 /10 /15 /20 /25 /30
 * （border 另有 /40 /50）；`bg-luxe-bg/xx` **沒有**定義，不要用（會靜默不顯示），
 * 需要底色一律用 bg-luxe-bg / bg-luxe-surface 實色。其餘顏色走標準 Tailwind
 * 色階（violet / sky / emerald / zinc）。
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context";
import {
  trafficService,
  TRAFFIC_RANGES,
  TRAFFIC_SOURCE_CLASSES,
  type TrafficRange,
  type TrafficSourceClass,
  type TrafficSummary,
} from "@/services/admin/traffic.service";

/** 五類來源的配色（文字／底／邊框＋橫條底色） */
const SOURCE_STYLE: Record<
  TrafficSourceClass,
  { text: string; chip: string; bar: string }
> = {
  ai: {
    text: "text-violet-400",
    chip: "bg-violet-500/15 border-violet-500/30",
    bar: "bg-violet-500",
  },
  search: {
    text: "text-sky-400",
    chip: "bg-sky-500/15 border-sky-500/30",
    bar: "bg-sky-500",
  },
  social: {
    text: "text-emerald-400",
    chip: "bg-emerald-500/15 border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  direct: {
    text: "text-luxe-gold",
    chip: "bg-luxe-gold/15 border-luxe-gold/30",
    bar: "bg-luxe-gold",
  },
  other: {
    // 走 theme token 而非 zinc-400：淺色 admin 底下 zinc-400 幾乎看不見
    text: "text-luxe-muted",
    chip: "bg-zinc-500/15 border-zinc-500/30",
    bar: "bg-zinc-500",
  },
};

/** 百分比（分母為 0 時回 0，避免 NaN 進到 style） */
const share = (count: number, total: number): number =>
  total > 0 ? (count / total) * 100 : 0;

/** 佔比顯示：小於 0.1% 但不為零時不要顯示成 0.0% */
const shareLabel = (count: number, total: number): string => {
  const pct = share(count, total);
  if (pct === 0) return "0%";
  if (pct < 0.1) return "<0.1%";
  return `${pct.toFixed(1)}%`;
};

/**
 * `YYYY-MM-DD` → `MM/DD`。
 * 刻意用字串切割而非 `new Date()`：後端給的是日期字串，丟進 Date 會被當 UTC
 * 午夜解析，台灣時區顯示會整天位移（專案踩過同類的時區坑）。
 */
const shortDay = (day: string): string =>
  day.length >= 10 ? `${day.slice(5, 7)}/${day.slice(8, 10)}` : day;

const AdminTraffic: React.FC = () => {
  const { t } = useLanguage();
  const tp = t.adminTraffic;

  const [days, setDays] = useState<TrafficRange>(30);
  const [data, setData] = useState<TrafficSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(
    async (range: TrafficRange) => {
      try {
        setLoading(true);
        setError("");
        const res = await trafficService.summary(range);
        // 後端若回了半套（某個陣列缺漏）也不要整頁爆掉
        setData({
          days: res?.days ?? range,
          total: res?.total ?? 0,
          bySource: Array.isArray(res?.bySource) ? res.bySource : [],
          byReferrer: Array.isArray(res?.byReferrer) ? res.byReferrer : [],
          byPath: Array.isArray(res?.byPath) ? res.byPath : [],
          daily: Array.isArray(res?.daily) ? res.daily : [],
        });
      } catch (err) {
        console.error("[AdminTraffic] 載入流量失敗", err);
        setData(null);
        setError(tp.loadFailed);
      } finally {
        setLoading(false);
      }
    },
    [tp.loadFailed],
  );

  useEffect(() => {
    void fetchSummary(days);
  }, [days, fetchSummary]);

  const total = data?.total ?? 0;

  /** 來源分類：補齊五類（後端只回有資料的，缺的補 0 才不會卡卡的） */
  const sourceCounts = useMemo(() => {
    const map = new Map<TrafficSourceClass, number>();
    for (const row of data?.bySource ?? []) {
      map.set(row.source_class, (map.get(row.source_class) ?? 0) + row.count);
    }
    return TRAFFIC_SOURCE_CLASSES.map((cls) => ({
      cls,
      count: map.get(cls) ?? 0,
    }));
  }, [data]);

  /** 每日長條的高度基準 */
  const dailyMax = useMemo(
    () => Math.max(1, ...(data?.daily ?? []).map((d) => d.count)),
    [data],
  );

  const avgPerDay = useMemo(() => {
    const span = data?.days || days;
    if (!span) return 0;
    return Math.round((total / span) * 10) / 10;
  }, [total, data, days]);

  const isEmpty = !loading && !error && total === 0;

  return (
    <div>
      {/* 標題 + 天數切換 */}
      <div
        className="flex flex-wrap items-end justify-between gap-3 mb-5"
        data-tour="admintraffic-header"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            {tp.pageTitle}
          </h1>
          <p className="text-sm text-luxe-muted max-w-2xl">{tp.pageSubtitle}</p>
        </div>

        <div className="flex items-center gap-2" data-tour="admintraffic-range">
          {TRAFFIC_RANGES.map((range) => {
            const active = days === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                aria-pressed={active}
                className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-luxe-gold/15 text-luxe-gold border-luxe-gold/40 font-medium"
                    : "border-luxe-gold/15 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50"
                }`}
              >
                {tp.rangeDays.replace("{n}", String(range))}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void fetchSummary(days)}
            disabled={loading}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-luxe-gold/15 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 disabled:opacity-40 transition-colors"
          >
            {loading ? tp.loading : tp.refresh}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {loading && !data && (
        <p className="text-luxe-muted py-16 text-center text-sm">{tp.loading}</p>
      )}

      {isEmpty && (
        <p
          className="text-sm text-luxe-muted bg-luxe-surface border border-luxe-gold/10 rounded-2xl px-4 py-10 text-center"
          data-tour="admintraffic-empty"
        >
          {tp.empty}
        </p>
      )}

      {data && !isEmpty && (
        <div className="space-y-6">
          {/* 總數卡 */}
          <section
            className="bg-luxe-surface border border-luxe-gold/10 rounded-2xl px-5 py-4"
            data-tour="admintraffic-total"
          >
            <p className="text-xs text-luxe-muted">
              {tp.totalLabel.replace("{n}", String(data.days))}
            </p>
            <p className="text-3xl sm:text-4xl font-light text-luxe-gold mt-1">
              {total.toLocaleString()}
            </p>
            <p className="text-xs text-luxe-muted mt-1">
              {tp.totalHint} ·{" "}
              {tp.dailyAverage.replace("{n}", String(avgPerDay))}
            </p>
          </section>

          {/* 來源分類：五格 stat 卡 + 橫條 */}
          <section data-tour="admintraffic-sources">
            <h2 className="text-sm font-medium text-luxe-gold mb-3">
              {tp.sourceHeading}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {sourceCounts.map(({ cls, count }) => {
                const style = SOURCE_STYLE[cls];
                return (
                  <div
                    key={cls}
                    className={`rounded-2xl border px-4 py-3 ${style.chip}`}
                  >
                    <p className={`text-xs font-medium ${style.text}`}>
                      {tp.sourceClass[cls]}
                    </p>
                    <p className="text-2xl font-light text-luxe-text mt-1">
                      {count.toLocaleString()}
                    </p>
                    <p className="text-xs text-luxe-muted">
                      {shareLabel(count, total)}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-luxe-surface overflow-hidden">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${share(count, total)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-luxe-muted mt-2 leading-snug">
                      {tp.sourceClassHint[cls]}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Top referrer / Top path 兩張表並排 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section
              className="bg-luxe-surface border border-luxe-gold/10 rounded-2xl p-4 sm:p-5"
              data-tour="admintraffic-referrers"
            >
              <h2 className="text-sm font-medium text-luxe-gold mb-3">
                {tp.referrerHeading}
              </h2>
              {data.byReferrer.length === 0 ? (
                <p className="text-sm text-luxe-muted py-6 text-center">
                  {tp.empty}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-luxe-muted text-left">
                        <th className="font-normal pb-2">{tp.colReferrer}</th>
                        <th className="font-normal pb-2 text-right">
                          {tp.colCount}
                        </th>
                        <th className="font-normal pb-2 text-right w-20">
                          {tp.colShare}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byReferrer.slice(0, 10).map((row, i) => (
                        <tr
                          key={`${row.referrer_host ?? "direct"}-${i}`}
                          className="border-t border-luxe-gold/10"
                        >
                          <td className="py-2 pr-3 text-luxe-text break-all">
                            {row.referrer_host || tp.noReferrer}
                          </td>
                          <td className="py-2 text-right text-luxe-text tabular-nums">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-luxe-muted tabular-nums">
                            {shareLabel(row.count, total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section
              className="bg-luxe-surface border border-luxe-gold/10 rounded-2xl p-4 sm:p-5"
              data-tour="admintraffic-paths"
            >
              <h2 className="text-sm font-medium text-luxe-gold mb-3">
                {tp.pathHeading}
              </h2>
              {data.byPath.length === 0 ? (
                <p className="text-sm text-luxe-muted py-6 text-center">
                  {tp.empty}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-luxe-muted text-left">
                        <th className="font-normal pb-2">{tp.colPath}</th>
                        <th className="font-normal pb-2 text-right">
                          {tp.colCount}
                        </th>
                        <th className="font-normal pb-2 text-right w-20">
                          {tp.colShare}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byPath.slice(0, 10).map((row, i) => (
                        <tr
                          key={`${row.path}-${i}`}
                          className="border-t border-luxe-gold/10"
                        >
                          <td className="py-2 pr-3 text-luxe-text break-all">
                            {row.path}
                          </td>
                          <td className="py-2 text-right text-luxe-text tabular-nums">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-luxe-muted tabular-nums">
                            {shareLabel(row.count, total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* 每日長條（純 CSS，不引圖表套件） */}
          <section
            className="bg-luxe-surface border border-luxe-gold/10 rounded-2xl p-4 sm:p-5"
            data-tour="admintraffic-daily"
          >
            <h2 className="text-sm font-medium text-luxe-gold mb-3">
              {tp.dailyHeading}
            </h2>
            {data.daily.length === 0 ? (
              <p className="text-sm text-luxe-muted py-6 text-center">
                {tp.empty}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-[3px] h-40 min-w-full">
                  {data.daily.map((d) => (
                    <div
                      key={d.day}
                      className="flex-1 min-w-[4px] flex flex-col justify-end h-full"
                      title={tp.dailyTooltip
                        .replace("{day}", d.day)
                        .replace("{n}", String(d.count))}
                    >
                      <div
                        className="w-full rounded-t bg-luxe-gold/30"
                        style={{
                          height: `${Math.max(2, (d.count / dailyMax) * 100)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                {/* 只標首／中／末三個日期，90 天也不會擠成一團 */}
                <div className="flex justify-between text-[11px] text-luxe-muted mt-2">
                  <span>{shortDay(data.daily[0]?.day ?? "")}</span>
                  {data.daily.length > 2 && (
                    <span>
                      {shortDay(
                        data.daily[Math.floor(data.daily.length / 2)]?.day ?? "",
                      )}
                    </span>
                  )}
                  <span>
                    {shortDay(data.daily[data.daily.length - 1]?.day ?? "")}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminTraffic;
