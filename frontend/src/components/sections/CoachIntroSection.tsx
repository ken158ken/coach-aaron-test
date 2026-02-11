/**
 * CoachIntroSection 元件 - 教練介紹區塊
 * @module components/sections/CoachIntroSection
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextButton } from "@/components/ui";
import { contentService } from "@/services/content.service";
import { getRandomTemplate } from "@/utils/contentTemplates";

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

  // 初始值使用隨機範本 fallback
  const [aboutCoach, setAboutCoach] = useState(() =>
    getRandomTemplate(
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
      gsap.from(imageRef.current, {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none reverse",
        },
      });

      // Content animation
      gsap.from(contentRef.current?.children || [], {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 20%",
          toggleActions: "play none none reverse",
        },
      });
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
      <div className="max-w-6xl mx-auto">
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
            <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 border border-luxe-gold/30 rounded-xl -z-10" />
            <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-luxe-gold/10 rounded-xl -z-10" />
          </div>

          {/* Content */}
          <div ref={contentRef} className="text-center md:text-left">
            <span className="inline-block text-luxe-gold text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              關於教練
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-luxe-text mb-4 sm:mb-6 leading-tight">
              Aaron 教練
              <br />
              <span className="text-luxe-gold">專業健身指導</span>
            </h2>
            <p className="text-luxe-muted text-base sm:text-lg font-light leading-relaxed mb-4 sm:mb-6">
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
                  className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-luxe-text/80"
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-luxe-gold rounded-full flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <TextButton to="/about" theme="luxe">
              了解更多
            </TextButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachIntroSection;
