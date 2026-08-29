/**
 * UI 元件統一導出
 * @module components/ui
 */

// Cards
export * from "./cards";

// Buttons
export * from "./buttons";

// Navigation
export * from "./navigation";

// Feedback
export * from "./feedback";

// Form
export * from "./form";

// Data
export * from "./data";

// Overlay
export * from "./overlay";

// Editor / Avatar —— 刻意「不」在此 re-export
//
// ⚠️ 效能守則：`./editor` 會拉進 tiptap + prosemirror + lowlight + highlight.js
//    （約 536 KiB），`./avatar` 會拉進 @dicebear/* + boring-avatars + react-easy-crop
//    （約 590 KiB）。這兩包都只有後台／會員頁用得到，但幾乎每個前台頁面都寫
//    `import { ... } from "@/components/ui"`，一旦在此 `export *`，它們就會被
//    打進主 chunk 送給每一位訪客（這些套件未標記 sideEffects: false，tree-shaking
//    無法移除）。
//
//    需要時請「直接具名 import」子路徑：
//      import { RichTextEditor } from "@/components/ui/editor";
//      import { AvatarPicker } from "@/components/ui/avatar";

// Dialog
export {
  Modal,
  PromptDialog,
  ConfirmDialog,
  AlertDialog,
  DialogProvider,
  useDialog,
} from "./Dialog";

// Image input（全站統一圖片欄位：上傳 / Cloudinary 網址雙模式）
export { default as ImageInput, ImageUploadTargetProvider, useImageUploadTarget } from "./ImageInput";
export type { ImageInputProps, ImageEntity, ImageKind, ImageUploadTarget } from "./ImageInput";
export { default as ImagePickerModal } from "./ImagePickerModal";
export type { ImagePickerModalProps } from "./ImagePickerModal";

// Tooltip
export { default as Tooltip } from "./Tooltip";

// Search
export { GlobalSearch, SearchButton } from "./GlobalSearch";

// Sparkles
export { default as Sparkles } from "./Sparkles";
