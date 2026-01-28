/**
 * CoachPhotos 頁面 - 教練寫真
 * @module pages/CoachPhotos
 * @theme luxe (LUXE 高端主題)
 * @description 展示教練個人寫真相簿，支援瀑布流佈局、輪播橫幅和相片放大查看功能
 * @access 需要登入且 sex = true 才能瀏覽
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useTheme, useAuth } from "@/context";
import { Modal, Loading, PillButton } from "@/components/ui";
import coachPhotosManifest from "@/data/coachPhotos.json";

/**
 * 相簿介面
 */
interface Album {
  album: string;
  photos: string[];
}

/**
 * 相簿清單資料介面
 */
interface CoachPhotosManifest {
  albums?: Album[];
}

/**
 * 圖片載入狀態
 */
interface ImageLoadState {
  [key: string]: boolean;
}

/**
 * Fisher-Yates 洗牌演算法
 */
function shuffleArray(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * CoachPhotos - 教練寫真頁面
 *
 * @returns {JSX.Element} 寫真頁面
 */
const CoachPhotos: React.FC = () => {
  const { setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [bannerPhotos, setBannerPhotos] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState<ImageLoadState>({});
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 權限檢查：需要登入且 sex = true
  const hasAccess = user?.sex === true;

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  /**
   * 處理相簿資料，過濾空相簿
   */
  const albums = useMemo<Album[]>(() => {
    const manifest = coachPhotosManifest as CoachPhotosManifest;
    const rawAlbums = manifest?.albums ?? [];
    return rawAlbums
      .filter((a) => Array.isArray(a.photos) && a.photos.length > 0)
      .map((a) => ({
        album: a.album,
        photos: a.photos,
      }));
  }, []);

  /**
   * Hydration 完成標記
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * 收集所有照片並隨機選擇 5 張作為輪播橫幅
   */
  useEffect(() => {
    if (!mounted) return;

    const allPhotos = albums.flatMap((a) => a.photos);
    if (allPhotos.length === 0) {
      setBannerPhotos([]);
      return;
    }
    const shuffled = shuffleArray(allPhotos);
    setBannerPhotos(shuffled.slice(0, Math.min(5, shuffled.length)));
  }, [mounted, albums]);

  /**
   * 設置 Intersection Observer 進行圖片懶載入
   */
  useEffect(() => {
    if (!mounted) return;

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: "50px",
      threshold: 0.01,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            setVisibleImages((prev) => {
              if (prev.has(src)) return prev;
              const next = new Set(prev);
              next.add(src);
              return next;
            });
            observerRef.current?.unobserve(img);
          }
        }
      });
    }, options);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [mounted]);

  /**
   * 圖片載入完成處理
   */
  const handleImageLoad = useCallback((src: string) => {
    setImageLoaded((prev) => ({ ...prev, [src]: true }));
  }, []);

  /**
   * 自動輪播功能 - 每 4 秒切換一張
   */
  useEffect(() => {
    if (bannerPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % bannerPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerPhotos.length]);

  /**
   * 切換到上一張輪播圖片
   */
  const handlePrevCarousel = (): void => {
    setCarouselIndex(
      (prev) => (prev - 1 + bannerPhotos.length) % bannerPhotos.length,
    );
  };

  /**
   * 切換到下一張輪播圖片
   */
  const handleNextCarousel = (): void => {
    setCarouselIndex((prev) => (prev + 1) % bannerPhotos.length);
  };

  // 載入中狀態
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <Loading theme="luxe" text="載入中..." />
      </div>
    );
  }

  // 權限不足：未登入或 sex = false
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="p-8 bg-luxe-black/80 border border-luxe-gold/30 rounded-2xl backdrop-blur-sm">
            {/* 鎖頭圖示 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-luxe-gold/10 border border-luxe-gold/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-luxe-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-light text-luxe-text mb-3">
              私密相簿
            </h1>

            {!user ? (
              <>
                <p className="text-luxe-text-dim mb-6 font-light">
                  此內容僅限會員瀏覽，請先登入您的帳號。
                </p>
                <Link to="/login">
                  <PillButton theme="luxe" variant="filled" className="w-full">
                    立即登入
                  </PillButton>
                </Link>
              </>
            ) : (
              <>
                <p className="text-luxe-text-dim mb-6 font-light">
                  您尚未獲得瀏覽私密相簿的權限。
                  <br />
                  如需開通權限，請聯繫管理員。
                </p>
                <Link to="/contact">
                  <PillButton theme="luxe" variant="outline" className="w-full">
                    聯繫我們
                  </PillButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxe-black">
      {/* Carousel Banner */}
      {bannerPhotos.length > 0 && (
        <div className="w-full h-[60vh] relative overflow-hidden bg-luxe-black">
          <div className="w-full h-full relative">
            {bannerPhotos.map((src, idx) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === carouselIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                {/* Skeleton 載入背景 */}
                {!imageLoaded[src] && (
                  <div className="absolute inset-0 bg-luxe-black/50 animate-pulse" />
                )}
                <img
                  src={src}
                  alt={`Banner ${idx + 1}`}
                  className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                    imageLoaded[src] ? "opacity-100" : "opacity-0"
                  }`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  onLoad={() => handleImageLoad(src)}
                />
                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-luxe-black" />
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {bannerPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === carouselIndex
                    ? "bg-luxe-gold w-6"
                    : "bg-luxe-text/30 hover:bg-luxe-text/50"
                }`}
                aria-label={`前往第 ${idx + 1} 張`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-luxe-black/50 hover:bg-luxe-gold/30 border border-luxe-gold/30 text-luxe-gold transition-all z-20"
            onClick={handlePrevCarousel}
            aria-label="上一張"
          >
            ❮
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-luxe-black/50 hover:bg-luxe-gold/30 border border-luxe-gold/30 text-luxe-gold transition-all z-20"
            onClick={handleNextCarousel}
            aria-label="下一張"
          >
            ❯
          </button>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto pt-12 pb-16 px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-luxe-gold text-sm uppercase tracking-widest mb-4">
            Gallery
          </span>
          <h1 className="text-4xl md:text-5xl font-light text-luxe-text mb-4">
            教練寫真
          </h1>
          <p className="text-luxe-text-dim max-w-2xl mx-auto font-light">
            依相簿資料夾分類，瀑布流呈現；點擊照片可放大查看。
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="max-w-xl mx-auto text-center py-12">
            <div className="p-6 bg-luxe-gold/10 border border-luxe-gold/30 rounded-lg">
              <p className="text-luxe-gold">
                目前沒有找到任何寫真圖片。請先執行 `npm run
                generate:coach-photos`，或確認資料夾內有圖片。
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {albums.map((album) => (
              <section key={album.album}>
                {/* Album Header */}
                <div className="flex items-end justify-between gap-4 mb-6 border-b border-luxe-gold/20 pb-3">
                  <h2 className="text-2xl font-light text-luxe-text">
                    {album.album}
                  </h2>
                  <span className="text-sm text-luxe-text-dim">
                    {album.photos.length} 張
                  </span>
                </div>

                {/* Masonry Grid */}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {album.photos.map((src) => {
                    const isVisible = visibleImages.has(src);
                    const isLoaded = imageLoaded[src];

                    return (
                      <div key={src} className="mb-4 break-inside-avoid w-full">
                        <button
                          type="button"
                          className="w-full text-left group cursor-pointer"
                          onClick={() => setSelectedPhoto(src)}
                          aria-label="放大查看"
                        >
                          <div className="relative overflow-hidden rounded-lg bg-luxe-black/50 border border-luxe-gold/10 hover:border-luxe-gold/40 transition-all duration-300">
                            {/* Skeleton 載入背景 */}
                            {!isLoaded && (
                              <div
                                className="absolute inset-0 bg-luxe-black/80 animate-pulse"
                                style={{ minHeight: "200px" }}
                              />
                            )}
                            {/* 實際圖片 */}
                            <img
                              ref={(el) => {
                                if (el && !isVisible && observerRef.current) {
                                  el.dataset.src = src;
                                  observerRef.current.observe(el);
                                }
                              }}
                              src={isVisible ? src : undefined}
                              alt={album.album}
                              loading="lazy"
                              decoding="async"
                              className={`w-full h-auto transition-all duration-500 ${
                                isLoaded
                                  ? "opacity-100 scale-100"
                                  : "opacity-0 scale-95"
                              } group-hover:scale-105`}
                              onLoad={() => handleImageLoad(src)}
                              style={{
                                minHeight: isLoaded ? "auto" : "200px",
                              }}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-luxe-gold/0 group-hover:bg-luxe-gold/10 transition-all duration-300 flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-luxe-gold text-sm uppercase tracking-widest transition-opacity duration-300">
                                點擊放大
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        size="xl"
        theme="luxe"
      >
        {selectedPhoto && (
          <div className="p-2">
            <img
              src={selectedPhoto}
              alt="放大照片"
              className="w-full h-auto rounded-lg"
              loading="eager"
              decoding="async"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CoachPhotos;
