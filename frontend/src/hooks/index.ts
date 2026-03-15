/**
 * Hooks 統一導出
 * @module hooks
 */

export { useScrollAnimation } from "./useScrollAnimation";
export { useLocalStorage } from "./useLocalStorage";
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from "./useMediaQuery";
export { useCourses } from "./useCourses";
export { useVideos } from "./useVideos";
export { useUser } from "./useUser";
export type { UserCourse, UseUserReturn } from "./useUser";

// 安全輸入 Hooks
export {
  useSafeInput,
  useRatingInput,
  safeDisplayContent,
  renderSafeContent,
  splitSafeContentLines,
} from "./useSafeInput";

// 富文本編輯器 Hook
export { useRichTextEditor } from "./useRichTextEditor";

// 多語言 DB 內容本地化
export { useLocalize, localizeField } from "./useLocalize";
