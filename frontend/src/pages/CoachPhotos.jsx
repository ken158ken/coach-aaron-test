import React, { useEffect, useMemo, useRef, useState } from 'react';
import coachPhotosManifest from '../data/coachPhotos.json';

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CoachPhotos = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const dialogRef = useRef(null);

  const albums = useMemo(() => {
    const rawAlbums = coachPhotosManifest?.albums ?? [];
    return rawAlbums
      .filter((a) => Array.isArray(a.photos) && a.photos.length > 0)
      .map((a) => ({
        album: a.album,
        photos: a.photos,
      }));
  }, []);

  // Collect all photos and pick 8 random ones for the carousel
  const bannerPhotos = useMemo(() => {
    const allPhotos = albums.flatMap((a) => a.photos);
    if (allPhotos.length === 0) return [];
    const shuffled = shuffleArray(allPhotos);
    return shuffled.slice(0, Math.min(8, shuffled.length));
  }, [albums]);

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    if (bannerPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % bannerPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerPhotos.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // DOM animation: reveal on scroll
    const elements = document.querySelectorAll('[data-reveal]');

    // Initialize to hidden
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
    });

    import('gsap').then(({ default: gsap }) => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            if (el.dataset.revealed === '1') continue;
            el.dataset.revealed = '1';

            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power3.out',
            });

            observer.unobserve(el);
          }
        },
        { rootMargin: '80px 0px', threshold: 0.12 }
      );

      elements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    });
  }, [albums.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedPhoto) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [selectedPhoto]);

  const onClose = () => setSelectedPhoto(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* DaisyUI Carousel Banner */}
      {bannerPhotos.length > 0 && (
        <div className="w-full h-[60vh] relative overflow-hidden">
          <div className="carousel w-full h-full">
            {bannerPhotos.map((src, idx) => (
              <div
                key={src}
                className={`carousel-item absolute w-full h-full transition-opacity duration-700 ease-in-out ${idx === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img
                  src={src}
                  alt={`Banner ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {bannerPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={`w-3 h-3 rounded-full transition-colors ${idx === carouselIndex ? 'bg-primary' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          {/* Prev / Next Buttons */}
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-black/30 hover:bg-black/50 text-white z-20"
            onClick={() => setCarouselIndex((prev) => (prev - 1 + bannerPhotos.length) % bannerPhotos.length)}
            aria-label="Previous"
          >
            ❮
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-black/30 hover:bg-black/50 text-white z-20"
            onClick={() => setCarouselIndex((prev) => (prev + 1) % bannerPhotos.length)}
            aria-label="Next"
          >
            ❯
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-10 pb-12 px-4 sm:px-6">
        <div className="text-center mb-10" data-reveal>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">教練個人<span className="text-primary">寫真</span></h1>
          <p className="text-base-content/70 max-w-2xl mx-auto">
            依相簿資料夾分類，瀑布流呈現；點擊照片可放大查看。
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="max-w-xl mx-auto" data-reveal>
            <div className="alert alert-warning">
              <span>
                目前沒有找到任何寫真圖片。請先執行 `npm run generate:coach-photos`，或確認資料夾 `個人資料提取/個人寫真` 內有圖片。
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {albums.map((album) => (
              <section key={album.album}>
                <div className="flex items-end justify-between gap-4 mb-4" data-reveal>
                  <h2 className="text-2xl font-bold">{album.album}</h2>
                  <span className="text-sm text-base-content/60">{album.photos.length} 張</span>
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {album.photos.map((src) => (
                    <button
                      key={src}
                      type="button"
                      className="mb-4 break-inside-avoid w-full text-left"
                      onClick={() => setSelectedPhoto(src)}
                      aria-label="放大查看"
                    >
                      <div
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <figure className="p-2">
                          <img
                            src={src}
                            alt={album.album}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-auto rounded-box"
                          />
                        </figure>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <dialog ref={dialogRef} className="modal" onClose={onClose}>
        <div className="modal-box max-w-5xl p-3">
          {selectedPhoto ? (
            <img
              src={selectedPhoto}
              alt="放大照片"
              className="w-full h-auto rounded-box"
              loading="eager"
              decoding="async"
            />
          ) : null}
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              關閉
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="close" />
        </form>
      </dialog>
    </div>
  );
};

export default CoachPhotos;
