/**
 * CardStackTestimonial - 學員真實評價 Card Stack 版本
 * @module components/sections/CardStackTestimonial
 * @description Aceternity Card Stack 風格：牌堆動畫，自動輪播學員評價
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { slidesService, type TestimonialSlide } from "@/services/slides.service";

/** Demo 資料（API 無資料時使用） */
const DEMO_CARDS: TestimonialSlide[] = [
  {
    id: 1, sort_order: 0,
    name: "小文教練",
    achievement: "月收從 2 萬→8 萬",
    quote: "跟阿倫教官學完銷售心法後，我的學生續課率從 40% 提升到 85%，真的不敢相信！",
    image_url: "https://i.pravatar.cc/80?img=11",
    is_active: true, created_at: "",
  },
  {
    id: 2, sort_order: 1,
    name: "Crystal 皮拉提斯教練",
    achievement: "3 個月業績翻倍",
    quote: "以前不敢開口報價，現在能自信地為學生設計專屬方案，阿倫教官的課讓我找到了自己的價值。",
    image_url: "https://i.pravatar.cc/80?img=5",
    is_active: true, created_at: "",
  },
  {
    id: 3, sort_order: 2,
    name: "Jason 健身教練",
    achievement: "年收突破百萬",
    quote: "學了 NLP 銷售技巧之後，每一次銷售對話都變得更自然，學生也感受到了真誠。",
    image_url: "https://i.pravatar.cc/80?img=3",
    is_active: true, created_at: "",
  },
  {
    id: 4, sort_order: 3,
    name: "Mia 瑜伽老師",
    achievement: "招生滿班",
    quote: "不只是教練技術，阿倫教官幫我建立了整套經營思維，現在我的每堂課都是滿班狀態。",
    image_url: "https://i.pravatar.cc/80?img=9",
    is_active: true, created_at: "",
  },
  {
    id: 5, sort_order: 4,
    name: "阿偉 重訓教練",
    achievement: "個人品牌建立",
    quote: "從害怕銷售到享受銷售，阿倫教官讓我明白，真正的銷售是幫助學生看見自己的可能性。",
    image_url: "https://i.pravatar.cc/80?img=7",
    is_active: true, created_at: "",
  },
];

/** 每張牌的堆疊偏移 (最多顯示 5 張) */
const STACK_OFFSETS = [
  { y: 0,  rotate: 0,  scale: 1,    zIndex: 50 },
  { y: 10, rotate: -3, scale: 0.97, zIndex: 40 },
  { y: 20, rotate: 5,  scale: 0.94, zIndex: 30 },
  { y: 30, rotate: -2, scale: 0.91, zIndex: 20 },
  { y: 40, rotate: 3,  scale: 0.88, zIndex: 10 },
];

const CardStackTestimonial: React.FC = () => {
  const [cards, setCards] = useState<TestimonialSlide[]>(DEMO_CARDS);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    slidesService
      .getTestimonials()
      .then((s) => {
        if (s.length >= 3) setCards(s);
      })
      .catch(() => {});
  }, []);

  // 自動輪播
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % cards.length);
    }, 3500);
    return () => clearInterval(t);
  }, [cards.length]);

  // 以 activeIdx 為頭，取出最多 5 張
  const visibleCards = [
    ...cards.slice(activeIdx),
    ...cards.slice(0, activeIdx),
  ].slice(0, 5);

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <span className="text-gold text-xs uppercase tracking-widest">Real Reviews</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">學員真實評價</h2>
          <p className="mt-2 text-sm text-white/40">每一個改變都是真實發生的</p>
        </div>

        {/* Card Stack */}
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-md" style={{ height: "280px" }}>
            {visibleCards.map((card, i) => {
              const off = STACK_OFFSETS[i] ?? STACK_OFFSETS[4];
              return (
                <motion.div
                  key={card.id}
                  className="absolute inset-x-0 mx-auto w-full max-w-md"
                  style={{ zIndex: off.zIndex }}
                  animate={{
                    y: off.y,
                    rotate: off.rotate,
                    scale: off.scale,
                  }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className={`rounded-2xl p-6 sm:p-7 shadow-xl ${
                      i === 0
                        ? "bg-[#0d0d0d] border border-gold/25 shadow-gold/5"
                        : "bg-[#0a0a0a] border border-white/8"
                    }`}
                  >
                    {/* Quote */}
                    <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-5">
                      「{card.quote}」
                    </p>

                    {/* Author row */}
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          card.image_url && card.image_url.startsWith("http")
                            ? card.image_url
                            : `https://i.pravatar.cc/80?img=${card.id}`
                        }
                        alt={card.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                      />
                      <div>
                        <p className="text-white/90 text-sm font-medium">{card.name}</p>
                        {card.achievement && (
                          <p className="text-gold text-xs mt-0.5">{card.achievement}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-20 sm:mt-24">
          {cards.slice(0, Math.min(cards.length, 8)).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`第 ${i + 1} 張`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx ? "w-6 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CardStackTestimonial;
