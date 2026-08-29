/**
 * LogoMark — 品牌圖形（頭部剪影 + 神經網路）
 * @module components/brand/LogoMark
 *
 * @description
 * 只有圖形、沒有文字的品牌 mark。預設為固定的品牌酒紅 (#771f1e)，
 * 深淺主題下都維持同一個顏色（品牌識別色不隨主題反轉）。
 * 若某處需要單色版（例如壓在深色底上的純白 mark），
 * 傳 `color="currentColor"` 再由外層 CSS color 決定即可。
 *
 * @example
 * ```tsx
 * <LogoMark size={34} />                       // 高 34px，等比寬
 * <LogoMark className="w-8 h-8" />             // 交給 Tailwind 控制尺寸
 * <LogoMark title="阿倫教官" size={48} />       // 需要語意時給 title
 * ```
 */
import React from "react";
import { BRAND_RED, MARK_PATH_D, MARK_VIEWBOX } from "./markPath";

export interface LogoMarkProps {
  /** 額外 className（建議用它控制寬高） */
  className?: string;
  /** 邊長（數字視為 px）；未指定時由 className / CSS 決定 */
  size?: number | string;
  /** 圖形顏色，預設品牌酒紅；給 "currentColor" 可跟隨外層 CSS color */
  color?: string;
  /**
   * 無障礙標題。有給值時以 role="img" 對外呈現；
   * 未給值時視為純裝飾（aria-hidden），由旁邊的文字負責語意。
   */
  title?: string;
}

const LogoMark: React.FC<LogoMarkProps> = ({
  className = "",
  size,
  color = BRAND_RED,
  title,
}) => (
  <svg
    viewBox={MARK_VIEWBOX}
    className={className}
    style={size === undefined ? undefined : { height: size, width: size }}
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    {title ? <title>{title}</title> : null}
    <path fill={color} fillRule="evenodd" d={MARK_PATH_D} />
  </svg>
);

export default LogoMark;
