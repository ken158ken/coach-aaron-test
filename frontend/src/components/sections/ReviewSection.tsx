/**
 * ReviewSection 元件 - 評價區塊
 * @module components/sections/ReviewSection
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PrismCard } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger);

interface Review {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  content: string;
  date: string;
  achievement?: string;
}

interface ReviewSectionProps {
  reviews?: Review[];
  className?: string;
}

/**
 * ReviewSection - 學員評價區塊
 *
 * @param {ReviewSectionProps} props - 元件屬性
 * @returns {JSX.Element} 評價區塊
 */
const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews = [],
  className = "",
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Demo data
  const demoReviews: Review[] = [
    {
      id: "1",
      name: "王小明",
      rating: 5,
      content:
        "跟 Aaron 教練訓練三個月，體脂從 25% 降到 18%，完全超出預期！教練非常專業且有耐心。",
      date: "2024-01-10",
      achievement: "-7% 體脂",
    },
    {
      id: "2",
      name: "李小華",
      rating: 5,
      content: "本來對健身很害怕，但教練的引導讓我愛上運動。現在每週期待上課！",
      date: "2024-01-05",
      achievement: "養成運動習慣",
    },
    {
      id: "3",
      name: "張大偉",
      rating: 5,
      content: "教練的課程安排很科學，不只練出肌肉，還學到很多健身知識。",
      date: "2024-01-01",
      achievement: "+8kg 肌肉量",
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : demoReviews;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".review-card", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-prism-accent" : "text-prism-text/30"}
      >
        ★
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      className={`
        py-24
        px-4
        bg-prism-bg
        ${className}
      `}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-prism-accent text-sm uppercase tracking-widest mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl font-bold text-prism-text mb-4">學員見證</h2>
          <p className="text-prism-text/60 max-w-xl mx-auto">
            聽聽學員們的真實回饋
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {displayReviews.map((review) => (
            <PrismCard key={review.id} className="review-card">
              <div className="flex flex-col h-full">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {renderStars(review.rating)}
                </div>

                {/* Content */}
                <p className="text-prism-text/80 mb-4 flex-grow italic">
                  "{review.content}"
                </p>

                {/* Achievement Badge */}
                {review.achievement && (
                  <span className="inline-block self-start px-3 py-1 mb-4 text-xs bg-prism-accent/20 text-prism-accent rounded-full">
                    {review.achievement}
                  </span>
                )}

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-prism-accent/20">
                  <div className="w-10 h-10 rounded-full bg-prism-accent/30 flex items-center justify-center">
                    {review.avatar ? (
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-prism-text text-sm">
                        {review.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-prism-text font-medium">{review.name}</p>
                    <p className="text-prism-text/50 text-xs">{review.date}</p>
                  </div>
                </div>
              </div>
            </PrismCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
