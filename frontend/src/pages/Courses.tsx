/**
 * Courses 頁面 - 課程列表
 * @module pages/Courses
 * @description 教練變現實戰力 - 私人教練陪跑系統
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context";
import { PrismScene } from "@/components/three";
import { GlowButton, PillButton, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";

/** 階段課程資料 */
interface PhaseData {
  phase: string;
  duration: string;
  title: string;
  description: string;
  features: string[];
}

/** 單堂課程資料 */
interface SingleCourse {
  id: string;
  title: string;
  price: number;
  description: string;
}

/** 陪跑方案資料 */
interface CoachingPlan {
  id: string;
  duration: string;
  price: number;
  sessions: number;
  description: string;
  highlight?: boolean;
}

/** 三階段課程內容 */
const PHASES: PhaseData[] = [
  {
    phase: "第一階段",
    duration: "0-3 個月",
    title: "業績衝刺期",
    description: "新客成交 + 現場開發",
    features: [
      "體驗課成交系統",
      "現場開發實戰",
      "成交進度追蹤",
      "每週會議討論",
    ],
  },
  {
    phase: "第二階段",
    duration: "3-6 個月",
    title: "建立長期收入",
    description: "會員經營與續約技巧",
    features: ["會員關係心理學", "續約情緒時機", "轉介紹流程", "客戶管理表單"],
  },
  {
    phase: "第三階段",
    duration: "6-12 個月",
    title: "個人品牌與自媒體",
    description: "打造個人商業模式",
    features: [
      "自媒體定位",
      "口播腳本產出",
      "鏡頭表現力訓練",
      "打造個人商業模式",
    ],
  },
];

/** 附贈單堂課程 */
const SINGLE_COURSES: SingleCourse[] = [
  {
    id: "expression",
    title: "表達力心理學",
    price: 980,
    description: "提升溝通表達能力，建立專業形象",
  },
  {
    id: "objection",
    title: "反對問題成交話術",
    price: 480,
    description: "掌握常見反對問題的應對技巧",
  },
  {
    id: "trial",
    title: "體驗課成交全流程",
    price: 1980,
    description: "從體驗課到成交的完整系統",
  },
  {
    id: "renewal",
    title: "私人教練續約必修課",
    price: 1980,
    description: "提高會員續約率的關鍵技巧",
  },
  {
    id: "coaching",
    title: "一對一陪跑訓練",
    price: 18000,
    description: "個人化指導，加速成長",
  },
  {
    id: "mindset",
    title: "心理韌性與職涯定位",
    price: 18000,
    description: "建立正確心態，規劃長期職涯",
  },
];

/** 陪跑方案 */
const COACHING_PLANS: CoachingPlan[] = [
  {
    id: "3-months",
    duration: "三個月",
    price: 32800,
    sessions: 12,
    description: "1對1培訓 12次",
  },
  {
    id: "6-months",
    duration: "六個月",
    price: 59800,
    sessions: 24,
    description: "1對1培訓 24次",
    highlight: true,
  },
  {
    id: "1-year",
    duration: "一年",
    price: 118000,
    sessions: 48,
    description: "1對1培訓 48次",
  },
];

/** 制度說明 */
const SYSTEM_FEATURES = [
  "每周一次視訊會議，進度檢核與行動指導",
  "指標追蹤（邀約數、成交數、續約率）",
  "即時訊息 24 小時回復",
  "每季成果檢核與策略調整",
];

/**
 * Courses - 課程列表頁面
 *
 * @returns {JSX.Element} 課程頁面
 */
