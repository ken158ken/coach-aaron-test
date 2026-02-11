/**
 * AdminContent 頁面 - 內容管理
 * 管理網站文案內容 + 首頁彈窗
 *
 * @module pages/admin/AdminContent
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  PillButton,
  Input,
  Textarea,
  Modal,
  useDialog,
  RichTextEditor,
} from "@/components/ui";
import { Toggle } from "@/components/ui/form";
import {
  contentService,
  type SiteContent,
  type SitePopup,
} from "@/services/content.service";
import { getTemplates, type ContentTemplate } from "@/utils/contentTemplates";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminContent] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminContent] ${msg}`, err || ""),
};

type TabType = "content" | "popup";

/**
 * TemplatePicker - 預設範本選擇器元件
 * 供管理員在新增/編輯內容時快速套用範本
 */
const TemplatePicker: React.FC<{
  contentKey: string;
  onSelect: (value: string) => void;
}> = ({ contentKey, onSelect }) => {
  const templates: ContentTemplate[] = getTemplates(contentKey);

  if (templates.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm text-luxe-muted">
        📋 預設範本（點擊快速套用）
      </label>
      <div className="flex flex-wrap gap-2">
        {templates.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(tpl.value)}
            className="group relative px-3 py-1.5 text-xs rounded-lg border border-luxe-gold/20 text-luxe-text/70 hover:border-luxe-gold/50 hover:text-luxe-gold hover:bg-luxe-gold/5 transition-all"
            title={tpl.value}
          >
            {tpl.name}
            {/* Tooltip preview */}
            <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-luxe-surface border border-luxe-gold/30 rounded-lg text-xs text-luxe-text/80 whitespace-pre-wrap max-w-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
              {tpl.value.length > 100
                ? tpl.value.slice(0, 100) + "..."
                : tpl.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * AdminContent - 內容管理頁面
 * 包含兩個分頁：網站文案 / 首頁彈窗
 */
const AdminContent: React.FC = () => {
  const dialog = useDialog();

  // ===== 分頁狀態 =====
  const [activeTab, setActiveTab] = useState<TabType>("content");

  // ===== 網站文案狀態 =====
  const [sections, setSections] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSection, setEditingSection] = useState<SiteContent | null>(
    null,
  );
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // ===== 新增文案狀態 =====
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContentForm, setNewContentForm] = useState({
    contentKey: "",
    contentName: "",
    contentValue: "",
    contentType: "text" as "text" | "html",
  });

  // ===== 彈窗管理狀態 =====
  const [popups, setPopups] = useState<SitePopup[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState<SitePopup | null>(null);
  const [popupForm, setPopupForm] = useState({
    popupTitle: "",
    popupContent: "",
    showOnce: true,
    startDate: "",
    endDate: "",
  });

  // ===== 載入網站文案 =====
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await contentService.getAllAdmin();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error("載入網站內容失敗", err);
      setError("載入網站內容失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== 載入彈窗 =====
  const fetchPopups = useCallback(async () => {
    try {
      setPopupLoading(true);
      const data = await contentService.getAllPopups();
      setPopups(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error("載入彈窗失敗", err);
    } finally {
      setPopupLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchPopups();
  }, [fetchContent, fetchPopups]);

  // ===== 文案操作 =====
  const handleEdit = (section: SiteContent) => {
    setEditingSection(section);
    setEditContent(section.content_value);
  };

  const handleSaveContent = async () => {
    if (!editingSection) return;
    try {
      setSaving(true);
      await contentService.updateContent(editingSection.content_id, {
        contentValue: editContent,
      });
      logger.info("網站內容已更新", { key: editingSection.content_key });
      setEditingSection(null);
      fetchContent();
    } catch (err) {
      logger.error("更新內容失敗", err);
      setError("更新內容失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateContent = async () => {
    if (!newContentForm.contentKey || !newContentForm.contentName) {
      setError("Key 和名稱為必填");
      return;
    }
    try {
      setSaving(true);
      await contentService.createContent({
        contentKey: newContentForm.contentKey,
        contentName: newContentForm.contentName,
        contentValue: newContentForm.contentValue,
        contentType: newContentForm.contentType,
        sortOrder: sections.length + 1,
      });
      logger.info("新增網站內容", { key: newContentForm.contentKey });
      setShowCreateModal(false);
      setNewContentForm({
        contentKey: "",
        contentName: "",
        contentValue: "",
        contentType: "text",
      });
      fetchContent();
    } catch (err) {
      logger.error("新增內容失敗", err);
      setError("新增內容失敗（Key 可能已存在）");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContent = async (section: SiteContent) => {
    const confirmed = await dialog.confirm({
      title: "刪除內容",
      message: `確定要刪除「${section.content_name}」嗎？此操作無法復原。`,
      variant: "danger",
      confirmText: "刪除",
    });
    if (!confirmed) return;

    try {
      await contentService.deleteContent(section.content_id);
      logger.info("刪除網站內容", { key: section.content_key });
      fetchContent();
    } catch (err) {
      logger.error("刪除內容失敗", err);
      setError("刪除內容失敗");
    }
  };

  // ===== 彈窗操作 =====
  const openPopupModal = (popup?: SitePopup) => {
    if (popup) {
      setEditingPopup(popup);
      setPopupForm({
        popupTitle: popup.popup_title,
        popupContent: popup.popup_content,
        showOnce: popup.show_once,
        startDate: popup.start_date
          ? new Date(popup.start_date).toISOString().slice(0, 16)
          : "",
        endDate: popup.end_date
          ? new Date(popup.end_date).toISOString().slice(0, 16)
          : "",
      });
    } else {
      setEditingPopup(null);
      setPopupForm({
        popupTitle: "",
        popupContent: "",
        showOnce: true,
        startDate: "",
        endDate: "",
      });
    }
    setShowPopupModal(true);
  };

  const handleSavePopup = async () => {
    if (!popupForm.popupTitle.trim()) {
      setError("彈窗標題為必填");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        popupTitle: popupForm.popupTitle,
        popupContent: popupForm.popupContent,
        showOnce: popupForm.showOnce,
        startDate: popupForm.startDate || null,
        endDate: popupForm.endDate || null,
      };

      if (editingPopup) {
        await contentService.updatePopup(editingPopup.popup_id, payload);
        logger.info("彈窗已更新", { id: editingPopup.popup_id });
      } else {
        await contentService.createPopup(payload);
        logger.info("新增彈窗成功");
      }

      setShowPopupModal(false);
      fetchPopups();
    } catch (err) {
      logger.error("儲存彈窗失敗", err);
      setError("儲存彈窗失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePopupActive = async (popup: SitePopup) => {
    try {
      const newActive = !popup.is_active;
      await contentService.updatePopup(popup.popup_id, {
        isActive: newActive,
      });
      logger.info("彈窗狀態切換", {
        id: popup.popup_id,
        active: newActive,
      });
      fetchPopups();
    } catch (err) {
      logger.error("切換彈窗狀態失敗", err);
      setError("切換彈窗狀態失敗");
    }
  };

  const handleDeletePopup = async (popup: SitePopup) => {
    const confirmed = await dialog.confirm({
      title: "刪除彈窗",
      message: `確定要刪除「${popup.popup_title || "未命名彈窗"}」嗎？`,
      variant: "danger",
      confirmText: "刪除",
    });
    if (!confirmed) return;

    try {
      await contentService.deletePopup(popup.popup_id);
      logger.info("刪除彈窗", { id: popup.popup_id });
      fetchPopups();
    } catch (err) {
      logger.error("刪除彈窗失敗", err);
      setError("刪除彈窗失敗");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-light text-luxe-text">內容管理</h1>
          <p className="text-luxe-muted">管理網站文案內容與首頁彈窗</p>
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "content"
              ? "bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30"
              : "text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface"
          }`}
        >
          📝 網站文案
        </button>
        <button
          onClick={() => setActiveTab("popup")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "popup"
              ? "bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/30"
              : "text-luxe-muted hover:text-luxe-text hover:bg-luxe-surface"
          }`}
        >
          🪟 首頁彈窗
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
          <button
            className="ml-2 text-red-300 hover:text-red-100"
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== 網站文案分頁 ===== */}
      {activeTab === "content" && (
        <div>
          <div className="flex justify-end mb-4">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowCreateModal(true)}
            >
              + 新增欄位
            </PillButton>
          </div>

          {loading ? (
            <div className="text-center py-12 text-luxe-muted">載入中...</div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              尚無內容，請執行資料庫 Migration 後重新載入
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <div
                  key={section.content_id}
                  className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-luxe-text font-medium">
                          {section.content_name}
                        </h3>
                        {!section.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded">
                            已停用
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-luxe-gold/10 text-luxe-gold/60 rounded">
                          {section.content_type}
                        </span>
                      </div>
                      <p className="text-luxe-muted text-xs mb-3">
                        Key: {section.content_key}
                      </p>
                      <p className="text-luxe-text/80 text-sm line-clamp-3 whitespace-pre-wrap">
                        {section.content_value || "(空白)"}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <PillButton
                        theme="luxe"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(section)}
                      >
                        編輯
                      </PillButton>
                      <button
                        onClick={() => handleDeleteContent(section)}
                        className="text-red-400 hover:text-red-300 text-sm px-2"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 首頁彈窗分頁 ===== */}
      {activeTab === "popup" && (
        <div>
          <div className="flex justify-end mb-4">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => openPopupModal()}
            >
              + 新增彈窗
            </PillButton>
          </div>

          {popupLoading ? (
            <div className="text-center py-12 text-luxe-muted">載入中...</div>
          ) : popups.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              尚無彈窗，點擊上方按鈕新增
            </div>
          ) : (
            <div className="space-y-4">
              {popups.map((popup) => (
                <div
                  key={popup.popup_id}
                  className={`bg-luxe-surface rounded-lg border p-6 transition-all ${
                    popup.is_active
                      ? "border-luxe-gold/40 shadow-md shadow-luxe-gold/10"
                      : "border-luxe-gold/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-luxe-text font-medium">
                          {popup.popup_title || "未命名彈窗"}
                        </h3>
                        {popup.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded animate-pulse">
                            🟢 啟用中
                          </span>
                        )}
                        {popup.show_once && (
                          <span className="text-xs px-2 py-0.5 bg-luxe-gold/10 text-luxe-gold/60 rounded">
                            僅顯示一次
                          </span>
                        )}
                      </div>
                      {(popup.start_date || popup.end_date) && (
                        <p className="text-luxe-muted text-xs mb-2">
                          ⏰{" "}
                          {popup.start_date
                            ? new Date(popup.start_date).toLocaleString("zh-TW")
                            : "立即"}
                          {" → "}
                          {popup.end_date
                            ? new Date(popup.end_date).toLocaleString("zh-TW")
                            : "永久"}
                        </p>
                      )}
                      <div
                        className="text-luxe-text/60 text-sm line-clamp-2 [&>*]:m-0"
                        dangerouslySetInnerHTML={{
                          __html:
                            popup.popup_content.slice(0, 200) || "(空白內容)",
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Toggle
                        theme="luxe"
                        checked={popup.is_active}
                        onChange={() => handleTogglePopupActive(popup)}
                      />
                      <PillButton
                        theme="luxe"
                        variant="outline"
                        size="sm"
                        onClick={() => openPopupModal(popup)}
                      >
                        編輯
                      </PillButton>
                      <button
                        onClick={() => handleDeletePopup(popup)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 編輯文案 Modal ===== */}
      <Modal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        title={`編輯 - ${editingSection?.content_name || ""}`}
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Key（唯讀）"
            value={editingSection?.content_key || ""}
            disabled
            theme="luxe"
          />
          {/* 範本選擇器 */}
          {editingSection && (
            <TemplatePicker
              contentKey={editingSection.content_key}
              onSelect={(value) => setEditContent(value)}
            />
          )}
          <Textarea
            label="內容"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            theme="luxe"
            rows={8}
          />
          <div className="flex justify-end gap-3">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setEditingSection(null)}
            >
              取消
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSaveContent}
              disabled={saving}
            >
              {saving ? "儲存中..." : "儲存"}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== 新增文案 Modal ===== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增網站內容"
        theme="luxe"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="識別碼 (Key) *"
            value={newContentForm.contentKey}
            onChange={(e) =>
              setNewContentForm({
                ...newContentForm,
                contentKey: e.target.value.replace(/\s/g, "_").toLowerCase(),
              })
            }
            placeholder="例如: hero_cta_text"
            theme="luxe"
          />
          <Input
            label="顯示名稱 *"
            value={newContentForm.contentName}
            onChange={(e) =>
              setNewContentForm({
                ...newContentForm,
                contentName: e.target.value,
              })
            }
            placeholder="例如: 首頁行動按鈕文字"
            theme="luxe"
          />
          <div>
            <label className="block text-sm text-luxe-muted mb-1">
              內容類型
            </label>
            <select
              value={newContentForm.contentType}
              onChange={(e) =>
                setNewContentForm({
                  ...newContentForm,
                  contentType: e.target.value as "text" | "html",
                })
              }
              className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
            >
              <option value="text">純文字</option>
              <option value="html">HTML</option>
            </select>
          </div>
          {/* 範本選擇器 - 根據輸入的 Key 動態顯示 */}
          {newContentForm.contentKey && (
            <TemplatePicker
              contentKey={newContentForm.contentKey}
              onSelect={(value) =>
                setNewContentForm({ ...newContentForm, contentValue: value })
              }
            />
          )}
          <Textarea
            label="初始內容"
            value={newContentForm.contentValue}
            onChange={(e) =>
              setNewContentForm({
                ...newContentForm,
                contentValue: e.target.value,
              })
            }
            theme="luxe"
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleCreateContent}
              disabled={saving}
            >
              {saving ? "新增中..." : "新增"}
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* ===== 彈窗編輯 Modal ===== */}
      <Modal
        isOpen={showPopupModal}
        onClose={() => setShowPopupModal(false)}
        title={editingPopup ? "編輯彈窗" : "新增彈窗"}
        theme="luxe"
        size="full"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label="彈窗標題 *"
            value={popupForm.popupTitle}
            onChange={(e) =>
              setPopupForm({ ...popupForm, popupTitle: e.target.value })
            }
            placeholder="例如: 新年優惠活動"
            theme="luxe"
          />

          <div>
            <label className="block text-sm text-luxe-muted mb-2">
              彈窗內容（富文本編輯器）
            </label>
            <RichTextEditor
              content={popupForm.popupContent}
              onChange={(html) =>
                setPopupForm({ ...popupForm, popupContent: html })
              }
              theme="luxe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-luxe-muted mb-1">
                開始時間（選填）
              </label>
              <input
                type="datetime-local"
                value={popupForm.startDate}
                onChange={(e) =>
                  setPopupForm({ ...popupForm, startDate: e.target.value })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-muted mb-1">
                結束時間（選填）
              </label>
              <input
                type="datetime-local"
                value={popupForm.endDate}
                onChange={(e) =>
                  setPopupForm({ ...popupForm, endDate: e.target.value })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Toggle
              theme="luxe"
              checked={popupForm.showOnce}
              onChange={(checked) =>
                setPopupForm({ ...popupForm, showOnce: checked })
              }
            />
            <span className="text-sm text-luxe-text">
              每位用戶僅顯示一次（使用 localStorage 記錄）
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-luxe-gold/10">
            <PillButton
              theme="luxe"
              variant="outline"
              onClick={() => setShowPopupModal(false)}
            >
              取消
            </PillButton>
            <PillButton
              theme="luxe"
              variant="filled"
              onClick={handleSavePopup}
              disabled={saving}
            >
              {saving ? "儲存中..." : "儲存"}
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminContent;
