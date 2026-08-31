/**
 * 富文本 XSS 淨化（SSR / client 同一份實作）
 *
 * 所有 dangerouslySetInnerHTML 的「動態內容」（DB 文章、課程、首頁彈窗、
 * block editor、搜尋 highlight）渲染前一律過這層。
 *
 * 用 sanitize-html（htmlparser2 解析、純 JS）而非 DOMPurify：
 * SSR build 是 noExternal 全內聯單檔（api/_ssr_bundle.cjs），
 * isomorphic-dompurify 依賴的 jsdom 打包後會在 runtime 讀不到
 * default-stylesheet.css 直接 crash（已實測），sanitize-html 無此問題，
 * 且伺服器/瀏覽器輸出一致，不會造成 hydration mismatch。
 *
 * 白名單對齊 tiptap 編輯器的實際輸出：
 * - 標題/段落/清單/表格/引用/程式碼 + img + 任務清單 checkbox
 * - <iframe>：僅 YouTube / Vimeo 的 https 嵌入（tiptap YouTube extension）
 * - style 僅放行文字排版類屬性（顏色/對齊/字級…），值禁含 url()
 * - 硬化：target="_blank" 的 <a> 強制補 rel="noopener noreferrer"
 */
import sanitize from "sanitize-html";

/** 排版用 style 值：不允許 : 與 /，即杜絕 url(...)、expression 類載體 */
const SAFE_STYLE_VALUE = [/^[#\w(),.%\s'"-]*$/];

const OPTIONS: sanitize.IOptions = {
  allowedTags: sanitize.defaults.allowedTags.concat([
    "img",
    "iframe",
    "input",
    "label",
    "details",
    "summary",
  ]),
  allowedAttributes: {
    "*": ["class", "style", "data-*"],
    a: ["href", "target", "rel", "title", "name"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: [
      "src",
      "width",
      "height",
      "title",
      "allow",
      "allowfullscreen",
      "frameborder",
    ],
    // tiptap 任務清單的核取方塊
    input: ["type", "checked", "disabled"],
    td: ["colspan", "rowspan", "colwidth"],
    th: ["colspan", "rowspan", "colwidth"],
  },
  allowedStyles: {
    "*": {
      color: SAFE_STYLE_VALUE,
      "background-color": SAFE_STYLE_VALUE,
      "text-align": [/^(left|right|center|justify)$/],
      "font-family": SAFE_STYLE_VALUE,
      "font-size": [/^[\d.]+(px|em|rem|%)$/],
      "line-height": [/^[\d.]+(px|em|rem|%)?$/],
      width: [/^[\d.]+(px|%)$/],
      height: [/^[\d.]+(px|%)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { iframe: ["https"] },
  allowedIframeHostnames: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "youtube.com",
    "youtube-nocookie.com",
    "player.vimeo.com",
  ],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
    }),
  },
};

/**
 * 淨化要交給 dangerouslySetInnerHTML 的 HTML 字串。
 * 空值回空字串，方便呼叫端用 `sanitizeHtml(x) || fallback` 保留原本的預設文案。
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitize(html, OPTIONS);
}
