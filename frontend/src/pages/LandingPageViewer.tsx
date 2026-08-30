/**
 * LandingPageViewer — 公開 Landing Page 檢視頁面
 *
 * 透過 custom_slug 取得已發布的 Landing Page，
 * 依 lp_templates.jsx_component_key 動態選擇對應的 React 渲染元件。
 */

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { landingService } from "../services/site/landing.service";
import type { LpPublicProject, LpResolvedField } from "../services/site/landing.service";
import GenericLP       from "../components/landing-templates/GenericLP";
import FitnessDarkLP   from "../components/landing-templates/FitnessDarkLP";
import PricingLP       from "../components/landing-templates/PricingLP";
import MinimalLightLP  from "../components/landing-templates/MinimalLightLP";
import StoryLP         from "../components/landing-templates/StoryLP";
import EditorialLP     from "../components/landing-templates/EditorialLP";
import ShowcaseLP      from "../components/landing-templates/ShowcaseLP";
import GalleryLP       from "../components/landing-templates/GalleryLP";
import CardsLP         from "../components/landing-templates/CardsLP";
import AaronConsultLP  from "../components/landing-templates/AaronConsultLP";
import type { LPProps } from "../components/landing-templates/lpUtils";
import { SEOHead } from "@/components/seo";
import { getInitialData } from "@/ssr/initialData";
import { dataKeys } from "@/ssr/routeData";

// ── 元件路由表 ──────────────────────────────────────────────
// jsx_component_key → React 元件
const TEMPLATE_MAP: Record<string, React.FC<LPProps>> = {
  GenericLP,
  FitnessDarkLP,
  PricingLP,
  MinimalLightLP,
  StoryLP,
  EditorialLP,
  ShowcaseLP,
  GalleryLP,
  CardsLP,
  AaronConsultLP,
};

// ── Error / Loading UI ──────────────────────────────────────

const NotFoundPage: React.FC<{ slug: string }> = ({ slug }) => (
  <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center text-white px-4">
    <p className="text-7xl font-thin mb-6 text-white/10">404</p>
    <h1 className="text-2xl font-light mb-2">找不到此頁面</h1>
    <p className="text-white/40 text-sm mb-10">/{slug} 不存在或已被移除</p>
    <Link to="/" className="px-6 py-2.5 bg-[#C9A96E] text-black rounded-lg text-sm font-semibold hover:bg-[#C9A96E]/90 transition-colors">
      返回首頁
    </Link>
  </div>
);

const LoadingPage: React.FC = () => (
  <div className="min-h-screen bg-studio-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-t-transparent border-[#C9A96E] rounded-full animate-spin" />
      <p className="text-white/30 text-sm">載入中…</p>
    </div>
  </div>
);

// ── Main component ──────────────────────────────────────────

interface LandingPayload {
  project: LpPublicProject;
  resolvedFields?: LpResolvedField[];
}

const LandingPageViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // ── SSR 預抓資料（key 帶 slug） ──
  const ssrPayload = slug
    ? getInitialData<LandingPayload>(dataKeys.landing(slug))
    : undefined;
  const ssrProject = ssrPayload?.project ?? null;

  const [project, setProject]             = useState<LpPublicProject | null>(ssrProject);
  const [resolvedFields, setResolvedFields] = useState<LpResolvedField[]>(ssrPayload?.resolvedFields ?? []);
  const [status, setStatus]               = useState<"loading" | "ok" | "not_found" | "error">(ssrProject ? "ok" : "loading");

  useEffect(() => {
    if (!slug) { setStatus("not_found"); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await landingService.getProjectBySlug(slug);
        if (cancelled) return;
        setProject(res.project);
        setResolvedFields(res.resolvedFields ?? []);
        setStatus("ok");
      } catch (err: unknown) {
        if (cancelled) return;
        const httpStatus = (err as { response?: { status?: number } })?.response?.status;
        setStatus(httpStatus === 404 ? "not_found" : "error");
        if (httpStatus !== 404) console.error("[LandingPageViewer] 載入失敗", err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ── SEO ──
  // 必須在所有 early return 之前建立，否則 loading / 404 狀態下完全沒有 meta。
  // 此頁原本連 SEOHead 都沒有引入，伺服器端輸出沒有任何 title / description / canonical。
  const seoTitle =
    project?.seo_title ||
    project?.og_title ||
    project?.project_name ||
    (slug ? slug.replace(/[-_]+/g, " ").trim() : "");
  const seoHead = (
    <SEOHead
      title={seoTitle || undefined}
      description={
        project?.seo_description || project?.og_description || undefined
      }
      keywords={project?.seo_keywords ?? []}
      image={project?.og_image_url || project?.hero_image_url || undefined}
      url={`/page/${project?.custom_slug || slug || ""}`}
      // 確定找不到 / 載入失敗時才 noindex。
      // 「尚未載入」不能 noindex —— SSR 預抓逾時時頁面其實是存在的，
      // 若在此輸出 noindex 會反而把好頁面從索引中排除。
      noIndex={status === "not_found" || status === "error"}
      breadcrumbs={
        project ? [{ name: seoTitle, url: `/page/${project.custom_slug}` }] : undefined
      }
    />
  );

  if (status === "loading") {
    return (
      <>
        {seoHead}
        <LoadingPage />
      </>
    );
  }
  if (status === "not_found") {
    return (
      <>
        {seoHead}
        <NotFoundPage slug={slug ?? ""} />
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center text-white px-4">
          <p className="text-5xl mb-6 opacity-30">⚠️</p>
          <h1 className="text-2xl font-light mb-2">載入失敗</h1>
          <p className="text-white/40 text-sm mb-10">發生了一點問題，請稍後再試。</p>
          <Link to="/" className="px-6 py-2.5 bg-[#C9A96E] text-black rounded-lg text-sm font-semibold hover:bg-[#C9A96E]/90 transition-colors">
            返回首頁
          </Link>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        {seoHead}
        <NotFoundPage slug={slug ?? ""} />
      </>
    );
  }

  // 依 jsx_component_key 選擇元件，找不到則 fallback 到 GenericLP
  const componentKey = project.lp_templates?.jsx_component_key ?? "GenericLP";
  const LPComponent = TEMPLATE_MAP[componentKey] ?? GenericLP;

  return (
    <>
      {seoHead}
      <LPComponent project={project} fields={resolvedFields} />
    </>
  );
};

export default LandingPageViewer;
