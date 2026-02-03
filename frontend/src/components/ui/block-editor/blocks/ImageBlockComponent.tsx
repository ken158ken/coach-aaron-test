/**
 * 圖片區塊元件
 * @module components/ui/block-editor/blocks/ImageBlockComponent
 */

import React, { useState } from "react";
import type { ImageBlock } from "../types";

interface ImageBlockComponentProps {
  block: ImageBlock;
  isSelected: boolean;
}

const ImageBlockComponent: React.FC<ImageBlockComponentProps> = ({
  block,
  isSelected,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-luxe-bg/50">
          <div className="animate-spin w-8 h-8 border-2 border-luxe-gold border-t-transparent rounded-full" />
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 text-red-400">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm">圖片載入失敗</span>
        </div>
      ) : (
        <img
          src={block.src}
          alt={block.alt}
          className="w-full h-full pointer-events-none select-none"
          style={{
            objectFit: block.objectFit,
            borderRadius: block.borderRadius,
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          draggable={false}
        />
      )}

      {/* 選中時顯示圖片資訊 */}
      {isSelected && isLoaded && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
          {block.width} × {block.height}
        </div>
      )}
    </div>
  );
};

export default ImageBlockComponent;
