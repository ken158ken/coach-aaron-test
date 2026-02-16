/**
 * LandingPageEditor - GrapesJS 視覺化 Landing Page 編輯器
 *
 * 獨立全螢幕頁面（不套 AdminLayout），
 * 類似 ArticleEditor / CourseEditor 的模式。
 *
 * Demo 版本 — 資料僅存於本地 state，不寫入資料庫。
 *
 * @module pages/admin/LandingPageEditor
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import grapesjsPresetWebpage from "grapesjs-preset-webpage";
import grapesjsBlocksBasic from "grapesjs-blocks-basic";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[LandingPageEditor] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[LandingPageEditor] ${msg}`, err || ""),
};

/* ================================================================== */
/*  主元件                                                              */
/* ================================================================== */

/**
 * LandingPageEditor - GrapesJS 全螢幕編輯器
 *
 * @returns {JSX.Element} Landing Page 編輯器
 */
const LandingPageEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageTitle, setPageTitle] = useState(id ? "載入中..." : "未命名頁面");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /** 是否為編輯模式（有 id） */
  const isEditMode = Boolean(id);

  /* ── 初始化 GrapesJS ── */

  useEffect(() => {
    if (!containerRef.current || initialized) return;

    try {
      logger.info("初始化 GrapesJS 編輯器...");

      const editor = grapesjs.init({
        container: containerRef.current,
        height: "100%",
        width: "auto",
        fromElement: false,
        storageManager: false, // Demo 不儲存
        plugins: [grapesjsPresetWebpage, grapesjsBlocksBasic],
        pluginsOpts: {
          "grapesjs-preset-webpage": {
            blocksBasicOpts: { flexGrid: true },
            navbarOpts: false,
            countdownOpts: false,
            formsOpts: false,
          },
          "grapesjs-blocks-basic": {
            flexGrid: true,
          },
        },
        canvas: {
          styles: [
            "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
          ],
        },
        deviceManager: {
          devices: [
            { name: "Desktop", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "992px" },
            { name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },
        panels: {
          defaults: [],
        },
      });

      // ── 自訂面板按鈕 ──
      editor.Panels.addPanel({
        id: "devices",
        el: ".panel__devices",
        buttons: [
          {
            id: "device-desktop",
            label: '<span title="桌面版">🖥</span>',
            command: "set-device-desktop",
            active: true,
            togglable: false,
          },
          {
            id: "device-tablet",
            label: '<span title="平板">📱</span>',
            command: "set-device-tablet",
            togglable: false,
          },
          {
            id: "device-mobile",
            label: '<span title="手機">📲</span>',
            command: "set-device-mobile",
            togglable: false,
          },
        ],
      });

      // ── 裝置切換指令 ──
      editor.Commands.add("set-device-desktop", {
        run: (e) => e.setDevice("Desktop"),
      });
      editor.Commands.add("set-device-tablet", {
        run: (e) => e.setDevice("Tablet"),
      });
      editor.Commands.add("set-device-mobile", {
        run: (e) => e.setDevice("Mobile"),
      });

      // ── 預設內容（新增模式） ──
      if (!isEditMode) {
        editor.setComponents(`
          <section style="padding: 80px 20px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; font-family: system-ui, sans-serif;">
            <h1 style="font-size: 48px; font-weight: 700; margin-bottom: 16px; color: #C9A96E;">
              在這裡開始設計您的 Landing Page
            </h1>
            <p style="font-size: 20px; color: #aaa; max-width: 600px; margin: 0 auto 32px;">
              使用左側的區塊面板拖放元件，或雙擊此文字進行編輯
            </p>
            <a href="#" style="display: inline-block; padding: 14px 32px; background: #C9A96E; color: #000; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Call to Action →
            </a>
          </section>
          <section style="padding: 60px 20px; background: #0a0a1a; color: #ddd; font-family: system-ui, sans-serif;">
            <div style="max-width: 1000px; margin: 0 auto; display: flex; gap: 40px; flex-wrap: wrap; justify-content: center;">
              <div style="flex: 1; min-width: 250px; padding: 30px; background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15); border-radius: 12px; text-align: center;">
                <h3 style="color: #C9A96E; margin-bottom: 12px;">特色一</h3>
                <p style="color: #999; font-size: 14px;">描述您的第一個賣點，讓訪客了解價值所在</p>
              </div>
              <div style="flex: 1; min-width: 250px; padding: 30px; background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15); border-radius: 12px; text-align: center;">
                <h3 style="color: #C9A96E; margin-bottom: 12px;">特色二</h3>
                <p style="color: #999; font-size: 14px;">描述您的第二個賣點，建立信任與專業形象</p>
              </div>
              <div style="flex: 1; min-width: 250px; padding: 30px; background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15); border-radius: 12px; text-align: center;">
                <h3 style="color: #C9A96E; margin-bottom: 12px;">特色三</h3>
                <p style="color: #999; font-size: 14px;">描述您的第三個賣點，促使訪客採取行動</p>
              </div>
            </div>
          </section>
        `);
        setPageTitle("未命名頁面");
      } else {
        // 編輯模式 — Demo 載入假資料
        setPageTitle("（Demo）載入的頁面");
        editor.setComponents(`
          <section style="padding: 60px 20px; text-align: center; background: #1a1a2e; color: #fff;">
            <h1 style="font-size: 36px; color: #C9A96E;">這是 Demo 編輯模式</h1>
            <p style="color: #999; margin-top: 12px;">在實際版本中，此處會從資料庫載入已儲存的 HTML</p>
          </section>
        `);
      }

      editorRef.current = editor;
      setInitialized(true);
      logger.info("GrapesJS 編輯器初始化完成");
    } catch (err) {
      logger.error("GrapesJS 初始化失敗", err);
    }

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch {
          /* ignore */
        }
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 操作 ── */

  /** 取得 HTML + CSS */
  const getOutput = useCallback(() => {
    if (!editorRef.current) return { html: "", css: "" };
    return {
      html: editorRef.current.getHtml() || "",
      css: editorRef.current.getCss() || "",
    };
  }, []);

  /** 儲存（Demo — 只 console.log） */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const output = getOutput();
      logger.info("儲存 Landing Page（Demo）", {
        title: pageTitle,
        htmlLength: output.html.length,
        cssLength: output.css.length,
      });
      // Demo: 輸出到 console
      console.log("=== Landing Page HTML ===");
      console.log(output.html);
      console.log("=== Landing Page CSS ===");
      console.log(output.css);

      // 模擬延遲
      await new Promise((r) => setTimeout(r, 500));
      alert(
        "✅ 已儲存到 Console（Demo 模式）\n\n打開瀏覽器 DevTools 查看 HTML/CSS 輸出",
      );
    } catch (err) {
      logger.error("儲存失敗", err);
    } finally {
      setSaving(false);
    }
  }, [getOutput, pageTitle]);

  /** 預覽 */
  const handlePreview = useCallback(() => {
    const output = getOutput();
    const previewHtml = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${pageTitle}</title>
        <style>${output.css}</style>
      </head>
      <body>${output.html}</body>
      </html>
    `;
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    logger.info("預覽 Landing Page");
  }, [getOutput, pageTitle]);

  /** 返回管理頁 */
  const handleBack = useCallback(() => {
    navigate("/admin/landing-pages");
  }, [navigate]);

  /* ── 渲染 ── */

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-white overflow-hidden">
      {/* 頂部工具列 */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-luxe-gold/10 shrink-0 z-50">
        {/* 左側: 返回 + 標題 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-luxe-muted hover:text-luxe-text transition-colors"
            title="返回管理頁"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回
          </button>
          <div className="w-px h-5 bg-luxe-gold/10" />
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="bg-transparent text-sm text-luxe-text border-none focus:outline-none focus:ring-0 w-48 sm:w-64 placeholder:text-luxe-muted"
            placeholder="頁面標題..."
          />
        </div>

        {/* 中間: 裝置切換 */}
        <div className="panel__devices hidden sm:flex" />

        {/* 右側: 操作按鈕 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="px-3 py-1.5 text-xs text-luxe-muted hover:text-luxe-text border border-luxe-gold/20 rounded-lg transition-colors"
          >
            👁 預覽
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30 rounded-lg hover:bg-luxe-gold/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
                儲存中…
              </>
            ) : (
              "💾 儲存"
            )}
          </button>
        </div>
      </header>

      {/* GrapesJS 編輯器容器 */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />

      {/* 自訂 GrapesJS 主題覆寫 */}
      <style>{`
        /* ── GrapesJS 深色主題覆寫 ── */
        .gjs-one-bg {
          background-color: #0d0d1a !important;
        }
        .gjs-two-color {
          color: #e0e0e0 !important;
        }
        .gjs-three-bg {
          background-color: #16213e !important;
        }
        .gjs-four-color,
        .gjs-four-color-h:hover {
          color: #C9A96E !important;
        }
        /* 面板 */
        .gjs-pn-panel {
          background-color: #0d0d1a !important;
          border-color: rgba(201, 169, 110, 0.1) !important;
        }
        .gjs-pn-btn {
          color: #999 !important;
        }
        .gjs-pn-btn.gjs-pn-active {
          color: #C9A96E !important;
          box-shadow: 0 2px 0 #C9A96E !important;
        }
        /* 區塊面板 */
        .gjs-block {
          background-color: rgba(201, 169, 110, 0.05) !important;
          border: 1px solid rgba(201, 169, 110, 0.1) !important;
          border-radius: 8px !important;
          color: #ccc !important;
          min-height: 60px !important;
          transition: all 0.2s !important;
        }
        .gjs-block:hover {
          border-color: rgba(201, 169, 110, 0.3) !important;
          box-shadow: 0 0 8px rgba(201, 169, 110, 0.1) !important;
        }
        .gjs-block__media svg {
          fill: #C9A96E !important;
        }
        /* 圖層面板 */
        .gjs-layer-name {
          color: #ccc !important;
        }
        .gjs-layer.gjs-selected .gjs-layer-name {
          color: #C9A96E !important;
        }
        /* 樣式管理器 */
        .gjs-sm-sector-title {
          background-color: rgba(201, 169, 110, 0.05) !important;
          border-color: rgba(201, 169, 110, 0.1) !important;
          color: #ccc !important;
        }
        .gjs-field {
          background-color: #16213e !important;
          border-color: rgba(201, 169, 110, 0.15) !important;
          color: #e0e0e0 !important;
        }
        .gjs-field:focus-within {
          border-color: rgba(201, 169, 110, 0.4) !important;
        }
        .gjs-label {
          color: #999 !important;
        }
        /* Toolbar */
        .gjs-toolbar {
          background-color: #0d0d1a !important;
          border: 1px solid rgba(201, 169, 110, 0.2) !important;
          border-radius: 6px !important;
        }
        .gjs-toolbar-item {
          color: #C9A96E !important;
        }
        /* Canvas */
        .gjs-cv-canvas {
          background-color: #1a1a2e !important;
        }
        .gjs-frame-wrapper {
          background-color: #fff !important;
        }
        /* Resizer */
        .gjs-resizer-h {
          border-color: #C9A96E !important;
        }
        /* 選取框 */
        .gjs-selected {
          outline: 2px solid #C9A96E !important;
        }
        .gjs-highlighter {
          outline: 2px solid rgba(201, 169, 110, 0.4) !important;
        }
        /* Trait Manager */
        .gjs-trt-trait {
          color: #ccc !important;
        }
        .gjs-trt-trait input,
        .gjs-trt-trait select {
          background-color: #16213e !important;
          border-color: rgba(201, 169, 110, 0.15) !important;
          color: #e0e0e0 !important;
        }
        /* 捲軸 */
        .gjs-pn-views-container::-webkit-scrollbar,
        .gjs-blocks-cs::-webkit-scrollbar {
          width: 4px;
        }
        .gjs-pn-views-container::-webkit-scrollbar-thumb,
        .gjs-blocks-cs::-webkit-scrollbar-thumb {
          background: rgba(201, 169, 110, 0.2);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default LandingPageEditor;
