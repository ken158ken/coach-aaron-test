/**
 * 區塊編輯器類型定義
 * @module components/ui/block-editor/types
 */

/** 區塊類型 */
export type BlockType = "text" | "image" | "video" | "divider" | "spacer";

/** 區塊基礎介面 */
export interface Block {
  /** 唯一識別碼 */
  id: string;
  /** 區塊類型 */
  type: BlockType;
  /** X 座標 (px) */
  x: number;
  /** Y 座標 (px) */
  y: number;
  /** 寬度 (px) */
  width: number;
  /** 高度 (px) */
  height: number;
  /** 旋轉角度 (deg) */
  rotation: number;
  /** 層級 (z-index) */
  zIndex: number;
  /** 是否鎖定 */
  locked: boolean;
}

/** 文字區塊 */
export interface TextBlock extends Block {
  type: "text";
  /** HTML 內容 */
  content: string;
  /** 文字對齊 */
  textAlign: "left" | "center" | "right" | "justify";
  /** 字體大小 */
  fontSize: number;
  /** 背景顏色 */
  backgroundColor: string;
  /** 內邊距 */
  padding: number;
  /** 文繞圖模式 */
  floatMode: "none" | "left" | "right";
}

/** 圖片區塊 */
export interface ImageBlock extends Block {
  type: "image";
  /** 圖片 URL */
  src: string;
  /** 替代文字 */
  alt: string;
  /** 物件適應方式 */
  objectFit: "contain" | "cover" | "fill" | "none";
  /** 圓角 */
  borderRadius: number;
  /** 文繞圖模式 */
  floatMode: "none" | "left" | "right";
}

/** 影片區塊 */
export interface VideoBlock extends Block {
  type: "video";
  /** YouTube 網址 */
  src: string;
  /** 是否自動播放 */
  autoplay: boolean;
  /** 圓角 */
  borderRadius: number;
}

/** 分隔線區塊 */
export interface DividerBlock extends Block {
  type: "divider";
  /** 線條樣式 */
  style: "solid" | "dashed" | "dotted";
  /** 線條顏色 */
  color: string;
  /** 線條粗細 */
  thickness: number;
}

/** 間隔區塊 */
export interface SpacerBlock extends Block {
  type: "spacer";
}

/** 所有區塊聯合類型 */
export type AnyBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | DividerBlock
  | SpacerBlock;

/** 編輯器狀態 */
export interface EditorState {
  /** 所有區塊 */
  blocks: AnyBlock[];
  /** 選中的區塊 ID */
  selectedBlockId: string | null;
  /** 是否編輯模式 */
  isEditing: boolean;
  /** 畫布寬度 */
  canvasWidth: number;
  /** 畫布高度 */
  canvasHeight: number;
  /** 縮放比例 */
  zoom: number;
  /** 是否顯示格線 */
  showGrid: boolean;
  /** 歷史記錄（用於 Undo/Redo） */
  history: AnyBlock[][];
  /** 歷史記錄指針 */
  historyIndex: number;
}

/** 編輯器動作 */
export type EditorAction =
  | { type: "ADD_BLOCK"; payload: AnyBlock }
  | {
      type: "UPDATE_BLOCK";
      payload: { id: string; updates: Partial<AnyBlock> };
    }
  | { type: "DELETE_BLOCK"; payload: string }
  | { type: "SELECT_BLOCK"; payload: string | null }
  | { type: "MOVE_BLOCK"; payload: { id: string; x: number; y: number } }
  | {
      type: "RESIZE_BLOCK";
      payload: { id: string; width: number; height: number };
    }
  | { type: "ROTATE_BLOCK"; payload: { id: string; rotation: number } }
  | { type: "DUPLICATE_BLOCK"; payload: string }
  | { type: "BRING_TO_FRONT"; payload: string }
  | { type: "SEND_TO_BACK"; payload: string }
  | { type: "LOCK_BLOCK"; payload: string }
  | { type: "UNLOCK_BLOCK"; payload: string }
  | { type: "SET_EDITING"; payload: boolean }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "TOGGLE_GRID" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_STATE"; payload: AnyBlock[] }
  | { type: "CLEAR_ALL" };

/** YouTube URL 解析結果 */
export interface YouTubeInfo {
  videoId: string;
  embedUrl: string;
}

/** 匯出格式 */
export interface ExportData {
  version: string;
  blocks: AnyBlock[];
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
}
