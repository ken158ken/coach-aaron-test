/**
 * AvatarPicker - 多方案頭像選擇器
 * @module components/ui/avatar/AvatarPicker
 * @description 提供上傳裁切、DiceBear 生成式、Boring Avatars 幾何風格三大方案
 */

import React, { useState, useCallback, useRef } from "react";
import { createAvatar } from "@dicebear/core";
import {
  adventurer,
  avataaars,
  bottts,
  funEmoji,
  lorelei,
  micah,
  miniavs,
  notionists,
  openPeeps,
  pixelArt,
  thumbs,
} from "@dicebear/collection";
import BoringAvatar from "boring-avatars";
import { renderToStaticMarkup } from "react-dom/server";
import AvatarCropper from "./AvatarCropper";

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[AvatarPicker] ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`[AvatarPicker] ${msg}`, err),
};

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type TabKey = "upload" | "dicebear" | "boring";

interface AvatarPickerProps {
  /** 選擇完成回呼，回傳 base64 data URI */
  onSelect: (avatarBase64: string) => void;
  /** 取消回呼 */
  onCancel: () => void;
  /** 是否處理中 */
  loading?: boolean;
}

/* ================================================================== */
/*  DiceBear Styles 設定                                               */
/* ================================================================== */

/** DiceBear 可用的風格清單 */
const DICEBEAR_STYLES = [
  { key: "avataaars", label: "Avataaars", style: avataaars },
  { key: "adventurer", label: "探險家", style: adventurer },
  { key: "bottts", label: "機器人", style: bottts },
  { key: "funEmoji", label: "趣味表情", style: funEmoji },
  { key: "lorelei", label: "Lorelei", style: lorelei },
  { key: "micah", label: "Micah", style: micah },
  { key: "miniavs", label: "Mini", style: miniavs },
  { key: "notionists", label: "Notion風", style: notionists },
  { key: "openPeeps", label: "Open Peeps", style: openPeeps },
  { key: "pixelArt", label: "像素風", style: pixelArt },
  { key: "thumbs", label: "讚", style: thumbs },
] as const;

/* ================================================================== */
/*  Boring Avatars 設定                                                */
/* ================================================================== */

/** Boring Avatars 可用的變體 */
const BORING_VARIANTS = [
  { key: "beam", label: "光束" },
  { key: "marble", label: "大理石" },
  { key: "pixel", label: "像素" },
  { key: "sunset", label: "日落" },
  { key: "ring", label: "圓環" },
  { key: "bauhaus", label: "包浩斯" },
] as const;

/** 調色盤 */
const BORING_COLORS = ["#D4AF37", "#1a1a2e", "#16213e", "#0f3460", "#e94560"];

/* ================================================================== */
/*  Helper: SVG → PNG base64                                           */
/* ================================================================== */

/**
 * 將 SVG 字串轉為 PNG base64 data URI
 *
 * @param {string} svgString - SVG 原始碼
 * @param {number} size - 輸出尺寸 (px)
 * @returns {Promise<string>} PNG base64 data URI
 */
const svgToPngBase64 = (svgString: string, size = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context 不可用"));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png", 0.92));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG 轉圖片失敗"));
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
};

/* ================================================================== */
/*  Tabs 設定                                                          */
/* ================================================================== */

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "upload",
    label: "上傳裁切",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
    ),
  },
  {
    key: "dicebear",
    label: "風格頭像",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
  {
    key: "boring",
    label: "幾何頭像",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"
        />
      </svg>
    ),
  },
];

/* ================================================================== */
/*  主元件                                                              */
/* ================================================================== */

/**
 * AvatarPicker - 多方案頭像選擇器
 *
 * @param {AvatarPickerProps} props - 元件屬性
 * @returns {JSX.Element} 頭像選擇器
 */
