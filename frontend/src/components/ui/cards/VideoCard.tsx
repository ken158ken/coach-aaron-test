/**
 * VideoCard 元件 - 影片卡片
 * @module components/ui/cards/VideoCard
 */

import React from "react";
import { Link } from "react-router-dom";
import type { Video } from "@/types";

interface VideoCardProps {
  video: Video;
  theme?: "abyss" | "prism" | "luxe";
  className?: string;
}

/**
 * VideoCard - 影片展示卡片
 *
 * @param {VideoCardProps} props - 元件屬性
 * @returns {JSX.Element} 影片卡片
 */
const VideoCard: React.FC<VideoCardProps> = ({
  video,
  theme = "abyss",
  className = "",
}) => {
  const themeStyles = {
    abyss: {
      card: "abyss-card bg-abyss-bg/50 border-abyss-accent/30 hover:border-abyss-accent hover:shadow-lg hover:shadow-abyss-accent/20",
      title: "text-abyss-text",
      muted: "text-abyss-text/60",
      play: "bg-abyss-accent/80 group-hover:scale-110 transition-transform duration-300",
    },
    prism: {
      card: "prism-card bg-prism-bg/50 border-prism-accent/30 hover:border-prism-accent hover:shadow-lg hover:shadow-prism-accent/20",
      title: "text-prism-text",
      muted: "text-prism-text/60",
      play: "bg-prism-accent/80 group-hover:scale-110 transition-transform duration-300",
    },
    luxe: {
      card: "bg-luxe-surface border-luxe-gold/20 hover:border-luxe-gold/60 hover:shadow-lg hover:shadow-luxe-gold/20",
      title: "text-luxe-text",
      muted: "text-luxe-muted",
      play: "bg-luxe-gold/80 group-hover:scale-110 transition-transform duration-300",
    },
  };

  const styles = themeStyles[theme];

  return (
    <Link
      to={`/videos/${video.video_id || video.id}`}
      className={`
        group
        block
        border
        rounded-xl
        overflow-hidden
        transition-all
        duration-300
        hover:-translate-y-1
        ${styles.card}
        ${className}
      `}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={video.thumbnail || "/images/video-default.jpg"}
          alt={video.title}
          className="
            w-full
            aspect-video
            object-cover
            transition-transform
            duration-500
            group-hover:scale-105
          "
        />

        {/* Play Button Overlay */}
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-black/30
            opacity-0
            group-hover:opacity-100
            transition-opacity
            duration-300
          "
        >
          <div
            className={`
              w-10
              h-10
              sm:w-14
              sm:h-14
              rounded-full
              flex
              items-center
              justify-center
              ${styles.play}
            `}
          >
            <svg
              className="w-4 h-4 sm:w-6 sm:h-6 text-white ml-0.5 sm:ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <span
            className="
              absolute
              bottom-1.5
              sm:bottom-2
              right-1.5
              sm:right-2
              px-1.5
              sm:px-2
              py-0.5
              text-[10px]
              sm:text-xs
              bg-black/70
              text-white
              rounded
            "
          >
            {video.duration}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className={`text-sm sm:text-base font-medium line-clamp-2 ${styles.title}`}>
          {video.title}
        </h3>
        {video.views !== undefined && (
          <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 ${styles.muted}`}>
            {video.views.toLocaleString()} 次觀看
          </p>
        )}
      </div>
    </Link>
  );
};

export default VideoCard;
