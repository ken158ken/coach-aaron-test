/**
 * 影片區塊元件
 * @module components/ui/block-editor/blocks/VideoBlockComponent
 */

import React from "react";
import type { VideoBlock } from "../types";
import { parseYouTubeUrl } from "../utils";

interface VideoBlockComponentProps {
  block: VideoBlock;
  isSelected: boolean;
}

const VideoBlockComponent: React.FC<VideoBlockComponentProps> = ({
  block,
  isSelected,
}) => {
  const ytInfo = parseYouTubeUrl(block.src);

  if (!ytInfo) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/10 text-red-400 rounded-lg">
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
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span className="text-sm">無效的 YouTube 網址</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <iframe
        src={`${ytInfo.embedUrl}?enablejsapi=1&rel=0${block.autoplay ? "&autoplay=1&mute=1" : ""}`}
        className="w-full h-full"
        style={{ borderRadius: block.borderRadius }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube 影片"
      />

      {/* 遮罩層：防止拖曳時觸發 iframe 互動 */}
      <div
        className={`absolute inset-0 ${
          isSelected ? "bg-transparent" : "bg-transparent"
        }`}
        style={{ borderRadius: block.borderRadius }}
      />

      {/* 選中時顯示尺寸資訊 */}
      {isSelected && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
          {block.width} × {block.height}
        </div>
      )}
    </div>
  );
};

export default VideoBlockComponent;
