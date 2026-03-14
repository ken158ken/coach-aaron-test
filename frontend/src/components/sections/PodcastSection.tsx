/**
 * PodcastSection 元件 - Podcast 區塊
 * @module components/sections/PodcastSection
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AbyssCard, FilterPill } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger);

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  duration: string;
  date: string;
  category: string;
  thumbnail?: string;
}

interface PodcastSectionProps {
  episodes?: PodcastEpisode[];
  className?: string;
}

/**
 * PodcastSection - Podcast 展示區塊
 *
 * @param {PodcastSectionProps} props - 元件屬性
 * @returns {JSX.Element} Podcast 區塊
 */
const PodcastSection: React.FC<PodcastSectionProps> = ({
  episodes = [],
  className = "",
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");

  const filterOptions = [
    { value: "all", label: "全部" },
    { value: "training", label: "訓練" },
    { value: "nutrition", label: "營養" },
    { value: "mindset", label: "心態" },
  ];

  const filteredEpisodes =
    filter === "all"
      ? episodes
      : episodes.filter((ep) => ep.category === filter);

  // Demo data
  const demoEpisodes: PodcastEpisode[] = [
    {
      id: "1",
      title: "新手必聽：健身入門的 5 大迷思",
      description: "打破常見的健身迷思，建立正確的訓練觀念...",
      duration: "45:30",
      date: "2024-01-15",
      category: "training",
    },
    {
      id: "2",
      title: "飲食控制不等於節食",
      description: "學會聰明吃，讓增肌減脂事半功倍...",
      duration: "38:15",
      date: "2024-01-08",
      category: "nutrition",
    },
    {
      id: "3",
      title: "如何保持訓練動力",
      description: "分享維持長期運動習慣的心法與技巧...",
      duration: "42:00",
      date: "2024-01-01",
      category: "mindset",
    },
  ];

  const displayEpisodes = episodes.length > 0 ? filteredEpisodes : demoEpisodes;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".podcast-card",
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%", toggleActions: "play none none none" },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [filter]);

  return (
    <section
      ref={sectionRef}
      className={`
        py-16
        sm:py-20
        md:py-24
        px-4
        bg-transparent
        ${className}
      `}
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block text-white text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
            Podcast
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white/90 mb-3 sm:mb-4">深海電台</h2>
          <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
            每週更新健身知識、訓練技巧與生活態度分享
          </p>
        </div>

        {/* Filter */}
        <div className="flex justify-center mb-8 sm:mb-10 overflow-x-auto pb-2">
          <FilterPill
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            theme="studio"
          />
        </div>

        {/* Episodes Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {displayEpisodes.map((episode) => (
            <AbyssCard
              key={episode.id}
              className="podcast-card cursor-pointer"
              glow="cyan"
            >
              <div className="flex flex-col h-full">
                {/* Play Icon */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5 sm:ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>

                {/* Content */}
                <h3 className="text-base sm:text-lg font-medium text-white/90 mb-2">
                  {episode.title}
                </h3>
                <p className="text-white/50 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow">
                  {episode.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/40">
                  <span>🎧 {episode.duration}</span>
                  <span>{episode.date}</span>
                </div>
              </div>
            </AbyssCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;
