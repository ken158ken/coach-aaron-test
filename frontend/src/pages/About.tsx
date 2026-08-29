/**
 * About 頁面 - 關於阿倫教官 / 完整經歷
 * @module pages/About
 * @theme studio (深色 studio 主題)
 * @description 公開靜態頁：Hero、職涯時間軸、專業證照、成就數據、自傳、CTA。
 *   內容全為靜態（不打 API），採靜態 import 讓 SSR 直接輸出完整內容利於 SEO。
 *   SSR 安全：render 期間不碰 window/document、不用 Math.random / new Date。
 */

import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui";
import SEOHead from "@/components/seo/SEOHead";

/** 職涯時間軸單筆資料 */
interface TimelineItem {
  period: string;
  role: string;
  org: string;
  summary: string;
  points: string[];
  image: string;
  imageAlt: string;
}

/** 職涯時間軸（依時間正序：早 → 現在） */
const TIMELINE: TimelineItem[] = [
  {
    period: "早期・業務時期",
    role: "房仲業務經紀人",
    org: "房仲不動產業",
    summary:
      "職涯不是從健身房開始，是從房仲開始的；學會的不是話術，是讀人。",
    points: [
      "完整銷售流程跑過無數遍",
      "在被拒絕是日常的環境練出韌性",
      "看懂客戶「我再考慮」背後真正在意什麼",
    ],
    image:
      "https://res.cloudinary.com/daejq0zo9/image/upload/f_auto,q_auto,w_900/v1784556095/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_17_qsdcqo.jpg",
    imageAlt: "阿倫教官早期業務時期",
  },
  {
    period: "轉職・入行",
    role: "私人教練",
    org: "成吉思汗健身（連鎖健身品牌）",
    summary:
      "把業務時期的銷售能力搬進健身房，快速建立穩定私教客群；專業與銷售雙軌並進。",
    points: [
      "體能評估、身體組成分析、個人化課表",
      "同時負責諮詢、成交與續課",
      "走完第一線私教收入循環",
    ],
    image:
      "https://res.cloudinary.com/daejq0zo9/image/upload/f_auto,q_auto,w_900/v1784556003/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_6_rhqnrz.jpg",
    imageAlt: "阿倫教官私人教練時期",
  },
  {
    period: "現職・教練經理／總教官",
    role: "教練經理／總教官",
    org: "威豪健身 Pro Fitness（台東）",
    summary:
      "帶團隊後才真正看懂——一個人業績好是天賦，一整團都好是系統。",
    points: [
      "統籌約 50 人教練團隊（排班、教學品質、招募、客訴）",
      "設定並追蹤業績與續約 KPI",
      "建立教練育成與考核制度",
    ],
    image:
      "https://res.cloudinary.com/daejq0zo9/image/upload/f_auto,q_auto,w_900/v1784556128/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_9_tp7sdh.jpg",
    imageAlt: "阿倫教官現任總教官帶團隊",
  },
];

/** 專業證照 */
const CERTIFICATIONS: string[] = [
  "NSCA-CPT（美國肌力與體能協會 私人教練認證）",
  "TQUK 英國心理諮詢認證",
  "NLP 執行師",
  "Andaction 生活教練",
  "健身教練 C 級",
];

/** 成就數據卡片 */
const STATS: Array<{ value: string; label: string }> = [
  { value: "10 年", label: "產業經驗" },
  { value: "約 50 人", label: "統籌教練團隊" },
  { value: "1000+ 小時", label: "教學與授課" },
  { value: "130+", label: "協助教練提升收入" },
  { value: "58 集", label: "Podcast《陪你健身》" },
  { value: "冠軍", label: "2019 Fit Model 174cm 組" },
];

/**
 * About - 關於阿倫教官頁面
 *
 * @returns {JSX.Element} 關於頁
 */
