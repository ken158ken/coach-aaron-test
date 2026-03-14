/**
 * VideoCard - Studio 影片卡片
 * @module components/ui/cards/VideoCard
 */

import React from "react";
import type { Video } from "@/types";
import { formatDate } from "@/lib/ui";

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
  return (
    <div
      className={`studio-card flex flex-col ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* 縮圖 */}
      <div
        className="studio-card-img"
        style={{ height: "180px", background: "#111", position: "relative" }}
      >
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
            <span style={{ fontSize: "3rem" }}>🎬</span>
          </div>
        )}
        {/* Play overlay */}
        <div style={{
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
          {video.title}
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
    </div>
  );
};

export default VideoCard;
