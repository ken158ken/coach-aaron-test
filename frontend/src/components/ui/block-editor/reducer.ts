/**
 * 區塊編輯器 Reducer
 * @module components/ui/block-editor/reducer
 */

import type { EditorState, EditorAction, AnyBlock } from "./types";

/**
 * 編輯器初始狀態
 */
export const initialEditorState: EditorState = {
  blocks: [],
  selectedBlockId: null,
  isEditing: false,
  canvasWidth: 800,
  canvasHeight: 1200,
  zoom: 1,
  showGrid: true,
  history: [[]],
  historyIndex: 0,
};

/**
 * 儲存歷史記錄
 */
const saveToHistory = (
  state: EditorState,
  newBlocks: AnyBlock[],
): EditorState => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(newBlocks)));

  // 限制歷史記錄數量（最多 50 筆）
  if (newHistory.length > 50) {
    newHistory.shift();
  }

  return {
    ...state,
    blocks: newBlocks,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

/**
 * 編輯器 Reducer
 */
export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "ADD_BLOCK": {
      const newBlocks = [...state.blocks, action.payload];
      return saveToHistory(state, newBlocks);
    }

    case "UPDATE_BLOCK": {
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload.id
          ? { ...block, ...action.payload.updates }
          : block,
      );
      return saveToHistory(state, newBlocks as AnyBlock[]);
    }

    case "DELETE_BLOCK": {
      const newBlocks = state.blocks.filter(
        (block) => block.id !== action.payload,
      );
      return {
        ...saveToHistory(state, newBlocks),
        selectedBlockId:
          state.selectedBlockId === action.payload
            ? null
            : state.selectedBlockId,
      };
    }

    case "SELECT_BLOCK": {
      return {
        ...state,
        selectedBlockId: action.payload,
        isEditing: false,
      };
    }

    case "MOVE_BLOCK": {
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload.id
          ? { ...block, x: action.payload.x, y: action.payload.y }
          : block,
      );
      return { ...state, blocks: newBlocks as AnyBlock[] };
    }

    case "RESIZE_BLOCK": {
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload.id
          ? {
              ...block,
              width: action.payload.width,
              height: action.payload.height,
            }
          : block,
      );
      return { ...state, blocks: newBlocks as AnyBlock[] };
    }

    case "ROTATE_BLOCK": {
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload.id
          ? { ...block, rotation: action.payload.rotation }
          : block,
      );
      return { ...state, blocks: newBlocks as AnyBlock[] };
    }

    case "DUPLICATE_BLOCK": {
      const original = state.blocks.find(
        (block) => block.id === action.payload,
      );
      if (!original) return state;

      const duplicate: AnyBlock = {
        ...original,
        id: crypto.randomUUID(),
        x: original.x + 20,
        y: original.y + 20,
        zIndex: Math.max(...state.blocks.map((b) => b.zIndex)) + 1,
      } as AnyBlock;

      const newBlocks = [...state.blocks, duplicate];
      return {
        ...saveToHistory(state, newBlocks),
        selectedBlockId: duplicate.id,
      };
    }

    case "BRING_TO_FRONT": {
      const maxZ = Math.max(...state.blocks.map((b) => b.zIndex));
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload ? { ...block, zIndex: maxZ + 1 } : block,
      );
      return saveToHistory(state, newBlocks as AnyBlock[]);
    }

    case "SEND_TO_BACK": {
      const minZ = Math.min(...state.blocks.map((b) => b.zIndex));
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload ? { ...block, zIndex: minZ - 1 } : block,
      );
      return saveToHistory(state, newBlocks as AnyBlock[]);
    }

    case "LOCK_BLOCK": {
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload ? { ...block, locked: true } : block,
      );
      return saveToHistory(state, newBlocks as AnyBlock[]);
    }

    case "UNLOCK_BLOCK": {
      const newBlocks = state.blocks.map((block) =>
        block.id === action.payload ? { ...block, locked: false } : block,
      );
      return saveToHistory(state, newBlocks as AnyBlock[]);
    }

    case "SET_EDITING": {
      return { ...state, isEditing: action.payload };
    }

    case "SET_ZOOM": {
      return { ...state, zoom: Math.max(0.25, Math.min(2, action.payload)) };
    }

    case "TOGGLE_GRID": {
      return { ...state, showGrid: !state.showGrid };
    }

    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        blocks: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedBlockId: null,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        blocks: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedBlockId: null,
      };
    }

    case "LOAD_STATE": {
      return {
        ...state,
        blocks: action.payload,
        history: [action.payload],
        historyIndex: 0,
        selectedBlockId: null,
      };
    }

    case "CLEAR_ALL": {
      return saveToHistory(state, []);
    }

    default:
      return state;
  }
}