const About: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title="關於阿倫教官 ｜ 私教變現顧問 ｜ Coach Aaron"
        description="阿倫教官（Coach Aaron）｜私教變現顧問、教練職涯培訓講師。第一線私教出身，現任台東威豪健身總教官，統籌約 50 人教練團隊。純 B2B，專教教練把專業變成穩定收入：從房仲讀人、私教落地到帶團隊系統化的十年職涯經歷。"
        keywords={[
          "阿倫教官",
          "Coach Aaron",
          "私教變現顧問",
          "教練職涯培訓",
          "私人教練培訓",
          "威豪健身總教官",
          "教練經理",
          "健身教練變現",
          "教練育成",
          "私教變現",
        ]}
        url="/about"
        author="阿倫教官"
        breadcrumbs={[{ name: "關於阿倫教官", url: "/about" }]}
      />

      <div className="relative z-10 pt-20 sm:pt-24 pb-16 sm:pb-24 px-4">
        <div className="studio-container max-w-5xl mx-auto">
          {/* ── Hero / 標題區 ── */}
          <PageHeader
            label="About Coach Aaron"
            title="阿倫教官 Coach Aaron"
            subtitle="私教變現顧問 ｜ 教練職涯培訓講師"
          />
          <p
            className="text-center text-muted text-base sm:text-lg font-light leading-relaxed max-w-2xl mx-auto -mt-2 mb-16 sm:mb-24"
            data-aos="fade-up"
          >
            第一線私教出身，現任台東威豪健身總教官，
            <span className="text-gold">專教教練把專業變成穩定收入。</span>
          </p>

          {/* ── 職涯時間軸 ── */}
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-3">
                Career Timeline
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90">
                職涯時間軸
              </h2>
            </div>

            <div className="relative">
              {/* 垂直軸線（md 以上顯示） */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/30 to-transparent"
              />

              <div className="space-y-10 sm:space-y-14">
                {TIMELINE.map((item, index) => {
                  const flip = index % 2 === 1;
                  return (
                    <div
                      key={item.role}
                      className="relative md:grid md:grid-cols-2 md:gap-10 lg:gap-14 md:items-center"
                      data-aos="fade-up"
                      data-aos-delay={index * 60}
                    >
                      {/* 軸點 */}
                      <div
                        aria-hidden="true"
                        className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold ring-4 ring-studio-bg z-10"
                      />

                      {/* 圖片 */}
                      <div
                        className={`mb-4 md:mb-0 ${
                          flip ? "md:order-2" : "md:order-1"
                        }`}
                      >
                        <div className="relative rounded-xl overflow-hidden border border-gold/15 bg-surface">
                          <img
                            src={item.image}
                            alt={item.imageAlt}
                            loading="lazy"
                            className="w-full h-72 sm:h-80 md:h-96 object-cover object-top"
                          />
                          <span className="absolute top-3 left-3 text-[10px] sm:text-xs uppercase tracking-widest text-white/90 bg-black/55 px-2.5 py-1 rounded-full">
                            {`0${index + 1}`}
                          </span>
                        </div>
                      </div>

                      {/* 文字 */}
                      <div
                        className={`${flip ? "md:order-1 md:text-right" : "md:order-2"}`}
                      >
                        <span className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-2">
                          {item.period}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-medium text-white/90 mb-1">
                          {item.role}
                        </h3>
                        <p className="text-sm sm:text-base text-white/50 mb-3">
                          {item.org}
                        </p>
                        <p className="text-sm sm:text-base text-muted font-light leading-relaxed mb-4">
                          {item.summary}
                        </p>
                        <ul
                          className={`space-y-2 text-left ${
                            flip ? "md:ml-auto md:max-w-sm" : "md:max-w-sm"
                          }`}
                        >
                          {item.points.map((pt) => (
                            <li
                              key={pt}
                              className={`flex items-start gap-2.5 text-sm sm:text-base text-white/70 ${
                                flip ? "md:flex-row-reverse md:text-right" : ""
                              }`}
                            >
                              <span className="mt-1.5 w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── 專業證照 ── */}
          <section className="mb-16 sm:mb-24" data-aos="fade-up">
            <div className="text-center mb-8 sm:mb-10">
              <span className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-3">
                Certifications
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90">
                專業證照
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              {CERTIFICATIONS.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-2 text-sm sm:text-base text-white/85 bg-surface border border-gold/20 rounded-full px-4 py-2"
                >
                  <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
                  {cert}
                </span>
              ))}
            </div>
          </section>

          {/* ── 成就數據 ── */}
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-8 sm:mb-10">
              <span className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-3">
                By The Numbers
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90">
                成就數據
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-surface border border-white/8 hover:border-gold/30 transition-colors p-5 sm:p-6 text-center"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <div className="font-display text-2xl sm:text-3xl md:text-4xl text-gold mb-1.5">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-white/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 自傳 ── */}
          <section className="mb-16 sm:mb-24" data-aos="fade-up">
            <div className="text-center mb-8 sm:mb-10">
              <span className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-3">
                My Story
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90">
                我的職涯故事
              </h2>
            </div>
            <div className="max-w-3xl mx-auto rounded-2xl bg-surface border border-gold/15 p-6 sm:p-10">
              <div className="space-y-5 text-base sm:text-lg text-white/75 font-light leading-relaxed">
                <p>
                  我的職涯不是從健身房開始的，是從房仲開始的。在被拒絕是日常的環境裡，我沒學會什麼漂亮話術，反而練出一件更值錢的能力——
                  <span className="text-white/90">讀人</span>
                  ，聽懂客戶那句「我再考慮」背後真正在意的是什麼。
                </p>
                <p>
                  轉行當私人教練之後，我把這套本事搬進健身房，很快建立起穩定客群，走完諮詢、成交到續課的完整收入循環。帶團隊後我才真正看懂——一個人業績好是天賦，一整團都好是系統。於是我把私教與管理的實戰整理成方法：從讀人、成交，到把它變成可以複製的制度。
                </p>
                <p>
                  現在我只教一件事——
                  <span className="text-gold">
                    教練怎麼把技術變成穩定業績。
                  </span>
                  這條路我自己從頭走過一遍，也帶著上百位教練走過，我知道卡在哪、也知道怎麼過。
                </p>
              </div>
            </div>
          </section>

          {/* ── 結尾 CTA ── */}
          <section className="text-center" data-aos="fade-up">
            <div className="page-cta-box bg-surface/60 backdrop-blur-sm border border-gold/20 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-3">
                準備把專業變成穩定收入？
              </h2>
              <p className="text-muted mb-8">
                不論你想先看變現方案，還是直接一對一聊聊你的卡點，我都在。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center rounded-full bg-gold text-studio-bg font-medium px-7 py-3 text-sm sm:text-base hover:bg-gold-dim transition-colors"
                >
                  看變現方案
                </Link>
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-full border border-gold/50 text-gold font-medium px-7 py-3 text-sm sm:text-base hover:bg-gold/10 transition-colors"
                >
                  預約 1 對 1 諮詢
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
