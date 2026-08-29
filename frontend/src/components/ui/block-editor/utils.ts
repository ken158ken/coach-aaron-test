/**
 * 區塊編輯器工具函數
 * @module components/ui/block-editor/utils
 */

import type {
  AnyBlock,
  TextBlock,
  ImageBlock,
  VideoBlock,
  DividerBlock,
  SpacerBlock,
  YouTubeInfo,
  ExportData,
} from "./types";
// 圖片網址驗證走全站唯一實作（frontend/src/lib/imageUrl.ts），此處只做轉出
export { isAllowedImageUrl } from "@/lib/imageUrl";

/** YouTube URL 驗證 */
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * 驗證 YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return YOUTUBE_REGEX.test(url);
};

/**
 * 解析 YouTube URL 取得影片 ID
 */
export const parseYouTubeUrl = (url: string): YouTubeInfo | null => {
  try {
    const urlObj = new URL(url);
    let videoId = "";

    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v") || "";

      // 處理 /embed/ 格式
      if (!videoId && urlObj.pathname.includes("/embed/")) {
        videoId = urlObj.pathname.split("/embed/")[1]?.split("?")[0] || "";
      }
    }

    if (!videoId) return null;

    return {
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
  } catch {
    return null;
  }
};

/**
 * 建立文字區塊
 */
export const createTextBlock = (
  x: number = 50,
  y: number = 50,
  zIndex: number = 1,
  /** 新區塊的預設內容（由呼叫端帶入翻譯後的提示語） */
  seedContent?: string,
): TextBlock => ({
  id: generateId(),
  type: "text",
  x,
  y,
  width: 300,
  height: 150,
  rotation: 0,
  zIndex,
  locked: false,
  content: seedContent ?? "<p></p>",
  textAlign: "left",
  fontSize: 16,
  backgroundColor: "transparent",
  padding: 16,
  floatMode: "none",
});

/**
 * 建立圖片區塊
 */
export const createImageBlock = (
  src: string,
  x: number = 50,
  y: number = 50,
  zIndex: number = 1,
  /** 圖片 alt（由呼叫端帶入翻譯後的預設值） */
  altText?: string,
): ImageBlock => ({
  id: generateId(),
  type: "image",
  x,
  y,
  width: 300,
  height: 200,
  rotation: 0,
  zIndex,
  locked: false,
  src,
  alt: altText ?? "",
  objectFit: "cover",
  borderRadius: 8,
  floatMode: "none",
});

/**
 * 建立影片區塊
 */
export const createVideoBlock = (
  src: string,
  x: number = 50,
  y: number = 50,
  zIndex: number = 1,
): VideoBlock => ({
  id: generateId(),
  type: "video",
  x,
  y,
  width: 560,
  height: 315,
  rotation: 0,
  zIndex,
  locked: false,
  src,
  autoplay: false,
  borderRadius: 8,
});

/**
 * 建立分隔線區塊
 */
export const createDividerBlock = (
  x: number = 50,
  y: number = 50,
  zIndex: number = 1,
): DividerBlock => ({
  id: generateId(),
  type: "divider",
  x,
  y,
  width: 400,
  height: 20,
  rotation: 0,
  zIndex,
  locked: false,
  style: "solid",
  color: "#d4af37",
  thickness: 2,
});

/**
 * 建立間隔區塊
 */
export const createSpacerBlock = (
  x: number = 50,
  y: number = 50,
  zIndex: number = 1,
): SpacerBlock => ({
  id: generateId(),
  type: "spacer",
  x,
  y,
  width: 100,
  height: 50,
  rotation: 0,
  zIndex,
  locked: false,
});

/**
 * 匯出為 JSON
 */
export const exportToJson = (
  blocks: AnyBlock[],
  canvasWidth: number,
  canvasHeight: number,
): string => {
  const data: ExportData = {
    version: "1.0.0",
    blocks,
    canvasWidth,
    canvasHeight,
    createdAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

/**
 * 從 JSON 匯入
 */
export const importFromJson = (json: string): ExportData | null => {
  try {
    const data = JSON.parse(json);
    if (data.version && Array.isArray(data.blocks)) {
      return data as ExportData;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * 匯出為 HTML（預覽用）
 */
export const exportToHtml = (blocks: AnyBlock[]): string => {
  const sortedBlocks = [...blocks].sort((a, b) => a.y - b.y);

  let html = '<div class="block-editor-output">\n';

  for (const block of sortedBlocks) {
    switch (block.type) {
      case "text": {
        const textBlock = block as TextBlock;
        const floatStyle =
          textBlock.floatMode !== "none"
            ? `float: ${textBlock.floatMode}; margin: 0 16px 16px 0;`
            : "";
        html += `  <div style="width: ${textBlock.width}px; padding: ${textBlock.padding}px; background: ${textBlock.backgroundColor}; text-align: ${textBlock.textAlign}; font-size: ${textBlock.fontSize}px; ${floatStyle}">\n`;
        html += `    ${textBlock.content}\n`;
        html += `  </div>\n`;
        break;
      }
      case "image": {
        const imgBlock = block as ImageBlock;
        const floatStyle =
          imgBlock.floatMode !== "none"
            ? `float: ${imgBlock.floatMode}; margin: 0 16px 16px 0;`
            : "";
        html += `  <img src="${imgBlock.src}" alt="${imgBlock.alt}" style="width: ${imgBlock.width}px; height: ${imgBlock.height}px; object-fit: ${imgBlock.objectFit}; border-radius: ${imgBlock.borderRadius}px; ${floatStyle}" />\n`;
        break;
      }
      case "video": {
        const vidBlock = block as VideoBlock;
        const ytInfo = parseYouTubeUrl(vidBlock.src);
        if (ytInfo) {
          html += `  <iframe width="${vidBlock.width}" height="${vidBlock.height}" src="${ytInfo.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: ${vidBlock.borderRadius}px;"></iframe>\n`;
        }
        break;
      }
      case "divider": {
        const divBlock = block as DividerBlock;
        html += `  <hr style="width: ${divBlock.width}px; border: none; border-top: ${divBlock.thickness}px ${divBlock.style} ${divBlock.color}; margin: 16px 0;" />\n`;
        break;
      }
      case "spacer": {
        html += `  <div style="height: ${block.height}px;"></div>\n`;
        break;
      }
    }
  }

  html += "</div>";
  return html;
};

/**
 * 計算對齊位置（吸附格線）
 */
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * 限制在畫布範圍內
 */
export const clampToCanvas = (
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } => {
  return {
    x: Math.max(0, Math.min(x, canvasWidth - width)),
    y: Math.max(0, Math.min(y, canvasHeight - height)),
  };
};