const Courses: React.FC = () => {
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTheme("prism");
    // 模擬載入
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [setTheme]);

  /** 計算附贈總值 */
  const bonusTotal = SINGLE_COURSES.reduce((sum, c) => sum + c.price, 0);

  /** 處理購買點擊 */
  const handlePurchase = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg flex items-center justify-center">
        <Loading theme="prism" text="載入中..." />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-prism-bg">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="教練變現實戰力 | 私人教練陪跑系統"
        description="從銷售、經營到自媒體的陪跑系統，讓你從教練變成經營者。系統化的業績成長路徑，累積穩定客群。"
        keywords={[
          "教練變現",
          "私人教練",
          "健身教練培訓",
          "陪跑系統",
          "教練創業",
        ]}
        url="/courses"
      />

      {/* Three.js Background */}
      <PrismScene />

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-16 sm:mb-20">
            <span className="inline-block text-prism-accent text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              教練變現實戰力
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-prism-text mb-4 sm:mb-6">
              專業變現，打造穩定收入系統
            </h1>
            <p className="text-base sm:text-lg text-prism-text/70 max-w-2xl mx-auto mb-6">
              這是一個從銷售、經營到自媒體的陪跑系統
              <br />
              讓你從教練變成經營者
            </p>

            {/* 痛點列表 */}
            <div className="bg-prism-bg/50 backdrop-blur-sm border border-prism-accent/20 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto mb-8">
              <h3 className="text-lg font-semibold text-prism-text mb-4">
                你是否遇到這些問題？
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-left text-prism-text/80 text-sm sm:text-base">
                <div className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>有專業，但不擅長銷售</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>時間投入多，沒對應報酬</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>談單亂槍打鳥，沒有系統</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>客戶說有效果，卻不買單</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>不擅長破冰做現場開發</span>
                </div>
              </div>
              <p className="mt-4 text-prism-accent font-medium">
                大部分的教練缺一個「專業變現」系統
              </p>
            </div>

            {/* 核心理念 */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-prism-accent/20 to-prism-accent/5 border border-prism-accent/30 rounded-xl px-6 py-4">
                <span className="text-prism-text font-medium">心理韌性</span>
              </div>
              <div className="bg-gradient-to-br from-prism-accent/20 to-prism-accent/5 border border-prism-accent/30 rounded-xl px-6 py-4">
                <span className="text-prism-text font-medium">變現系統</span>
              </div>
              <div className="bg-gradient-to-br from-prism-accent/20 to-prism-accent/5 border border-prism-accent/30 rounded-xl px-6 py-4">
                <span className="text-prism-text font-medium">職涯規劃</span>
              </div>
            </div>
          </section>

          {/* 三階段課程 */}
          <section className="mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-prism-text text-center mb-8 sm:mb-12">
              系統化三階段培訓
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {PHASES.map((phase, index) => (
                <div
                  key={phase.phase}
                  className="bg-luxe-black/80 border border-prism-accent/30 rounded-2xl p-6 sm:p-8 hover:border-prism-accent/60 transition-all duration-300"
                >
                  <div className="text-prism-accent text-sm mb-2">
                    {phase.duration}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-prism-text mb-2">
                    {phase.phase}
                  </h3>
                  <h4 className="text-lg text-prism-text/90 mb-1">
                    {phase.title}
                  </h4>
                  <p className="text-sm text-prism-text/60 mb-4">
                    {phase.description}
                  </p>
                  <ul className="space-y-2">
                    {phase.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-prism-text/80 text-sm"
                      >
                        <span className="w-1.5 h-1.5 bg-prism-accent rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 制度說明 */}
          <section className="mb-16 sm:mb-20">
            <div className="bg-prism-bg/30 backdrop-blur-sm border border-prism-accent/20 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-prism-text text-center mb-8">
                制度說明
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {SYSTEM_FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-prism-text/80"
                  >
                    <svg
                      className="w-5 h-5 text-prism-accent flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 陪跑方案價格 */}
          <section className="mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-prism-text text-center mb-4">
              現場陪跑價格
            </h2>
            <p className="text-center text-prism-text/60 mb-8 sm:mb-12">
              成交只是第一步，能讓教練穩定賺錢的，是系統化的業績成長路徑
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {COACHING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 ${
                    plan.highlight
                      ? "bg-gradient-to-br from-prism-accent/30 to-prism-accent/10 border-2 border-prism-accent"
                      : "bg-luxe-black/60 border border-prism-accent/30"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-prism-accent text-prism-bg text-xs font-bold px-4 py-1 rounded-full">
                      推薦方案
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-prism-text mb-2">
                      {plan.duration}
                    </h3>
                    <div className="text-3xl sm:text-4xl font-bold text-prism-accent mb-2">
                      NT$ {plan.price.toLocaleString()}
                    </div>
                    <p className="text-prism-text/60 mb-6">
                      {plan.description}
                    </p>
                    <GlowButton
                      onClick={() => handlePurchase(plan.id)}
                      size="md"
                      className="w-full"
                    >
                      立即報名
                    </GlowButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 附贈單堂課程 */}
          <section className="mb-16 sm:mb-20">
            <div className="bg-gradient-to-br from-luxe-gold/10 to-luxe-gold/5 border border-luxe-gold/30 rounded-2xl p-6 sm:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-prism-text mb-2">
                  額外附贈
                </h2>
                <p className="text-luxe-gold text-xl font-semibold">
                  總值 NT$ {bonusTotal.toLocaleString()} 元
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SINGLE_COURSES.map((course) => (
                  <div
                    key={course.id}
                    className="bg-luxe-black/50 rounded-xl p-4 border border-luxe-gold/20"
                  >
                    <h4 className="text-prism-text font-medium mb-1">
                      {course.title}
                    </h4>
                    <p className="text-luxe-gold text-sm mb-2">
                      NT$ {course.price.toLocaleString()}
                    </p>
                    <p className="text-prism-text/60 text-sm">
                      {course.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-prism-text mb-4">
              準備好開始你的教練變現之路了嗎？
            </h2>
            <p className="text-prism-text/70 mb-8">
              累積穩定客群，讓教練職涯越做越輕鬆
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <GlowButton onClick={() => handlePurchase("6-months")} size="lg">
                立即報名
              </GlowButton>
              <PillButton
                theme="prism"
                variant="outline"
                onClick={() => navigate("/contact")}
              >
                預約諮詢
              </PillButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Courses;
