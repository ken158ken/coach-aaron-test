/**
 * Loom 影片相關 utility
 * @module utils/loom
 *
 * - URL 解析（share / embed / 含 query 的形式都接）
 * - VTT / SRT 轉成結構化逐字稿 JSON
 * - 嘗試從 Loom CDN 抓 transcript（best-effort，失敗時回 null
 *   讓 admin 自行貼）
 */

export interface TranscriptEntry {
  /** 起始秒數（含小數） */
  start: number;
  /** 結束秒數 */
  end: number;
  /** 字幕文字 */
  text: string;
}

/**
 * 從 Loom URL 解析出 video id
 *
 * 支援的格式：
 *   https://www.loom.com/share/<id>
 *   https://www.loom.com/share/<id>?sid=...
 *   https://www.loom.com/embed/<id>
 *   https://loom.com/share/<id>
 *
 * 直接給 32 字元的 id 也接受
 */
export function extractLoomId(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim();

  // 直接給的 id（32 char hex）
  if (/^[a-f0-9]{32}$/i.test(cleaned)) return cleaned.toLowerCase();

  const m = cleaned.match(
    /loom\.com\/(?:share|embed)\/([a-f0-9]{32})(?:[/?#]|$)/i,
  );
  return m ? m[1].toLowerCase() : null;
}

/** 把 Loom id 變成可以直接塞 iframe 的 embed URL */
export function loomEmbedUrl(loomId: string): string {
  return `https://www.loom.com/embed/${loomId}`;
}

/**
 * VTT / SRT 轉 TranscriptEntry[]
 *
 * 兩種常見輸入：
 *
 * VTT：
 *   WEBVTT
 *
 *   00:00:01.500 --> 00:00:03.200
 *   今天要分享的是
 *
 *   00:00:03.200 --> 00:00:05.800
 *   一套心理學導向...
 *
 * SRT：
 *   1
 *   00:00:01,500 --> 00:00:03,200
 *   今天要分享的是
 *
 *   2
 *   00:00:03,200 --> 00:00:05,800
 *   一套心理學導向...
 */
export function parseTranscript(raw: string): TranscriptEntry[] {
  if (!raw || typeof raw !== "string") return [];

  // 把 SRT 的逗號小數點先換成 VTT 風格的點，後面 regex 統一吃
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/^﻿/, "") // BOM
    .trim();

  const blocks = normalized.split(/\n{2,}/);
  const entries: TranscriptEntry[] = [];

  const tsRegex =
    /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s+-->\s+(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/;

  for (const block of blocks) {
    if (!block.trim()) continue;
    if (block.trim().toUpperCase() === "WEBVTT") continue;
    // SRT 的純編號行 / VTT 的 cue identifier 行先濾掉
    const lines = block.split("\n").filter((l) => !/^\d+\s*$/.test(l.trim()));

    let timestampLine = "";
    const textLines: string[] = [];
    for (const line of lines) {
      if (!timestampLine && tsRegex.test(line)) {
        timestampLine = line;
      } else if (timestampLine) {
        textLines.push(line);
      }
    }
    if (!timestampLine) continue;

    const m = timestampLine.match(tsRegex);
    if (!m) continue;

    const start =
      Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) +
      Number(m[4]) / Math.pow(10, m[4].length);
    const end =
      Number(m[5]) * 3600 + Number(m[6]) * 60 + Number(m[7]) +
      Number(m[8]) / Math.pow(10, m[8].length);
    const text = textLines.join(" ").replace(/\s+/g, " ").trim();
    if (!text) continue;

    entries.push({ start, end, text });
  }

  return entries;
}

/**
 * Loom oEmbed metadata（透過官方 oEmbed API 抓 thumbnail / 標題等）
 *
 * 文件：https://dev.loom.com/docs/oembed
 *
 * 比硬猜 CDN 路徑可靠多了：
 * - cdn.loom.com/sessions/thumbnails/{id}-with-play.gif 對某些影片會 404
 * - oEmbed 會回真正可用的 thumbnail_url（含 timestamp 部分）
 */
export interface LoomMetadata {
  title?: string;
  thumbnailUrl?: string;
  authorName?: string;
  width?: number;
  height?: number;
  durationSeconds?: number; // oEmbed 不一定會回，但保留接口給未來擴充
}

export async function fetchLoomMetadata(
  loomUrl: string,
): Promise<LoomMetadata | null> {
  if (!loomUrl) return null;
  try {
    const apiUrl = `https://www.loom.com/v1/oembed?format=json&url=${encodeURIComponent(loomUrl)}`;
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      title: typeof data.title === "string" ? data.title : undefined,
      thumbnailUrl:
        typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined,
      authorName:
        typeof data.author_name === "string" ? data.author_name : undefined,
      width: typeof data.width === "number" ? data.width : undefined,
      height: typeof data.height === "number" ? data.height : undefined,
      durationSeconds:
        typeof data.duration === "number" ? data.duration : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 嘗試從 Loom 抓 transcript
 *
 * Loom 有好幾個未公開的 transcript endpoint，會隨時間變動，
 * 失敗就回 null，不擋整個流程；Admin 可以自己貼 VTT/SRT。
 */
export async function fetchLoomTranscript(
  loomId: string,
): Promise<TranscriptEntry[] | null> {
  if (!loomId) return null;

  // 已知的幾個試錯端點（依優先序）
  const candidates = [
    `https://www.loom.com/api/captions/${loomId}/transcript.vtt`,
    `https://cdn.loom.com/sessions/captions/${loomId}.vtt`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "text/vtt, text/plain, */*" },
        // 短 timeout 避免擋
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseTranscript(text);
      if (parsed.length > 0) return parsed;
    } catch {
      // 換下一個
    }
  }
  return null;
}
