/**
 * Videos 頁面 - 影片牆 (Server-side Pagination + AOS + Scroll Restore)
 * 每次只從 API 載入 10 筆，滾動到底部自動載入下一批
 * @module pages/Videos
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { VideoCard, Loading, PageHeader } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { videoService } from "@/services";
import { useLanguage } from "@/context/LanguageContext";
import type { Video } from "@/types";
import AOS from "aos";

const PAGE_SIZE = 10;
const STORAGE_KEY_SCROLL = "videos_scroll_y";
const STORAGE_KEY_COUNT = "videos_loaded_count";

const Videos: React.FC = () => {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const restoredRef = useRef(false);
  const fetchingRef = useRef(false);

  // Initial load — restore previously loaded count if returning from external link
  const initialCount = useRef(
    Math.max(PAGE_SIZE, parseInt(sessionStorage.getItem(STORAGE_KEY_COUNT) || "0", 10))
  );

  // Fetch a page of videos
  const fetchPage = useCallback(
    async (offset: number, limit: number): Promise<{ data: Video[]; total: number }> => {
      return videoService.getVideosPaginated(offset, limit);
    },
    []
  );

  // Initial fetch — load enough to restore scroll position
  useEffect(() => {
    const init = async () => {
      try {
        const count = initialCount.current;
        const result = await fetchPage(0, count);
        setVideos(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchPage]);

  // Restore scroll position after initial render
  useEffect(() => {
    if (loading || videos.length === 0 || restoredRef.current) return;
    restoredRef.current = true;
    const savedY = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedY) {
      const y = parseInt(savedY, 10);
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          AOS.refresh();
        }, 150);
      });
    }
  }, [loading, videos.length]);

  // Track scroll position + show/hide back-to-top
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          sessionStorage.setItem(STORAGE_KEY_SCROLL, String(window.scrollY));
          setShowTop(window.scrollY > 600);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Persist loaded count for scroll restore
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_COUNT, String(videos.length));
  }, [videos.length]);

  // Load more
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || videos.length >= total) return;
    fetchingRef.current = true;
    setLoadingMore(true);
    try {
      const result = await fetchPage(videos.length, PAGE_SIZE);
      setVideos((prev) => [...prev, ...result.data]);
      setTotal(result.total);
      setTimeout(() => AOS.refresh(), 100);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [videos.length, total, fetchPage]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadMore]);

  // Refresh AOS after initial render
  useEffect(() => {
    if (!loading && videos.length > 0) {
      setTimeout(() => AOS.refresh(), 200);
    }
  }, [loading, videos.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasMore = videos.length < total;

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title={t.videos.heading}
        description={
          language === "en"
            ? "Free fitness knowledge — training tutorials, nutrition guides, lifestyle tips."
            : "免費的健身知識分享，提供訓練教學、營養指南、生活建議等多元影片內容。"
        }
        keywords={
          language === "en"
            ? ["fitness videos", "training tutorials", "nutrition guide", "fitness knowledge"]
            : ["健身影片", "訓練教學", "營養指南", "健身知識"]
        }
        url="/videos"
      />
      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="studio-container">
          <PageHeader
            label="Videos"
            title={t.videos.heading}
            subtitle={t.videos.subheading}
          />

          {loading ? (
            <div className="flex justify-center py-12 sm:py-20">
              <Loading theme="studio" text={t.common.loading} />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <p className="text-sm sm:text-base text-white/50">
                {t.videos.noVideos}
              </p>
            </div>
          ) : (
            <>
              <p
                className="text-white/40 text-xs sm:text-sm text-center mb-6 sm:mb-8"
                data-aos="fade-up"
              >
                {language === "en"
                  ? `${total} videos`
                  : `共 ${total} 部影片`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {videos.map((video, index) => (
                  <div
                    key={video.video_id}
                    id={`video-${video.video_id}`}
                    data-aos="fade-up"
                    data-aos-delay={Math.min((index % PAGE_SIZE) * 40, 360)}
                    data-aos-duration="600"
                    data-aos-anchor-placement="top-bottom"
                  >
                    <VideoCard video={video} theme="studio" />
                  </div>
                ))}
              </div>

              {/* Sentinel for infinite scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  <div className="flex items-center gap-2 text-white/30 text-sm">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {loadingMore
                      ? (language === "en" ? "Loading more..." : "載入更多...")
                      : ""}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all duration-300 shadow-lg ${
          showTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default Videos;
