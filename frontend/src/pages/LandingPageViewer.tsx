/**
 * LandingPageViewer - 公開 Landing Page 檢視頁面
 * @module pages/LandingPageViewer
 * @description 顯示已發布的自訂 Landing Page（Demo 版本）
 */

import React from "react";
import { useParams, Link } from "react-router-dom";

/** Demo 頁面資料（與 LandingPageManager 同步） */
const DEMO_PAGES = [
  {
    id: "lp-1",
    title: "2026 春季特訓班 — 限時早鳥優惠",
    slug: "2026-spring-bootcamp",
    description: "6 週密集訓練，報名享 85 折＋免費體適能評估",
    status: "published",
  },
  {
    id: "lp-2",
    title: "一對一私人教練體驗課",
    slug: "private-coaching-trial",
    description: "首次體驗價 $500，含身體組成分析報告",
    status: "draft",
  },
  {
    id: "lp-3",
    title: "企業員工健康方案",
    slug: "corporate-wellness",
    description: "客製化團體課程，提升團隊體能與工作效率",
    status: "published",
  },
  {
    id: "lp-4",
    title: "線上營養諮詢服務",
    slug: "online-nutrition",
    description: "搭配訓練的專業飲食計畫，遠端即可進行",
    status: "archived",
  },
];

const LandingPageViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = DEMO_PAGES.find((p) => p.slug === slug);

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-4">
        <p className="text-6xl mb-6">404</p>
        <h1 className="text-2xl font-light mb-2">找不到此頁面</h1>
        <p className="text-white/40 text-sm mb-8">/{slug} 不存在或已被移除</p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-[#C9A96E] text-black rounded-lg text-sm font-medium hover:bg-[#C9A96E]/90 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    );
  }

  if (page.status !== "published") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-4">
        <p className="text-5xl mb-6">🚧</p>
        <h1 className="text-2xl font-light mb-2">頁面尚未發布</h1>
        <p className="text-white/40 text-sm mb-8">此頁面目前為{page.status === "draft" ? "草稿" : "已封存"}狀態</p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-[#C9A96E] text-black rounded-lg text-sm font-medium hover:bg-[#C9A96E]/90 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white font-sans">
      {/* Hero */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700,
            marginBottom: 16,
            color: "#C9A96E",
            lineHeight: 1.2,
          }}
        >
          {page.title}
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#aaa",
            maxWidth: 600,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          {page.description}
        </p>
        <Link
          to="/contact"
          style={{
            display: "inline-block",
            padding: "14px 40px",
            background: "#C9A96E",
            color: "#000",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          立即諮詢 →
        </Link>
      </section>

      {/* Feature section */}
      <section style={{ padding: "60px 20px", background: "#0a0a1a" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            gap: 40,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["專業指導", "客製計畫", "成效保證"].map((feat) => (
            <div
              key={feat}
              style={{
                flex: "1",
                minWidth: 250,
                padding: 30,
                background: "rgba(201,169,110,0.05)",
                border: "1px solid rgba(201,169,110,0.15)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#C9A96E", marginBottom: 12, fontSize: 18 }}>
                {feat}
              </h3>
              <p style={{ color: "#999", fontSize: 14, lineHeight: 1.6 }}>
                Aaron 教練多年經驗，為您量身打造最適合的訓練方案
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "60px 20px",
          textAlign: "center",
          background: "#16213e",
        }}
      >
        <h2 style={{ color: "#fff", fontSize: 28, marginBottom: 12 }}>
          準備好開始了嗎？
        </h2>
        <p style={{ color: "#aaa", marginBottom: 32 }}>
          名額有限，立即預約免費體驗
        </p>
        <Link
          to="/contact"
          style={{
            display: "inline-block",
            padding: "14px 40px",
            background: "#C9A96E",
            color: "#000",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          免費預約體驗
        </Link>
      </section>

      {/* Demo notice */}
      <div
        style={{
          textAlign: "center",
          padding: "12px",
          background: "rgba(255,200,0,0.08)",
          borderTop: "1px solid rgba(255,200,0,0.15)",
          fontSize: 12,
          color: "rgba(255,200,0,0.6)",
        }}
      >
        Demo 頁面 ・ 使用 GrapesJS 編輯器可自訂此頁面內容
      </div>
    </div>
  );
};

export default LandingPageViewer;
