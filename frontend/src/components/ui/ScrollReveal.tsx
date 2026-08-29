/**
 * ScrollReveal - 滾動揭露動畫包裝器
 * @module components/ui/ScrollReveal
 * @description 使用 Framer Motion whileInView，讓包裹的子元素在進入視窗時
 *              從下方/側面平滑滑入。viewport once:true 確保只播放一次。
 */

import React from "react";
import { motion } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** 動畫方向：元素從哪個方向滑入 */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** 自訂 viewport margin，預設 "-60px" */
  margin?: string;
}

const dirMap: Record<string, { x: number; y: number }> = {
  up:    { y: 48, x: 0 },
  down:  { y: -48, x: 0 },
  left:  { y: 0, x: 48 },
  right: { y: 0, x: -48 },
  none:  { y: 0, x: 0 },
};

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  margin = "-60px",
}) => {
  const { x, y } = dirMap[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
