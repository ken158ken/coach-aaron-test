/**
 * Sparkles - Aceternity Sparkles 風格裝飾粒子
 * @module components/ui/Sparkles
 * @description 在子元素周圍隨機生成閃爍的金色粒子點
 *              純 CSS keyframe，無需額外依賴
 */

import React, { useId } from "react";

interface SparkleProps {
  size: number;
  color: string;
  style: React.CSSProperties;
}

const Sparkle: React.FC<SparkleProps> = ({ size, color, style }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    style={style}
    className="sparkle-svg pointer-events-none absolute"
  >
    <path
      d="M80 0 C80 0 84 60 160 80 C84 80 80 160 80 160 C80 160 76 80 0 80 C76 80 80 0 80 0"
      fill={color}
    />
  </svg>
);

interface SparkleConfig {
  id: string;
  size: number;
  style: React.CSSProperties;
}

// 固定的閃爍位置（SSR-safe，非隨機）
const SPARKLE_CONFIGS: Omit<SparkleConfig, "id">[] = [
  { size: 10, style: { top: "-8px",  left: "15%",  animationDelay: "0s",    animationDuration: "1.4s" } },
  { size: 14, style: { top: "50%",   left: "-12px", animationDelay: "0.4s", animationDuration: "1.8s" } },
  { size: 8,  style: { top: "-5px",  left: "70%",  animationDelay: "0.8s",  animationDuration: "1.2s" } },
  { size: 12, style: { top: "80%",   left: "85%",  animationDelay: "0.2s",  animationDuration: "1.6s" } },
  { size: 9,  style: { top: "30%",   left: "95%",  animationDelay: "1.0s",  animationDuration: "2.0s" } },
  { size: 11, style: { top: "90%",   left: "30%",  animationDelay: "0.6s",  animationDuration: "1.5s" } },
];

interface SparklesProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

const Sparkles: React.FC<SparklesProps> = ({
  children,
  color = "#c5a059",
  className = "",
}) => {
  const uid = useId();

  return (
    <>
      {/* 注入 keyframe（只需一次，後續渲染不重複插入） */}
      <style>{`
        @keyframes sparkle-spin {
          0%   { transform: scale(0) rotate(0deg);   opacity: 0; }
          50%  { transform: scale(1) rotate(90deg);  opacity: 1; }
          100% { transform: scale(0) rotate(180deg); opacity: 0; }
        }
        .sparkle-svg {
          animation: sparkle-spin var(--sparkle-duration, 1.4s) ease-in-out
            var(--sparkle-delay, 0s) infinite;
        }
      `}</style>

      <span className={`relative inline-block ${className}`}>
        {SPARKLE_CONFIGS.map((cfg, i) => (
          <Sparkle
            key={`${uid}-${i}`}
            size={cfg.size}
            color={color}
            style={{
              ...cfg.style,
              "--sparkle-duration": cfg.style.animationDuration,
              "--sparkle-delay":    cfg.style.animationDelay,
              animationDuration: undefined,
              animationDelay:    undefined,
            } as React.CSSProperties}
          />
        ))}
        <span className="relative z-10">{children}</span>
      </span>
    </>
  );
};

export default Sparkles;
