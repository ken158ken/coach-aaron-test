/**
 * VideoCard - 影片牆卡片
 * 平時整張卡片只有縮圖，hover 時文字從底部浮上
 * @module components/ui/cards/VideoCard
 */

import React, { useState, useCallback } from 'react';
import type { Video } from '@/types';
import { formatDate } from '@/lib/ui';
import { useLocalize } from '@/hooks';

interface VideoCardProps {
  video: Video;
  theme?: string;
  className?: string;
  onClick?: () => void;
}

/** 取得縮圖：優先 DB thumbnail_url，YouTube fallback */
const getThumbnail = (video: Video): string => {
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.type === 'youtube') {
    const m = video.url?.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]+)/
    );
    if (m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
  }
  return '';
};

const platformLabel = (type?: string) => {
  switch (type) {
    case 'youtube':
      return 'YOUTUBE';
    case 'instagram':
      return 'INSTAGRAM';
    case 'facebook':
      return 'FACEBOOK';
    case 'tiktok':
      return 'TIKTOK';
    default:
      return 'VIDEO';
  }
};

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  className = '',
  onClick,
}) => {
  const { loc } = useLocalize();
  const localizedTitle = loc(
    video as unknown as Record<string, unknown>,
    'title'
  );
  const thumb = getThumbnail(video);
  const [imgLoaded, setImgLoaded] = useState(false);
  const handleImgLoad = useCallback(() => setImgLoaded(true), []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (video.url) {
      window.open(video.url, '_blank', 'noopener');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-[#111] ${className}`}
    >
      {/* 縮圖 */}
      {thumb ? (
        <img
          src={thumb}
          alt={localizedTitle}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}
          loading="lazy"
          onLoad={handleImgLoad}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
          <span className="text-4xl opacity-30">🎬</span>
        </div>
      )}

      {/* 常駐底部漸層（微弱，讓卡片有層次） */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Hover 遮罩 — 從底部浮上 */}
      <div className="absolute inset-0 flex flex-col justify-end translate-y-[calc(100%-2.5rem)] group-hover:translate-y-0 transition-transform duration-300 ease-out">
        {/* 漸層背景 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 文字內容 */}
        <div className="relative z-10 p-3 sm:p-4">
          {/* 平台標籤 — 常駐可見 */}
          <span className="inline-block text-[10px] tracking-wider font-medium text-white/70 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded mb-2">
            {platformLabel(video.type)}
          </span>

          {/* 以下 hover 才出現 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <h3 className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2 mb-1.5">
              {localizedTitle}
            </h3>

            {video.description && (
              <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-2">
                {video.description}
              </p>
            )}

            {video.created_at && (
              <p className="text-white/40 text-[10px]">
                {formatDate(video.created_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
