/**
 * 筆記本首頁容器：列表 ↔ 工作區的切換 + 503（migration 未貼）處理
 * @module components/notes/NotesHome
 *
 * `/admin/notes` 與 `/notes` 共用這一支；外框（luxe / studio）由各自的頁面
 * 負責，這裡只管資料與狀態。角色一律由 API 的 `role` 決定 ——
 * admin 從 `/notes` 進來也會拿到 owner，看得到所有筆記本。
 *
 * 選到哪一本記在 state 而非路由：本批不開 `/notes/:id` 深連結（下一批看板
 * 才需要可分享的網址），少一組路由就少一份 SSR 與守衛要顧。
 */

import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  notesService,
  isNotesUnavailable,
  serverMessageOf,
  type NotebookSummary,
  type NoteRole,
} from "@/services/notes/notes.service";
import NotebookList from "./NotebookList";
import NotesWorkspace from "./NotesWorkspace";

const NotesHome: React.FC = () => {
  const { t } = useLanguage();
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);
  const [role, setRole] = useState<NoteRole>("client");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const res = await notesService.listNotebooks();
      setRole(res.role);
      setNotebooks(res.notebooks || []);
      setUnavailable(false);
    } catch (err) {
      if (isNotesUnavailable(err)) {
        setUnavailable(true);
      } else {
        setError(serverMessageOf(err) || t.notes.loadFailed);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  /** 回列表時順手重抓一次：剛編輯過的筆記本 updatedAt 才會即時更新 */
  const handleBack = useCallback(() => {
    setOpenId(null);
    void loadList();
  }, [loadList]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        {t.common.loading}
      </div>
    );
  }

  /* 039_client_notes.sql 尚未貼進 Supabase —— 這不是錯誤，是「還沒開通」 */
  if (unavailable) {
    return (
      <div
        data-tour="notes-unavailable"
        className="mx-auto max-w-lg rounded-lg border border-gold/20 bg-surface p-6 text-center"
      >
        <h2 className="mb-2 font-display text-lg font-light tracking-wide">
          {t.notes.unavailableTitle}
        </h2>
        <p className="text-sm text-muted">{t.notes.unavailableBody}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void loadList()}
          className="rounded border border-gold/40 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10"
        >
          {t.notes.retry}
        </button>
      </div>
    );
  }

  if (openId !== null) {
    return <NotesWorkspace notebookId={openId} onBack={handleBack} />;
  }

  return (
    <NotebookList
      notebooks={notebooks}
      role={role}
      onOpen={setOpenId}
      onChanged={loadList}
    />
  );
};

export default NotesHome;
