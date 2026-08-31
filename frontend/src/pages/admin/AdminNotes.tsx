/**
 * AdminNotes — 客戶筆記本（教練視角）
 * @module pages/admin/AdminNotes
 * @theme luxe
 *
 * 阿倫 × 買了特定課程的客戶「雙人共筆」。教練在這裡建立筆記本、
 * 維護頁面樹與內容；客戶在 `/notes` 看到同一本、同一套編輯器。
 *
 * 頁面本身只負責 luxe 外框與標題，資料與互動都在
 * `components/notes/NotesHome`（與 `/notes` 共用同一支）。
 *
 * 透明度白名單：luxe-gold 只用 index.css 已定義的 /5 /10 /15 /20 /25 /30。
 */

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import NotesHome from "@/components/notes/NotesHome";

const AdminNotes: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div data-tour="adminnotes-page">
      <header className="mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-light tracking-wide text-luxe-text">
          {t.adminNotesPage.heading}
        </h1>
        <p className="mt-1 text-sm text-luxe-muted">
          {t.adminNotesPage.subtitle}
        </p>
      </header>

      <NotesHome />
    </div>
  );
};

export default AdminNotes;
