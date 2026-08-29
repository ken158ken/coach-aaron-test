/**
 * 品牌 Logo 元件
 * @module components/brand
 *
 * @description
 * 三個 inline SVG 元件共用同一份 mark path（見 markPath.ts），
 * lockup 的文字部分為 currentColor，會自動適應淺色 / 深色主題。
 *
 * 需要絕對 URL 的場合（email、外部平台）請改用 public/logo/ 下的檔案。
 */
export { default as LogoMark } from "./LogoMark";
export type { LogoMarkProps } from "./LogoMark";

export { default as LogoHorizontal } from "./LogoHorizontal";
export type { LogoHorizontalProps } from "./LogoHorizontal";

export { default as LogoVertical } from "./LogoVertical";
export type { LogoVerticalProps } from "./LogoVertical";

export { BRAND_RED, MARK_VIEWBOX, MARK_PATH_D } from "./markPath";
