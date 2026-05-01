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
import type { LPProps } from "../components/landing-templates/lpUtils";

// ── 元件路由表 ──────────────────────────────────────────────
// jsx_component_key → React 元件
const TEMPLATE_MAP: Record<string, React.FC<LPProps>> = {
  GenericLP,
  FitnessDarkLP,
  PricingLP,
  MinimalLightLP,
  StoryLP,
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

const LandingPageViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [project, setProject]             = useState<LpPublicProject | null>(null);
  const [resolvedFields, setResolvedFields] = useState<LpResolvedField[]>([]);
  const [status, setStatus]               = useState<"loading" | "ok" | "not_found" | "error">("loading");

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

  if (status === "loading") return <LoadingPage />;
  if (status === "not_found") return <NotFoundPage slug={slug ?? ""} />;

  if (status === "error") {
    return (
      <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center text-white px-4">
        <p className="text-5xl mb-6 opacity-30">⚠️</p>
        <h1 className="text-2xl font-light mb-2">載入失敗</h1>
        <p className="text-white/40 text-sm mb-10">發生了一點問題，請稍後再試。</p>
        <Link to="/" className="px-6 py-2.5 bg-[#C9A96E] text-black rounded-lg text-sm font-semibold hover:bg-[#C9A96E]/90 transition-colors">
          返回首頁
        </Link>
      </div>
    );
  }

  if (!project) return <NotFoundPage slug={slug ?? ""} />;

  // 依 jsx_component_key 選擇元件，找不到則 fallback 到 GenericLP
  const componentKey = project.lp_templates?.jsx_component_key ?? "GenericLP";
  const LPComponent = TEMPLATE_MAP[componentKey] ?? GenericLP;

  return <LPComponent project={project} fields={resolvedFields} />;
};

export default LandingPageViewer;
