/**
 * CoachIntroSection 元件 - 教練介紹區塊
 * @module components/sections/CoachIntroSection
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextButton } from "@/components/ui";
import { contentService } from "@/services/content.service";
import { getDefaultTemplate } from "@/utils/contentTemplates";

gsap.registerPlugin(ScrollTrigger);

interface CoachIntroSectionProps {
  className?: string;
}

/**
 * CoachIntroSection - 教練介紹區塊
 *
 * @param {CoachIntroSectionProps} props - 元件屬性
 * @returns {JSX.Element} 教練介紹區塊
 */
const CoachIntroSection: React.FC<CoachIntroSectionProps> = ({
  className = "",
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ✅ SSR-safe：使用確定性範本（第一筆），避免 Math.random() hydration mismatch
  const [aboutCoach, setAboutCoach] = useState(() =>
    getDefaultTemplate(
      "about_coach",
      "擁有超過 10 年健身教學經驗，專注於體態雕塑、增肌減脂與運動表現提升。結合科學化訓練方法與個人化指導，幫助學員突破極限，達成目標。",
    ),
  );

  // 從後台載入內容，若 DB 回傳空值則保留隨機範本
  useEffect(() => {
    contentService
      .getPublicContent()
      .then((content) => {
        if (content.about_coach?.trim()) setAboutCoach(content.about_coach);
      })
      .catch(() => {
        // API 失敗時保留隨機範本，不做額外處理
      });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image animation
      gsap.fromTo(
        imageRef.current,
        { x: -60, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.8, ease: "expo.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%", toggleActions: "play none none none" },
        },
      );

      // Content animation
      gsap.fromTo(
        contentRef.current?.children || [],
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.65, stagger: 0.12, ease: "expo.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%", toggleActions: "play none none none" },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`
        py-16
        sm:py-20
        md:py-24
        px-4
        ${className}
      `}
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Image */}
          <div
            ref={imageRef}
            className="relative max-w-sm mx-auto md:max-w-none"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden">
              <img
                src="/images/coach-aaron.jpg"
                alt="Coach Aaron"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 border border-[#c5a059]/30 rounded-xl -z-10" />
            <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gold/10 rounded-xl -z-10" />
          </div>

          {/* Content */}
          <div ref={contentRef} className="text-center md:text-left">
            <span className="inline-block text-[#c5a059] text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              關於教練
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90 mb-4 sm:mb-6 leading-tight">
              Aaron 教練
              <br />
              <span className="text-[#c5a059]">專業健身指導</span>
            </h2>
            <p className="text-[#888] text-base sm:text-lg font-light leading-relaxed mb-4 sm:mb-6">
              {aboutCoach}
            </p>
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-left max-w-md mx-auto md:mx-0">
              {[
                "ACE 美國運動委員會認證教練",
                "ISSA 國際運動科學協會認證",
                "運動營養專家認證",
                "1000+ 學員成功案例",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-white/70"
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <TextButton to="/about" theme="studio">
              了解更多
            </TextButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachIntroSection;
