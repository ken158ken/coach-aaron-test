/**
 * AdminNotes — 客戶筆記本（教練視角）
 * @module pages/admin/AdminNotes
 * @theme luxe
 *
 * 阿倫 × 買了特定課程的客戶「雙人共筆」。教練在這裡建立筆記本、
 * 維護頁面樹與內容；客戶在 `/notes` 看到同一本、同一套編輯器。
 *
 * 頁面本身只負責 luxe 外框與標題，資料與互動都在
 * `components/notes/AdminNotesHome`：左側「會員 → 筆記本 → 頁面」三層統一樹
 * （筆記本可拖曳：跨會員＝轉移歸屬、同會員內＝交換排序），右側工作區。
 * 會員端 `/notes` 走的是另一支 `NotesHome`（卡片牆），沒有「會員」這一層。
 *
 * 樹與編輯器沿用 studio 色票（`text-muted`/`border-gold/*`）而非 luxe 專用類，
 * 因為右側編輯器（BlockNote）本來就吃那組 token，兩邊混用會色差；
 * 這些 token 在 luxe 版面下同樣有定義，深淺主題都跟著切。
 */

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import AdminNotesHome from "@/components/notes/AdminNotesHome";

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

      <AdminNotesHome />
    </div>
  );
};

export default AdminNotes;
