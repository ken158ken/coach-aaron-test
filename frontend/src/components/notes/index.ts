/**
 * 客戶筆記本元件統一導出
 * @module components/notes
 *
 * ⚠️ 這裡刻意**不** re-export `NoteBlockEditor` —— 它會拉進
 *    @blocknote/* + @mantine/*（約 1 MB）。同 `components/ui/index.ts`
 *    對 editor/avatar 的處理：只要有人從 barrel import 就會被打進主 chunk。
 *    它只該由 `PageEditor` 用 `React.lazy()` 動態載入。
 */

export { default as NotesHome } from "./NotesHome";
export { default as AdminNotesHome } from "./AdminNotesHome";
export { default as AdminNotesTree } from "./AdminNotesTree";
export { default as NotebookList } from "./NotebookList";
export { default as CreateNotebookModal } from "./CreateNotebookModal";
export { default as NotesWorkspace } from "./NotesWorkspace";
export { useNotebookTree } from "./useNotebookTree";
export type { NotebookTreeController } from "./useNotebookTree";
export { sortOrderForIndex } from "./sortOrder";
export { default as PageTree } from "./PageTree";
export { default as PageEditor } from "./PageEditor";
export { default as MovePageModal } from "./MovePageModal";
export { default as DatabaseBoard } from "./DatabaseBoard";
export { default as CategoryManagerModal } from "./CategoryManagerModal";
