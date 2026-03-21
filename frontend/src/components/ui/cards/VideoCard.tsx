/**
 * VideoCard - Studio 影片卡片（Aceternity 3D Card Effect 風格）
 * @module components/ui/cards/VideoCard
 */

import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { Video } from "@/types";
import { formatDate } from "@/lib/ui";
import { useLocalize } from "@/hooks";

interface VideoCardProps {
  video: Video;
  theme?: string;
  className?: string;
  onClick?: () => void;
}

const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="23" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
    <path d="M19 15l18 9-18 9V15z" fill="rgba(255,255,255,0.9)" />
  </svg>
);

const VideoCard: React.FC<VideoCardProps> = ({ video, className = "", onClick }) => {
  const { loc } = useLocalize();
  const localizedTitle = loc(video as unknown as Record<string, unknown>, "title");

  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [18, -18]), { stiffness: 280, damping: 24 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), { stiffness: 280, damping: 24 });
  const glareX  = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY  = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]: string[]) =>
      `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)`,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ perspective: "600px", cursor: onClick ? "pointer" : "default" }}
      className={`select-none ${className}`}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="studio-card flex flex-col h-full"
      >
        {/* 高光層 */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{ background: glareBg }}
        />

        {/* 縮圖 */}
        <div
          className="studio-card-img"
          style={{ height: "180px", background: "#111", position: "relative" }}
        >
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={localizedTitle}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
              <span style={{ fontSize: "3rem" }}>🎬</span>
            </div>
          )}
          {/* Play overlay */}
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.2)",
              opacity: 0, transition: "opacity 0.3s ease",
            }}
            className="play-overlay"
          >
            <PlayIcon />
          </div>
        </div>

        {/* 內容 */}
        <div style={{ padding: "20px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {video.category && <span className="card-tag">{video.category}</span>}
          <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "1rem", marginBottom: "8px", lineHeight: 1.4 }}>
            {localizedTitle}
          </h3>
          {video.description && (
            <p style={{ color: "#888", fontSize: "0.85rem", flexGrow: 1, lineHeight: 1.6 }}>
              {video.description.length > 60 ? video.description.slice(0, 60) + "..." : video.description}
            </p>
          )}
          {video.created_at && (
            <p style={{ color: "#555", fontSize: "0.75rem", marginTop: "12px" }}>
              {formatDate(video.created_at)}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VideoCard;
