/**
 * Cloudinary 響應式圖片 URL 工具 — 前端唯一實作
 * @module lib/cloudinary
 *
 * @description
 * 全站圖片來源有三種（見 `lib/imageUrl.ts`）：Cloudinary、自家 Supabase Storage
 * 公開網址、站內相對路徑。只有 Cloudinary 支援「URL 轉換參數」做即時縮圖，
 * 因此本模組只處理 `res.cloudinary.com/.../image/upload/...` 的網址，
 * 其餘來源**原樣回傳**（呼叫端可以無差別套用，不必自己判斷來源）。
 *
 * 為什麼需要這支：原本各元件各自寫死 `f_auto,q_auto,w_900`，手機上顯示寬度
 * 只有 350~470px 卻一律下載 900px 的圖（PageSpeed「提升圖片傳送效能」約
 * 83~125KB 可省）。改成 `srcset` + `sizes` 由瀏覽器依實際版面與 DPR 挑尺寸。
 *
 * ⚠️ 純字串處理、不碰 window/document → SSR 安全。
 */

/** Cloudinary 的轉換路徑標記 */
const UPLOAD_MARKER = "/image/upload/";

/** Cloudinary 主機名 */
const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * 已知的 Cloudinary 轉換參數前綴（用來分辨「轉換段」與「公開 ID / 版本段」）。
 * 例：`f_auto,q_auto,w_900` 是轉換段；`v1773471250`、`LINE_ALBUM_x.jpg` 不是。
 */
const TRANSFORM_KEYS = new Set([
  "a", "ar", "b", "bo", "c", "co", "d", "dpr", "e", "f", "fl", "fn", "g", "h",
  "if", "l", "o", "p", "pg", "q", "r", "so", "t", "u", "vc", "w", "x", "y", "z",
]);

/** 預設 srcset 寬度梯度（原圖多為 900px 寬，再往上無意義） */
export const DEFAULT_IMAGE_WIDTHS = [480, 640, 768, 900] as const;

/** 判斷某個路徑片段是否為 Cloudinary 轉換段 */
function isTransformSegment(segment: string): boolean {
  if (!segment || segment.includes(".")) return false;
  const parts = segment.split(",");
  return parts.every((part) => {
    const at = part.indexOf("_");
    if (at <= 0) return false;
    return TRANSFORM_KEYS.has(part.slice(0, at).toLowerCase());
  });
}

/** 是否為可做即時轉換的 Cloudinary upload 網址 */
export function isTransformableCloudinaryUrl(url: string): boolean {
  return (
    typeof url === "string" &&
    url.includes(CLOUDINARY_HOST) &&
    url.includes(UPLOAD_MARKER)
  );
}

export interface CloudinaryUrlOptions {
  /** 目標寬度（px）。省略則只補 `f_auto,q_auto` 不限寬 */
  w?: number;
}

/**
 * 產生指定寬度的 Cloudinary 網址。
 *
 * - 非 Cloudinary（Supabase Storage／站內相對路徑／外站）→ 原樣回傳
 * - 網址尚無轉換段 → 插入 `f_auto,q_auto,w_{w}`
 * - 已有轉換段且含 `w_` → **替換**該寬度（舊的寫死 `w_900` 可被縮小）
 * - 已有轉換段但無 `w_` → 把 `w_{w}` 併進該轉換段
 *
 * @example
 * cloudinaryUrl("https://res.cloudinary.com/x/image/upload/v1/a.jpg", { w: 480 })
 * // → ".../image/upload/f_auto,q_auto,w_480/v1/a.jpg"
 */
export function cloudinaryUrl(
  url: string,
  options: CloudinaryUrlOptions = {},
): string {
  if (!isTransformableCloudinaryUrl(url)) return url;

  const at = url.indexOf(UPLOAD_MARKER);
  const head = url.slice(0, at + UPLOAD_MARKER.length);
  const rest = url.slice(at + UPLOAD_MARKER.length);
  const slash = rest.indexOf("/");
  const first = slash === -1 ? rest : rest.slice(0, slash);
  const tail = slash === -1 ? "" : rest.slice(slash + 1);

  const { w } = options;
  const widthPart = typeof w === "number" && w > 0 ? `w_${Math.round(w)}` : null;

  // 尚無轉換段：整段插入
  if (!isTransformSegment(first)) {
    const params = widthPart ? `f_auto,q_auto,${widthPart}` : "f_auto,q_auto";
    return `${head}${params}/${rest}`;
  }

  // 已有轉換段：只動寬度，其餘參數（裁切/重力等）照舊保留
  if (!widthPart) return url;
  const parts = first.split(",");
  const idx = parts.findIndex((p) => p.toLowerCase().startsWith("w_"));
  if (idx === -1) {
    parts.push(widthPart);
  } else {
    parts[idx] = widthPart;
  }
  return `${head}${parts.join(",")}/${tail}`;
}

/**
 * 產生 `srcset` 字串（`url 480w, url 640w, ...`）。
 * 非 Cloudinary 網址回空字串 — 呼叫端用 `srcSet={... || undefined}` 即可，
 * React 不會輸出 undefined 屬性。
 */
export function cloudinarySrcSet(
  url: string,
  widths: readonly number[] = DEFAULT_IMAGE_WIDTHS,
): string {
  if (!isTransformableCloudinaryUrl(url)) return "";
  return widths
    .map((w) => `${cloudinaryUrl(url, { w })} ${w}w`)
    .join(", ");
}
