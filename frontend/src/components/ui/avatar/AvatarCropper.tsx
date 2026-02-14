/**
 * AvatarCropper - 頭像裁切元件
 * @module components/ui/avatar/AvatarCropper
 * @description 提供使用者拖曳、縮放、裁切圖片的互動介面
 */

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[AvatarCropper] ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`[AvatarCropper] ${msg}`, err),
};

interface AvatarCropperProps {
  /** 待裁切的圖片 base64 或 URL */
  imageSrc: string;
  /** 確認裁切後回呼，回傳裁切後的 base64 */
  onCropComplete: (croppedBase64: string) => void;
  /** 取消裁切 */
  onCancel: () => void;
}

/**
 * 從 canvas 擷取裁切區域並產生 base64
 *
 * @param {string} imageSrc - 原圖 base64
 * @param {Area} cropArea - 裁切區域 (像素座標)
 * @returns {Promise<string>} 裁切後的 base64 data URI
 */
const getCroppedImg = async (
  imageSrc: string,
  cropArea: Area,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context 不可用"));
          return;
        }

        // 輸出尺寸固定 400×400（後端會再縮至 200×200）
        const outputSize = 400;
        canvas.width = outputSize;
        canvas.height = outputSize;

        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          outputSize,
          outputSize,
        );

        resolve(canvas.toDataURL("image/png", 0.92));
      };
      image.onerror = () => reject(new Error("圖片載入失敗"));
      image.src = imageSrc;
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * AvatarCropper - 圖片裁切介面
 *
 * @param {AvatarCropperProps} props - 元件屬性
 * @returns {JSX.Element} 裁切器
 */
const AvatarCropper: React.FC<AvatarCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  /**
   * react-easy-crop 裁切完成回呼
   */
  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  /**
   * 使用者按下確認 → 產生裁切圖片
   */
  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      logger.info("開始裁切圖片...");
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      logger.info("裁切完成");
      onCropComplete(croppedBase64);
    } catch (err) {
      logger.error("裁切失敗", err);
    } finally {
      setProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete]);

  return (
    <div className="flex flex-col gap-4">
      {/* 裁切區域 */}
      <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-xl overflow-hidden bg-black/50">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* 縮放控制 */}
      <div className="flex items-center gap-3 px-2">
        <svg
          className="w-4 h-4 text-luxe-muted flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
          />
        </svg>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full h-1.5 bg-luxe-gold/20 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-luxe-gold
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-md"
        />
        <svg
          className="w-4 h-4 text-luxe-muted flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
          />
        </svg>
      </div>

      <p className="text-xs text-luxe-muted text-center">
        拖曳調整位置 · 滾輪或滑桿縮放
      </p>

      {/* 按鈕列 */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 text-sm text-luxe-muted hover:text-luxe-text border border-luxe-gold/20 rounded-lg transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={processing || !croppedAreaPixels}
          className="px-4 py-2 text-sm bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30 rounded-lg hover:bg-luxe-gold/30 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
              處理中…
            </>
          ) : (
            "確認裁切"
          )}
        </button>
      </div>
    </div>
  );
};

export default AvatarCropper;
