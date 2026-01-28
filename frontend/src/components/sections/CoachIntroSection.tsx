/**
 * CoachIntroSection 元件 - 教練介紹區塊
 * @module components/sections/CoachIntroSection
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextButton } from "@/components/ui";

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
        py-24
        px-4
        ${className}
      `}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div ref={imageRef} className="relative">
            <div className="aspect-[3/4] rounded-xl overflow-hidden">
              <img
                src="/images/coach-aaron.jpg"
                alt="Coach Aaron"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-luxe-gold/30 rounded-xl -z-10" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-luxe-gold/10 rounded-xl -z-10" />
          </div>

          {/* Content */}
          <div ref={contentRef}>
            <span className="inline-block text-luxe-gold text-sm uppercase tracking-widest mb-4">
              關於教練
            </span>
            <h2 className="text-4xl font-light text-luxe-text mb-6 leading-tight">
              Aaron 教練
              <br />
              <span className="text-luxe-gold">專業健身指導</span>
            </h2>
            <p className="text-luxe-muted text-lg font-light leading-relaxed mb-6">
              擁有超過 10
              年健身教學經驗，專注於體態雕塑、增肌減脂與運動表現提升。
              結合科學化訓練方法與個人化指導，幫助學員突破極限，達成目標。
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "ACE 美國運動委員會認證教練",
                "ISSA 國際運動科學協會認證",
                "運動營養專家認證",
                "1000+ 學員成功案例",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-luxe-text/80"
                >
                  <span className="w-2 h-2 bg-luxe-gold rounded-full" />
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
