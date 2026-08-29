/**
 * CustomCursor - 銀刃風格自訂滑鼠指標
 * @module components/ui/CustomCursor
 * @description 半透明圓環滑鼠，懸停按鈕/連結時擴張變金色，點擊時縮小。
 *              僅在 pointer: fine（桌機）裝置啟用，避免干擾觸控。
 */

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);

  // 內點 — 快速跟隨
  const dotX = useSpring(cursorX, { damping: 28, stiffness: 700 });
  const dotY = useSpring(cursorY, { damping: 28, stiffness: 700 });

  // 外環 — 帶慣性延遲
  const ringX = useSpring(cursorX, { damping: 22, stiffness: 180 });
  const ringY = useSpring(cursorY, { damping: 22, stiffness: 180 });

  useEffect(() => {
    // 僅 pointer: fine（有精確指標）裝置啟用
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setIsClient(true);

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        target.closest(
          "a, button, [role='button'], input, select, textarea, label, [data-cursor-hover]"
        )
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const onDown = () => setIsClicking(true);
    const onUp = () => setIsClicking(false);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    // 隱藏預設游標
    document.documentElement.classList.add("custom-cursor-active");

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [cursorX, cursorY]);

  if (!isClient) return null;

  return (
    <>
      {/* ── 內點（精準位置） ── */}
      <motion.div
        className="custom-cursor-dot"
        style={{ x: dotX, y: dotY }}
        animate={{
          scale: isClicking ? 0.4 : isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ duration: 0.12 }}
      />

      {/* ── 外環（帶延遲 + 懸停擴張） ── */}
      <motion.div
        className="custom-cursor-ring"
        style={{ x: ringX, y: ringY }}
        animate={{
          scale: isClicking ? 0.75 : isHovering ? 1.6 : 1,
          borderColor: isHovering
            ? "rgba(197, 160, 89, 0.75)"
            : "rgba(255, 255, 255, 0.32)",
          backgroundColor: isHovering
            ? "rgba(197, 160, 89, 0.07)"
            : "transparent",
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
    </>
  );
};

export default CustomCursor;
