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
import { useLanguage } from "@/context/LanguageContext";

/**
 * 職涯時間軸的「非文字」資料。
 * 文案（period / role / org / summary / points / imageAlt）改由
 * `t.aboutPage.timeline.items` 依索引提供，兩邊長度必須一致；
 * `id` 只作為 React key 與日後追蹤用，不顯示給使用者。
 */
interface TimelineMedia {
  id: string;
  image: string;
}

/** 職涯時間軸圖片（依時間正序：早 → 現在，需與字典 items 對齊） */
const TIMELINE_MEDIA: TimelineMedia[] = [
  {
    id: "real-estate",
    image:
      "https://res.cloudinary.com/daejq0zo9/image/upload/f_auto,q_auto,w_900/v1784556095/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_17_qsdcqo.jpg",
  },
  {
    id: "personal-trainer",
    image:
      "https://res.cloudinary.com/daejq0zo9/image/upload/f_auto,q_auto,w_900/v1784556003/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_6_rhqnrz.jpg",
  },
  {
    id: "head-coach",
    image:
      "https://res.cloudinary.com/daejq0zo9/image/upload/f_auto,q_auto,w_900/v1784556128/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_9_tp7sdh.jpg",
  },
];

/**
 * About - 關於阿倫教官頁面
 *
 * @returns {JSX.Element} 關於頁
 */
const About: React.FC = () => {
  const { t } = useLanguage();
  const about = t.aboutPage;

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title={about.seo.title}
        description={about.seo.description}
        keywords={about.seo.keywords}
        url="/about"
        author={about.seo.author}
        breadcrumbs={[{ name: about.seo.breadcrumb, url: "/about" }]}
      />

      <div className="relative z-10 pt-20 sm:pt-24 pb-16 sm:pb-24 px-4">
        <div className="studio-container max-w-5xl mx-auto">
          {/* ── Hero / 標題區 ── */}
          <PageHeader
            label="About Coach Aaron"
            title={about.hero.title}
            subtitle={about.hero.subtitle}
          />
          <p
            className="text-center text-muted text-base sm:text-lg font-light leading-relaxed max-w-2xl mx-auto -mt-2 mb-16 sm:mb-24"
            data-aos="fade-up"
          >
            {about.hero.leadBefore}
            <span className="text-gold">{about.hero.leadHighlight}</span>
          </p>

          {/* ── 職涯時間軸 ── */}
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-3">
                Career Timeline
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90">
                {about.timeline.heading}
              </h2>
            </div>

            <div className="relative">
              {/* 垂直軸線（md 以上顯示） */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/30 to-transparent"
              />

              <div className="space-y-10 sm:space-y-14">
                {TIMELINE_MEDIA.map((media, index) => {
                  const item = about.timeline.items[index];
                  // 字典與圖片陣列長度不一致時直接略過，避免 render 期間爆錯
                  if (!item) return null;
                  const flip = index % 2 === 1;
                  return (
                    <div
                      key={media.id}
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
                            src={media.image}
                            alt={item.imageAlt}
                            loading="lazy"
                            className="w-full h-80 sm:h-96 md:h-120 object-cover object-top"
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
                {about.certifications.heading}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              {about.certifications.items.map((cert) => (
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
                {about.stats.heading}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {about.stats.items.map((stat, index) => (
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
                {about.story.heading}
              </h2>
            </div>
            <div className="max-w-3xl mx-auto rounded-2xl bg-surface border border-gold/15 p-6 sm:p-10">
              <div className="space-y-5 text-base sm:text-lg text-white/75 font-light leading-relaxed">
                <p>
                  {about.story.p1Before}
                  <span className="text-white/90">
                    {about.story.p1Highlight}
                  </span>
                  {about.story.p1After}
                </p>
                <p>{about.story.p2}</p>
                <p>
                  {about.story.p3Before}
                  <span className="text-gold">{about.story.p3Highlight}</span>
                  {about.story.p3After}
                </p>
              </div>
            </div>
          </section>

          {/* ── 結尾 CTA ── */}
          <section className="text-center" data-aos="fade-up">
            <div className="page-cta-box bg-surface/60 backdrop-blur-sm border border-gold/20 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-3">
                {about.cta.title}
              </h2>
              <p className="text-muted mb-8">{about.cta.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center rounded-full bg-gold text-studio-bg font-medium px-7 py-3 text-sm sm:text-base hover:bg-gold-dim transition-colors"
                >
                  {about.cta.primary}
                </Link>
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-full border border-gold/50 text-gold font-medium px-7 py-3 text-sm sm:text-base hover:bg-gold/10 transition-colors"
                >
                  {about.cta.secondary}
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
