/**
 * Videos 頁面 - 影片牆
 * 一次顯示所有短影音，依建立時間降冪排序
 * @module pages/Videos
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState } from "react";
import {
  VideoCard,
  Loading,
  PageHeader,
} from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { videoService } from "@/services";
import { useLanguage } from "@/context/LanguageContext";
import type { Video } from "@/types";

const Videos: React.FC = () => {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videoService.getVideos();
        setVideos(data);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title={t.videos.heading}
        description={language === "en" ? "Free fitness knowledge — training tutorials, nutrition guides, lifestyle tips." : "免費的健身知識分享，提供訓練教學、營養指南、生活建議等多元影片內容。"}
        keywords={language === "en" ? ["fitness videos", "training tutorials", "nutrition guide", "fitness knowledge"] : ["健身影片", "訓練教學", "營養指南", "健身知識"]}
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
              <p className="text-sm sm:text-base text-white/50">{t.videos.noVideos}</p>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-xs sm:text-sm text-center mb-6 sm:mb-8">
                {language === "en"
                  ? `${videos.length} videos`
                  : `共 ${videos.length} 部影片`}
              </p>

              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                {videos.map((video) => (
                  <VideoCard key={video.video_id} video={video} theme="studio" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Videos;
