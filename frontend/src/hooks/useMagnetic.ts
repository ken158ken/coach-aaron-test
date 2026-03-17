import { useRef, useEffect } from "react";
import { gsap } from "gsap";

/**
 * useMagnetic Hook - 讓元素產生磁吸滑鼠的效果
 * @param {number} power - 磁吸強度 (預設 0.2)
 * @returns {React.RefObject<any>} 元素的 Ref
 */
export const useMagnetic = (power = 0.3) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const x = (clientX - centerX) * power;
      const y = (clientY - centerY) * power;

      gsap.to(el, {
        x: x,
        y: y,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [power]);

  return ref;
};
