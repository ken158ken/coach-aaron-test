/**
 * Three.js 畫布容器
 * @module components/three/ThreeCanvas
 */

import React, { useRef } from "react";

interface ThreeCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * ThreeCanvas 元件 - Three.js 渲染容器
 *
 * @param {ThreeCanvasProps} props - 元件屬性
 * @returns {JSX.Element} 畫布容器
 */
const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  children,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 -z-10 ${className}`}
      id="three-canvas"
    >
      {children}
    </div>
  );
};

export default ThreeCanvas;