const AvatarPicker: React.FC<AvatarPickerProps> = ({
  onSelect,
  onCancel,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedDicebear, setSelectedDicebear] = useState(0);
  const [selectedBoring, setSelectedBoring] = useState(0);
  const [seed, setSeed] = useState(() => `avatar-${Date.now()}`);
  const [processing, setProcessing] = useState(false);
  /** DiceBear 預覽用 PNG data URI（大圖） */
  const [dicebearPreview, setDicebearPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 上傳裁切 ── */

  /**
   * 處理檔案選擇
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        logger.error("非圖片檔案");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        logger.error("圖片超過 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);

      // 清空以便重複選同檔
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  /**
   * 裁切完成回呼
   */
  const handleCropComplete = useCallback(
    (croppedBase64: string) => {
      logger.info("裁切完成，送出頭像");
      onSelect(croppedBase64);
    },
    [onSelect],
  );

  /* ── DiceBear 生成 ── */

  /**
   * 產生 DiceBear SVG 字串
   */
  const generateDicebearSvg = useCallback(
    (styleIndex: number, seedStr: string): string => {
      try {
        const styleConfig = DICEBEAR_STYLES[styleIndex];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const avatar = createAvatar(styleConfig.style as any, {
          seed: seedStr,
          size: 200,
        });
        return avatar.toString();
      } catch (err) {
        logger.error("DiceBear 生成失敗", err);
        return "";
      }
    },
    [],
  );

  /**
   * 確認使用 DiceBear 頭像
   */
  /**
   * 即時更新 DiceBear 預覽圖
   */
  const updateDicebearPreview = useCallback(
    async (styleIndex: number, seedStr: string) => {
      try {
        const svgStr = generateDicebearSvg(styleIndex, seedStr);
        if (!svgStr) return;
        const pngBase64 = await svgToPngBase64(svgStr, 400);
        setDicebearPreview(pngBase64);
      } catch (err) {
        logger.error("DiceBear 預覽生成失敗", err);
      }
    },
    [generateDicebearSvg],
  );

  // 當 selectedDicebear 或 seed 改變時，自動更新預覽
  React.useEffect(() => {
    if (activeTab === "dicebear") {
      updateDicebearPreview(selectedDicebear, seed);
    }
  }, [activeTab, selectedDicebear, seed, updateDicebearPreview]);

  /**
   * 確認使用 DiceBear 頭像
   */
  const handleDicebearConfirm = useCallback(async () => {
    setProcessing(true);
    try {
      const svgStr = generateDicebearSvg(selectedDicebear, seed);
      if (!svgStr) return;
      const pngBase64 = await svgToPngBase64(svgStr, 400);
      logger.info("DiceBear 頭像已轉 PNG");
      onSelect(pngBase64);
    } catch (err) {
      logger.error("DiceBear 確認失敗", err);
    } finally {
      setProcessing(false);
    }
  }, [selectedDicebear, seed, generateDicebearSvg, onSelect]);

  /* ── Boring Avatars 生成 ── */

  /**
   * 取得 Boring Avatar SVG 字串
   */
  const getBoringAvatarSvg = useCallback(
    (variantIndex: number, seedStr: string): string => {
      try {
        const variant = BORING_VARIANTS[variantIndex];
        const markup = renderToStaticMarkup(
          React.createElement(BoringAvatar, {
            size: 200,
            name: seedStr,
            variant: variant.key,
            colors: BORING_COLORS,
          }),
        );
        return markup;
      } catch (err) {
        logger.error("Boring Avatar 生成失敗", err);
        return "";
      }
    },
    [],
  );

  /**
   * 確認使用 Boring Avatar
   */
  const handleBoringConfirm = useCallback(async () => {
    setProcessing(true);
    try {
      const svgStr = getBoringAvatarSvg(selectedBoring, seed);
      if (!svgStr) return;
      const pngBase64 = await svgToPngBase64(svgStr, 400);
      logger.info("Boring Avatar 已轉 PNG");
      onSelect(pngBase64);
    } catch (err) {
      logger.error("Boring 確認失敗", err);
    } finally {
      setProcessing(false);
    }
  }, [selectedBoring, seed, getBoringAvatarSvg, onSelect]);

  /* ── 隨機 seed ── */

  const randomizeSeed = useCallback(() => {
    const newSeed = `avatar-${Date.now()}`;
    setSeed(newSeed);
  }, []);

  /* ── 渲染 ── */

  return (
    <div className="flex flex-col gap-4">
      {/* Tab 列 */}
      <div className="flex gap-1 border-b border-luxe-gold/10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setUploadedImage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap transition-colors
              ${
                activeTab === tab.key
                  ? "text-luxe-gold border-b-2 border-luxe-gold"
                  : "text-luxe-muted hover:text-luxe-text"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ───── 方案一: 上傳裁切 ───── */}
      {activeTab === "upload" && (
        <div>
          {uploadedImage ? (
            <AvatarCropper
              imageSrc={uploadedImage}
              onCropComplete={handleCropComplete}
              onCancel={() => setUploadedImage(null)}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full border-2 border-dashed border-luxe-gold/30 hover:border-luxe-gold/60 flex flex-col items-center justify-center gap-2 transition-colors group avatar-glow"
              >
                <svg
                  className="w-8 h-8 text-luxe-gold/40 group-hover:text-luxe-gold/70 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span className="text-[10px] text-luxe-muted group-hover:text-luxe-text transition-colors">
                  選擇圖片
                </span>
              </button>
              <p className="text-xs text-luxe-muted">
                支援 JPG / PNG / WebP，最大 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* ───── 方案二: DiceBear 風格頭像 ───── */}
      {activeTab === "dicebear" && (
        <div className="flex flex-col gap-4">
          {/* 大預覽圖 + 隨機按鈕 */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-luxe-gold/40 avatar-glow bg-white/5">
              {dicebearPreview ? (
                <img
                  src={dicebearPreview}
                  alt="預覽"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-t-transparent border-luxe-gold/40 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={randomizeSeed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-luxe-muted hover:text-luxe-gold border border-luxe-gold/20 rounded-lg transition-colors"
              title="隨機生成"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              隨機風格
            </button>
          </div>

          {/* 風格格子 */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto pr-1">
            {DICEBEAR_STYLES.map((style, idx) => {
              const svgStr = generateDicebearSvg(idx, seed);
              return (
                <button
                  key={style.key}
                  onClick={() => setSelectedDicebear(idx)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                    ${
                      selectedDicebear === idx
                        ? "border-luxe-gold bg-luxe-gold/10 ring-1 ring-luxe-gold/30"
                        : "border-luxe-gold/10 hover:border-luxe-gold/30"
                    }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/5 border-2 flex items-center justify-center ${selectedDicebear === idx ? "border-luxe-gold/60 avatar-glow" : "border-transparent"}`}
                    dangerouslySetInnerHTML={{ __html: svgStr }}
                  />
                  <span className="text-[9px] sm:text-[10px] text-luxe-muted truncate w-full text-center">
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 確認 */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={processing || loading}
              className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text border border-luxe-gold/20 rounded-lg transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleDicebearConfirm}
              disabled={processing || loading}
              className="px-4 py-2 text-sm bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30 rounded-lg hover:bg-luxe-gold/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processing || loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
                  處理中…
                </>
              ) : (
                "使用此頭像"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ───── 方案三: Boring Avatars 幾何頭像 ───── */}
      {activeTab === "boring" && (
        <div className="flex flex-col gap-4">
          {/* 大預覽圖 + 隨機按鈕 */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-luxe-gold/40 avatar-glow">
              <BoringAvatar
                size={112}
                name={seed}
                variant={BORING_VARIANTS[selectedBoring].key}
                colors={BORING_COLORS}
              />
            </div>
            <button
              onClick={randomizeSeed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-luxe-muted hover:text-luxe-gold border border-luxe-gold/20 rounded-lg transition-colors"
              title="隨機生成"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              隨機風格
            </button>
          </div>

          {/* 變體格子 */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BORING_VARIANTS.map((variant, idx) => (
              <button
                key={variant.key}
                onClick={() => setSelectedBoring(idx)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
                  ${
                    selectedBoring === idx
                      ? "border-luxe-gold bg-luxe-gold/10 ring-1 ring-luxe-gold/30"
                      : "border-luxe-gold/10 hover:border-luxe-gold/30"
                  }`}
              >
                <div
                  className={`rounded-full overflow-hidden border-2 ${selectedBoring === idx ? "border-luxe-gold/60 avatar-glow" : "border-transparent"}`}
                >
                  <BoringAvatar
                    size={48}
                    name={seed}
                    variant={variant.key}
                    colors={BORING_COLORS}
                  />
                </div>
                <span className="text-[10px] text-luxe-muted">
                  {variant.label}
                </span>
              </button>
            ))}
          </div>

          {/* 確認 */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={processing || loading}
              className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text border border-luxe-gold/20 rounded-lg transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleBoringConfirm}
              disabled={processing || loading}
              className="px-4 py-2 text-sm bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30 rounded-lg hover:bg-luxe-gold/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processing || loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
                  處理中…
                </>
              ) : (
                "使用此頭像"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarPicker;
