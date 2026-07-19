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

// 富文本編輯器 Hook —— 刻意「不」在此 re-export
//
// ⚠️ 效能守則：useRichTextEditor 會拉進 tiptap 全家桶。前台頁面（Courses /
//    ArticleDetail / CourseDetail）都從 "@/hooks" 取用其他 hook，若在此 re-export
//    會讓 tiptap 被打進主 chunk。需要時請直接 import 子路徑：
//      import { useRichTextEditor } from "@/hooks/useRichTextEditor";

// 多語言 DB 內容本地化
export { useLocalize, localizeField } from "./useLocalize";
