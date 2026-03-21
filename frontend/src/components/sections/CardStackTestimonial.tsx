/**
 * CardStackTestimonial - 學員真實評價 三格同步切換版
 * @module components/sections/CardStackTestimonial
 * @description 一次顯示 3 張評價卡，每次輪播跳 3 張（整組替換）
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  {
    id: 6, sort_order: 5,
    name: "Angela 有氧教練",
    achievement: "學員轉介紹率 60%",
    quote: "學了阿倫教官的溝通技巧後，學生不只願意續課，還會主動幫我介紹新學生！",
    image_url: "https://i.pravatar.cc/80?img=16",
    is_active: true, created_at: "",
  },
];

const PER_PAGE = 3;

const CardStackTestimonial: React.FC = () => {
  const [cards, setCards] = useState<TestimonialSlide[]>(DEMO_CARDS);
  const [groupIdx, setGroupIdx] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward

  useEffect(() => {
    slidesService
      .getTestimonials()
      .then((s) => { if (s.length >= 3) setCards(s); })
      .catch(() => {});
  }, []);

  const totalGroups = Math.ceil(cards.length / PER_PAGE);

  // 自動輪播（每組切換）
  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1);
      setGroupIdx((i) => (i + 1) % totalGroups);
    }, 4500);
    return () => clearInterval(t);
  }, [totalGroups]);

  // 當前組的 3 張卡（循環取）
  const groupCards = Array.from({ length: PER_PAGE }, (_, i) =>
    cards[(groupIdx * PER_PAGE + i) % cards.length],
  );

  const goTo = (idx: number) => {
    setDirection(idx > groupIdx ? 1 : -1);
    setGroupIdx(idx);
  };

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-gold text-xs uppercase tracking-widest">Real Reviews</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">學員真實評價</h2>
          <p className="mt-2 text-sm text-white/40">每一個改變都是真實發生的</p>
        </div>

        {/* 3-card group with AnimatePresence */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={groupIdx}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit:  (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {groupCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 hover:border-gold/25 transition-colors duration-300"
              >
                {/* Quote */}
                <p className="text-white/70 text-sm leading-relaxed flex-1">
                  「{card.quote}」
                </p>

                {/* Divider */}
                <div className="w-8 h-px bg-gold/30" />

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={
                      card.image_url && card.image_url.startsWith("http")
                        ? card.image_url
                        : `https://i.pravatar.cc/80?img=${card.id}`
                    }
                    alt={card.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/15 shrink-0"
                  />
                  <div>
                    <p className="text-white/90 text-sm font-medium leading-tight">{card.name}</p>
                    {card.achievement && (
                      <p className="text-gold text-xs mt-0.5">{card.achievement}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators (one per group) */}
        {totalGroups > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalGroups }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`第 ${i + 1} 組`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === groupIdx ? "w-6 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CardStackTestimonial;
