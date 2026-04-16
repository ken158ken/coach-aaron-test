/**
 * Videos 頁面 - 影片牆 (Lazy Loading + AOS)
 * 使用 IntersectionObserver 分批載入，每批 20 張
 * @module pages/Videos
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { VideoCard, Loading, PageHeader } from '@/components/ui';
import { SEOHead } from '@/components/seo';
import { videoService } from '@/services';
import { useLanguage } from '@/context/LanguageContext';
import type { Video } from '@/types';
import AOS from 'aos';

const BATCH_SIZE = 20;

const Videos: React.FC = () => {
  const { t, language } = useLanguage();
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videoService.getVideos();
        setAllVideos(data);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setAllVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // IntersectionObserver: load more when sentinel enters viewport
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => {
      const next = Math.min(prev + BATCH_SIZE, allVideos.length);
      // Refresh AOS after new cards render
      setTimeout(() => AOS.refresh(), 100);
      return next;
    });
  }, [allVideos.length]);

  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < allVideos.length) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, allVideos.length, loading, loadMore]);

  // Refresh AOS after initial render
  useEffect(() => {
    if (!loading && allVideos.length > 0) {
      setTimeout(() => AOS.refresh(), 200);
    }
  }, [loading, allVideos.length]);

  const visibleVideos = allVideos.slice(0, visibleCount);
  const hasMore = visibleCount < allVideos.length;

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title={t.videos.heading}
        description={
          language === 'en'
            ? 'Free fitness knowledge — training tutorials, nutrition guides, lifestyle tips.'
            : '免費的健身知識分享，提供訓練教學、營養指南、生活建議等多元影片內容。'
        }
        keywords={
          language === 'en'
            ? [
                'fitness videos',
                'training tutorials',
                'nutrition guide',
                'fitness knowledge',
              ]
            : ['健身影片', '訓練教學', '營養指南', '健身知識']
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
          ) : allVideos.length === 0 ? (
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
                {language === 'en'
                  ? `${allVideos.length} videos`
                  : `共 ${allVideos.length} 部影片`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {visibleVideos.map((video, index) => (
                  <div
                    key={video.video_id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min((index % BATCH_SIZE) * 30, 400)}
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
                    {language === 'en' ? 'Loading more...' : '載入更多...'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Videos;
