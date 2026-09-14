/**
 * 法律文件頁：/privacy（隱私權政策）、/terms（服務條款）
 *
 * 純靜態內容頁（比照 About.tsx：i18n + SEOHead + Layout），內容來自
 * locales/legal.ts。文章排版沿用全站 `.prose` 樣式（深淺主題皆已定義），
 * 章節有錨點可深連結（#s-1 …）。
 *
 * 這兩頁是 Google OAuth 品牌驗證與 LINE Login 後台需填的公開網址，
 * **路徑不可更動**（/privacy、/terms）。
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { PageHeader } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { legalDocs, type LegalDocument } from "@/locales/legal";

export type LegalKind = "privacy" | "terms";

interface LegalPageProps {
  kind: LegalKind;
}

/** 依語言格式化「最後更新日期」 */
function formatDate(iso: string, language: "zh-TW" | "en"): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (language === "en") {
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  return `${y} 年 ${m} 月 ${d} 日`;
}

const LegalPage: React.FC<LegalPageProps> = ({ kind }) => {
  const { language, t } = useLanguage();
  const doc: LegalDocument = legalDocs[language][kind];
  const other: LegalKind = kind === "privacy" ? "terms" : "privacy";
  const otherDoc = legalDocs[language][other];
  const path = `/${kind}`;
  const updated = useMemo(() => formatDate(doc.updatedAt, language), [doc.updatedAt, language]);

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title={doc.seo.title}
        description={doc.seo.description}
        url={path}
        breadcrumbs={[{ name: doc.title, url: path }]}
      />

      <div className="relative z-10 pt-20 sm:pt-24 pb-16 sm:pb-24 px-4">
        <div className="studio-container max-w-3xl mx-auto">
          <PageHeader label={doc.label} title={doc.title} />

          <p className="text-center text-muted text-xs sm:text-sm tracking-wider -mt-2 mb-10 sm:mb-14">
            {t.legal.lastUpdated}: {updated}
          </p>

          {/* 目錄 */}
          <nav
            aria-label={t.legal.tocAria}
            className="mb-10 sm:mb-14 rounded-xl border border-gold/15 bg-surface/60 p-5 sm:p-6"
          >
            <p className="text-gold text-xs tracking-[3px] uppercase mb-3">{t.legal.toc}</p>
            <ol className="grid gap-1.5 sm:grid-cols-2 text-sm">
              {doc.sections.map((s, i) => (
                <li key={i}>
                  <a href={`#s-${i + 1}`} className="nav-link text-muted hover:text-gold transition-colors">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="prose max-w-none" data-tour="legal-body">
            {doc.intro.map((p, i) => (
              <p key={`intro-${i}`}>{p}</p>
            ))}

            {doc.sections.map((s, i) => (
              <section key={i} id={`s-${i + 1}`} className="scroll-mt-28">
                <h2>{s.heading}</h2>
                {s.paragraphs?.map((p, j) => (
                  <p key={`p-${j}`}>{p}</p>
                ))}
                {s.bullets && (
                  <ul>
                    {s.bullets.map((b, j) => (
                      <li key={`b-${j}`}>{b}</li>
                    ))}
                  </ul>
                )}
                {s.after?.map((p, j) => (
                  <p key={`a-${j}`}>{p}</p>
                ))}
              </section>
            ))}
          </article>

          {/* 交叉連結 */}
          <div className="mt-12 sm:mt-16 pt-6 border-t border-gold/10 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link to={`/${other}`} className="nav-link text-gold">
              {t.legal.seeAlso}: {otherDoc.title} →
            </Link>
            <Link to="/contact" className="nav-link text-muted">
              {t.nav.contact}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
