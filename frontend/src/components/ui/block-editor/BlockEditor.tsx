/**
 * 區塊編輯器 - 主元件
 * @module components/ui/block-editor/BlockEditor
 * @description 支援拖曳、縮放、旋轉的所見即所得區塊編輯器
 */

import React, {
  useReducer,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import Moveable from "react-moveable";
import type {
  AnyBlock,
  TextBlock,
  ImageBlock,
  VideoBlock,
  DividerBlock,
} from "./types";
import { editorReducer, initialEditorState } from "./reducer";
import {
  createTextBlock,
  createImageBlock,
  createVideoBlock,
  createDividerBlock,
  createSpacerBlock,
  isValidCloudinaryUrl,
  isValidYouTubeUrl,
  exportToJson,
  importFromJson,
  exportToHtml,
  snapToGrid,
} from "./utils";
import {
  TextBlockComponent,
  ImageBlockComponent,
  VideoBlockComponent,
  DividerBlockComponent,
} from "./blocks";

interface BlockEditorProps {
  /** 初始內容（JSON 字串或區塊陣列） */
  initialContent?: string | AnyBlock[];
  /** 內容變更回調 */
  onChange?: (blocks: AnyBlock[], html: string, json: string) => void;
  /** 主題 */
  theme?: "luxe" | "abyss" | "prism";
  /** 是否唯讀 */
  readonly?: boolean;
  /** 畫布寬度 */
  canvasWidth?: number;
  /** 畫布高度 */
  canvasHeight?: number;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  initialContent,
  onChange,
  theme: _theme = "luxe",
  readonly = false,
  canvasWidth = 800,
  canvasHeight = 1200,
}) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialEditorState,
    canvasWidth,
    canvasHeight,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);

  useScrollLock(showImageModal || showVideoModal);

  // 載入初始內容
  useEffect(() => {
    if (initialContent) {
      if (typeof initialContent === "string") {
        const data = importFromJson(initialContent);
        if (data) {
          dispatch({ type: "LOAD_STATE", payload: data.blocks });
        }
      } else {
        dispatch({ type: "LOAD_STATE", payload: initialContent });
      }
    }
  }, []);

  // 內容變更時通知外部
  useEffect(() => {
    if (onChange) {
      const html = exportToHtml(state.blocks);
      const json = exportToJson(
        state.blocks,
        state.canvasWidth,
        state.canvasHeight,
      );
      onChange(state.blocks, html, json);
    }
  }, [state.blocks, onChange]);

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readonly) return;

      // Delete 刪除
      if (e.key === "Delete" && state.selectedBlockId && !state.isEditing) {
        dispatch({ type: "DELETE_BLOCK", payload: state.selectedBlockId });
      }

      // Ctrl+Z 復原
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }

      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if (
        (e.ctrlKey && e.shiftKey && e.key === "z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }

      // Ctrl+D 複製
      if (e.ctrlKey && e.key === "d" && state.selectedBlockId) {
        e.preventDefault();
        dispatch({ type: "DUPLICATE_BLOCK", payload: state.selectedBlockId });
      }

      // Escape 取消選取
      if (e.key === "Escape") {
        dispatch({ type: "SELECT_BLOCK", payload: null });
        dispatch({ type: "SET_EDITING", payload: false });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readonly, state.selectedBlockId, state.isEditing]);

  /** 選取區塊 */
  const handleSelectBlock = useCallback(
    (id: string | null) => {
      if (readonly) return;
      dispatch({ type: "SELECT_BLOCK", payload: id });
    },
    [readonly],
  );

  /** 新增文字區塊 */
  const handleAddText = useCallback(() => {
    const maxZ =
      state.blocks.length > 0
        ? Math.max(...state.blocks.map((b) => b.zIndex))
        : 0;
    const block = createTextBlock(50, 50 + state.blocks.length * 30, maxZ + 1);
    dispatch({ type: "ADD_BLOCK", payload: block });
    dispatch({ type: "SELECT_BLOCK", payload: block.id });
    setShowAddMenu(false);
  }, [state.blocks]);

  /** 新增圖片區塊 */
  const handleAddImage = useCallback(() => {
    setError("");
    if (!imageUrl.trim()) {
      setError("請輸入圖片網址");
      return;
    }
    if (!isValidCloudinaryUrl(imageUrl)) {
      setError("只支援 Cloudinary 圖片！請上傳至 Cloudinary 後貼上連結。");
      return;
    }

    const maxZ =
      state.blocks.length > 0
        ? Math.max(...state.blocks.map((b) => b.zIndex))
        : 0;
    const block = createImageBlock(imageUrl, 50, 50, maxZ + 1);
    dispatch({ type: "ADD_BLOCK", payload: block });
    dispatch({ type: "SELECT_BLOCK", payload: block.id });
    setShowImageModal(false);
    setImageUrl("");
  }, [imageUrl, state.blocks]);

  /** 新增影片區塊 */
  const handleAddVideo = useCallback(() => {
    setError("");
    if (!videoUrl.trim()) {
      setError("請輸入 YouTube 網址");
      return;
    }
    if (!isValidYouTubeUrl(videoUrl)) {
      setError("只支援 YouTube 影片！");
      return;
    }

    const maxZ =
      state.blocks.length > 0
        ? Math.max(...state.blocks.map((b) => b.zIndex))
        : 0;
    const block = createVideoBlock(videoUrl, 50, 50, maxZ + 1);
    dispatch({ type: "ADD_BLOCK", payload: block });
    dispatch({ type: "SELECT_BLOCK", payload: block.id });
    setShowVideoModal(false);
    setVideoUrl("");
  }, [videoUrl, state.blocks]);

  /** 新增分隔線 */
  const handleAddDivider = useCallback(() => {
    const maxZ =
      state.blocks.length > 0
        ? Math.max(...state.blocks.map((b) => b.zIndex))
        : 0;
    const block = createDividerBlock(
      50,
      50 + state.blocks.length * 30,
      maxZ + 1,
    );
    dispatch({ type: "ADD_BLOCK", payload: block });
    setShowAddMenu(false);
  }, [state.blocks]);

  /** 新增間隔 */
  const handleAddSpacer = useCallback(() => {
    const maxZ =
      state.blocks.length > 0
        ? Math.max(...state.blocks.map((b) => b.zIndex))
        : 0;
    const block = createSpacerBlock(
      50,
      50 + state.blocks.length * 30,
      maxZ + 1,
    );
    dispatch({ type: "ADD_BLOCK", payload: block });
    setShowAddMenu(false);
  }, [state.blocks]);

  /** 更新區塊屬性 */
  const handleUpdateBlock = useCallback(
    (id: string, updates: Partial<AnyBlock>) => {
      dispatch({ type: "UPDATE_BLOCK", payload: { id, updates } });
    },
    [],
  );

  /** 渲染區塊內容 */
  const renderBlockContent = useCallback(
    (block: AnyBlock) => {
      const isSelected = state.selectedBlockId === block.id;

      switch (block.type) {
        case "text":
          return (
            <TextBlockComponent
              block={block as TextBlock}
              isSelected={isSelected}
              isEditing={isSelected && state.isEditing}
              onContentChange={(content) =>
                handleUpdateBlock(block.id, { content } as Partial<TextBlock>)
              }
              onDoubleClick={() =>
                dispatch({ type: "SET_EDITING", payload: true })
              }
              onBlur={() => dispatch({ type: "SET_EDITING", payload: false })}
            />
          );
        case "image":
          return (
            <ImageBlockComponent
              block={block as ImageBlock}
              isSelected={isSelected}
            />
          );
        case "video":
          return (
            <VideoBlockComponent
              block={block as VideoBlock}
              isSelected={isSelected}
            />
          );
        case "divider":
          return <DividerBlockComponent block={block as DividerBlock} />;
        case "spacer":
          return (
            <div className="w-full h-full border border-dashed border-gray-500/30 flex items-center justify-center text-gray-500 text-xs">
              間隔
            </div>
          );
        default:
          return null;
      }
    },
    [state.selectedBlockId, state.isEditing, handleUpdateBlock],
  );

  const selectedBlock = state.blocks.find(
    (b) => b.id === state.selectedBlockId,
  );

  return (
    <div className="flex h-full bg-luxe-bg">
      {/* 左側工具列 */}
      {!readonly && (
        <div className="w-16 bg-luxe-black border-r border-luxe-gold/20 flex flex-col items-center py-4 gap-2">
          {/* 新增區塊按鈕 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-luxe-gold text-black hover:bg-luxe-gold/90 transition-colors"
              title="新增區塊"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            {/* 新增選單 */}
            {showAddMenu && (
              <div className="absolute left-full ml-2 top-0 bg-luxe-bg border border-luxe-gold/30 rounded-lg shadow-xl p-2 min-w-[150px] z-50">
                <button
                  type="button"
                  onClick={handleAddText}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-luxe-gold/10 rounded flex items-center gap-2"
                >
                  <span className="text-lg">📝</span> 文字區塊
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-luxe-gold/10 rounded flex items-center gap-2"
                >
                  <span className="text-lg">🖼️</span> 圖片
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoModal(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-luxe-gold/10 rounded flex items-center gap-2"
                >
                  <span className="text-lg">🎬</span> YouTube 影片
                </button>
                <hr className="my-2 border-luxe-gold/20" />
                <button
                  type="button"
                  onClick={handleAddDivider}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-luxe-gold/10 rounded flex items-center gap-2"
                >
                  <span className="text-lg">➖</span> 分隔線
                </button>
                <button
                  type="button"
                  onClick={handleAddSpacer}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-luxe-gold/10 rounded flex items-center gap-2"
                >
                  <span className="text-lg">↕️</span> 間隔
                </button>
              </div>
            )}
          </div>

          {/* 分隔線 */}
          <div className="w-8 h-px bg-luxe-gold/20 my-2" />

          {/* 復原 */}
          <button
            type="button"
            onClick={() => dispatch({ type: "UNDO" })}
            disabled={state.historyIndex <= 0}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-luxe-gold/10 disabled:opacity-30"
            title="復原 (Ctrl+Z)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>

          {/* 重做 */}
          <button
            type="button"
            onClick={() => dispatch({ type: "REDO" })}
            disabled={state.historyIndex >= state.history.length - 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-luxe-gold/10 disabled:opacity-30"
            title="重做 (Ctrl+Y)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>

          {/* 顯示格線 */}
          <button
            type="button"
            onClick={() => dispatch({ type: "TOGGLE_GRID" })}
            className={`w-10 h-10 flex items-center justify-center rounded-lg ${
              state.showGrid
                ? "bg-luxe-gold/20 text-luxe-gold"
                : "hover:bg-luxe-gold/10"
            }`}
            title="顯示格線"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 9h16M4 15h16M9 4v16M15 4v16"
              />
            </svg>
          </button>

          {/* 縮放 */}
          <div className="flex flex-col items-center gap-1 mt-auto">
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "SET_ZOOM", payload: state.zoom + 0.1 })
              }
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-luxe-gold/10 text-sm"
            >
              +
            </button>
            <span className="text-xs text-luxe-gold/70">
              {Math.round(state.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "SET_ZOOM", payload: state.zoom - 0.1 })
              }
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-luxe-gold/10 text-sm"
            >
              −
            </button>
          </div>
        </div>
      )}

      {/* 畫布區域 */}
      <div className="flex-1 overflow-auto p-8 bg-[#1a1a1a]">
        <div
          ref={canvasRef}
          className="relative mx-auto bg-luxe-bg border border-luxe-gold/30 shadow-2xl"
          style={{
            width: state.canvasWidth * state.zoom,
            height: state.canvasHeight * state.zoom,
            transform: `scale(${state.zoom})`,
            transformOrigin: "top left",
            backgroundImage: state.showGrid
              ? "linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)"
              : "none",
            backgroundSize: "20px 20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleSelectBlock(null);
            }
          }}
        >
          {/* 渲染所有區塊 */}
          {state.blocks.map((block) => (
            <div
              key={block.id}
              className={`block-item absolute ${
                state.selectedBlockId === block.id
                  ? "ring-2 ring-luxe-gold"
                  : "hover:ring-1 hover:ring-luxe-gold/50"
              } ${block.locked ? "opacity-70" : ""}`}
              style={{
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                transform: `rotate(${block.rotation}deg)`,
                zIndex: block.zIndex,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectBlock(block.id);
              }}
            >
              {renderBlockContent(block)}

              {/* 鎖定圖示 */}
              {block.locked && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded flex items-center justify-center">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Moveable 控制器 */}
          {!readonly &&
            selectedBlock &&
            !selectedBlock.locked &&
            !state.isEditing && (
              <Moveable
                ref={moveableRef}
                target={`.block-item:nth-child(${state.blocks.findIndex((b) => b.id === selectedBlock.id) + 1})`}
                container={canvasRef.current}
                draggable
                resizable
                rotatable
                snappable
                snapThreshold={5}
                bounds={{
                  left: 0,
                  top: 0,
                  right: state.canvasWidth,
                  bottom: state.canvasHeight,
                }}
                edge={false}
                origin={false}
                keepRatio={false}
                renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                onDrag={({ target, left, top }) => {
                  const snappedX = snapToGrid(left);
                  const snappedY = snapToGrid(top);
                  target.style.left = `${snappedX}px`;
                  target.style.top = `${snappedY}px`;
                }}
                onDragEnd={({ target }) => {
                  const left = parseFloat(target.style.left);
                  const top = parseFloat(target.style.top);
                  dispatch({
                    type: "MOVE_BLOCK",
                    payload: { id: selectedBlock.id, x: left, y: top },
                  });
                }}
                onResize={({ target, width, height, drag }) => {
                  target.style.width = `${width}px`;
                  target.style.height = `${height}px`;
                  target.style.left = `${drag.left}px`;
                  target.style.top = `${drag.top}px`;
                }}
                onResizeEnd={({ target }) => {
                  const width = parseFloat(target.style.width);
                  const height = parseFloat(target.style.height);
                  const left = parseFloat(target.style.left);
                  const top = parseFloat(target.style.top);
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: {
                      id: selectedBlock.id,
                      updates: { width, height, x: left, y: top },
                    },
                  });
                }}
                onRotate={({ target, transform }) => {
                  target.style.transform = transform;
                }}
                onRotateEnd={({ target }) => {
                  const match = target.style.transform.match(
                    /rotate\(([-\d.]+)deg\)/,
                  );
                  if (match) {
                    dispatch({
                      type: "ROTATE_BLOCK",
                      payload: {
                        id: selectedBlock.id,
                        rotation: parseFloat(match[1]),
                      },
                    });
                  }
                }}
              />
            )}
        </div>
      </div>

      {/* 右側屬性面板 */}
      {!readonly && showPropertyPanel && selectedBlock && (
        <div className="w-64 bg-luxe-black border-l border-luxe-gold/20 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">屬性</h3>
            <button
              type="button"
              onClick={() => setShowPropertyPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 通用屬性 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">位置</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={Math.round(selectedBlock.x)}
                  onChange={(e) =>
                    handleUpdateBlock(selectedBlock.id, {
                      x: Number(e.target.value),
                    })
                  }
                  className="w-1/2 px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  placeholder="X"
                />
                <input
                  type="number"
                  value={Math.round(selectedBlock.y)}
                  onChange={(e) =>
                    handleUpdateBlock(selectedBlock.id, {
                      y: Number(e.target.value),
                    })
                  }
                  className="w-1/2 px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  placeholder="Y"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">尺寸</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={Math.round(selectedBlock.width)}
                  onChange={(e) =>
                    handleUpdateBlock(selectedBlock.id, {
                      width: Number(e.target.value),
                    })
                  }
                  className="w-1/2 px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  placeholder="寬"
                />
                <input
                  type="number"
                  value={Math.round(selectedBlock.height)}
                  onChange={(e) =>
                    handleUpdateBlock(selectedBlock.id, {
                      height: Number(e.target.value),
                    })
                  }
                  className="w-1/2 px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  placeholder="高"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">旋轉</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedBlock.rotation}
                onChange={(e) =>
                  handleUpdateBlock(selectedBlock.id, {
                    rotation: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-400">
                {selectedBlock.rotation}°
              </span>
            </div>

            {/* 文字區塊專用屬性 */}
            {selectedBlock.type === "text" && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    字體大小
                  </label>
                  <input
                    type="number"
                    value={(selectedBlock as TextBlock).fontSize}
                    onChange={(e) =>
                      handleUpdateBlock(selectedBlock.id, {
                        fontSize: Number(e.target.value),
                      } as Partial<TextBlock>)
                    }
                    className="w-full px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                    min={8}
                    max={72}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    背景顏色
                  </label>
                  <input
                    type="color"
                    value={
                      (selectedBlock as TextBlock).backgroundColor || "#000000"
                    }
                    onChange={(e) =>
                      handleUpdateBlock(selectedBlock.id, {
                        backgroundColor: e.target.value,
                      } as Partial<TextBlock>)
                    }
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    文繞圖
                  </label>
                  <select
                    value={(selectedBlock as TextBlock).floatMode}
                    onChange={(e) =>
                      handleUpdateBlock(selectedBlock.id, {
                        floatMode: e.target.value as "none" | "left" | "right",
                      } as Partial<TextBlock>)
                    }
                    className="w-full px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  >
                    <option value="none">無</option>
                    <option value="left">靠左（文字繞右）</option>
                    <option value="right">靠右（文字繞左）</option>
                  </select>
                </div>
              </>
            )}

            {/* 圖片區塊專用屬性 */}
            {selectedBlock.type === "image" && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    圓角
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={(selectedBlock as ImageBlock).borderRadius}
                    onChange={(e) =>
                      handleUpdateBlock(selectedBlock.id, {
                        borderRadius: Number(e.target.value),
                      } as Partial<ImageBlock>)
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    填充模式
                  </label>
                  <select
                    value={(selectedBlock as ImageBlock).objectFit}
                    onChange={(e) =>
                      handleUpdateBlock(selectedBlock.id, {
                        objectFit: e.target.value as
                          | "cover"
                          | "contain"
                          | "fill",
                      } as Partial<ImageBlock>)
                    }
                    className="w-full px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  >
                    <option value="cover">裁切填滿</option>
                    <option value="contain">完整顯示</option>
                    <option value="fill">拉伸填滿</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    文繞圖
                  </label>
                  <select
                    value={(selectedBlock as ImageBlock).floatMode}
                    onChange={(e) =>
                      handleUpdateBlock(selectedBlock.id, {
                        floatMode: e.target.value as "none" | "left" | "right",
                      } as Partial<ImageBlock>)
                    }
                    className="w-full px-2 py-1 bg-luxe-bg border border-luxe-gold/30 rounded text-sm"
                  >
                    <option value="none">無</option>
                    <option value="left">靠左</option>
                    <option value="right">靠右</option>
                  </select>
                </div>
              </>
            )}

            {/* 操作按鈕 */}
            <div className="pt-4 border-t border-luxe-gold/20 space-y-2">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "DUPLICATE_BLOCK",
                    payload: selectedBlock.id,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-luxe-gold/10 hover:bg-luxe-gold/20 rounded"
              >
                複製區塊
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "BRING_TO_FRONT",
                      payload: selectedBlock.id,
                    })
                  }
                  className="flex-1 px-2 py-1 text-xs bg-luxe-gold/10 hover:bg-luxe-gold/20 rounded"
                >
                  移至最前
                </button>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "SEND_TO_BACK",
                      payload: selectedBlock.id,
                    })
                  }
                  className="flex-1 px-2 py-1 text-xs bg-luxe-gold/10 hover:bg-luxe-gold/20 rounded"
                >
                  移至最後
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: selectedBlock.locked ? "UNLOCK_BLOCK" : "LOCK_BLOCK",
                    payload: selectedBlock.id,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-luxe-gold/10 hover:bg-luxe-gold/20 rounded"
              >
                {selectedBlock.locked ? "🔓 解除鎖定" : "🔒 鎖定位置"}
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "DELETE_BLOCK", payload: selectedBlock.id })
                }
                className="w-full px-3 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded"
              >
                刪除區塊
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 圖片新增 Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6 bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-4 sm:p-6 w-full max-w-md mx-3 sm:mx-4 my-auto">
            <h3 className="text-lg font-medium mb-4">新增 Cloudinary 圖片</h3>
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">
                ⚠️ 只支援 Cloudinary 圖片！請先上傳至 Cloudinary 再貼上網址。
              </p>
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl("");
                  setError("");
                }}
                className="px-4 py-2 text-sm hover:bg-gray-700 rounded"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 text-sm bg-luxe-gold text-black rounded hover:bg-luxe-gold/90"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 影片新增 Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6 bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-4 sm:p-6 w-full max-w-md mx-3 sm:mx-4 my-auto">
            <h3 className="text-lg font-medium mb-4">新增 YouTube 影片</h3>
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">⚠️ 只支援 YouTube 影片！</p>
            </div>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl("");
                  setError("");
                }}
                className="px-4 py-2 text-sm hover:bg-gray-700 rounded"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddVideo}
                className="px-4 py-2 text-sm bg-luxe-gold text-black rounded hover:bg-luxe-gold/90"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
