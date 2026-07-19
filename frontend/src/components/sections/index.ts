/**
 * 區塊元件統一導出
 * @module components/sections
 *
 * 2026-07 首頁改版：
 *   - 刪除 PodcastSection / ReviewSection（死碼，已被 PodcastExpandable /
 *     TestimonialCarousel 取代，但仍被 barrel export 打包進 bundle）
 *   - 刪除 CardStackTestimonial（見證區塊合併：三欄引言版型移入
 *     TestimonialCarousel 的 quote-grid；輪播邏輯回收為 CareerCarousel）
 *   - 新增 ServicesSection（主要服務項目與專長）、CareerCarousel（其他人設經歷）
 *   - GallerySlider 已從首頁移除，但 AdminContent 的相片輪播預覽仍在使用，
 *     故保留檔案與 export
 */

export { default as HeroSection } from "./HeroSection";
export { default as CoachIntroSection } from "./CoachIntroSection";
export { default as ServicesSection } from "./ServicesSection";
export { default as PodcastExpandable } from "./PodcastExpandable";
export { default as TestimonialCarousel } from "./TestimonialCarousel";
export { default as CareerCarousel } from "./CareerCarousel";
export { default as GallerySlider } from "./GallerySlider";
export { default as DirectionAwareGallery } from "./DirectionAwareGallery";
export { default as CertificationMarquee } from "./CertificationMarquee";
