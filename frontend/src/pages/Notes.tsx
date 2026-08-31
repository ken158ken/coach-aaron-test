/**
 * Notes — 我的課程筆記本（會員視角）
 * @module pages/Notes
 * @theme studio
 *
 * 與 `/admin/notes` 共用 `components/notes/NotesHome`；角色（owner / client）
 * 由 API 回傳決定，所以教練從這個網址進來也會看到所有筆記本。
 *
 * 客戶只會看到「自己的 × 有有效課程授權」的筆記本 —— 後端已依 user_courses
 * 過濾，前端不需要（也不該）自己判斷授權。
 */

import React from "react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import NotesHome from "@/components/notes/NotesHome";

const Notes: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div
      data-tour="notes-page"
      className="mx-auto max-w-6xl px-4 py-10 sm:py-16"
    >
      <SEOHead title={t.notes.seoTitle} noIndex={true} />

      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-light tracking-wide text-inherit">
          {t.notes.heading}
        </h1>
        <p className="mt-1 text-sm text-muted">{t.notes.subtitle}</p>
      </header>

      <NotesHome />
    </div>
  );
};

export default Notes;
