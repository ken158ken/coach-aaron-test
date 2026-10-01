/**
 * CoachIntroSection 元件 - 教練介紹區塊（Aceternity Background Gradient 環境光暈）
 * @module components/sections/CoachIntroSection
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/cloudinary';
import { TextButton } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { contentService } from '@/services/site/content.service';
import { getDefaultTemplate } from '@/utils/contentTemplates';
import { getInitialData } from '@/ssr/initialData';
import { dataKeys } from '@/ssr/routeData';

interface CoachIntroSectionProps {
  className?: string;
}

/** SSR 預抓的 site_content map（首頁路由才有；server / client 讀到同一份） */
const readSSRContent = (): Record<string, string> => {
  const data = getInitialData<Record<string, string>>(dataKeys.siteContent());
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

/** 解析 JSON 陣列字串，失敗回 null */
const parseJsonArray = (raw: string | undefined): string[] | null => {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? arr : null;
  } catch {
    return null;
  }
};

/**
 * 預設 bullets 已移入 i18n 字典（`t.coachIntro.bullets`）。
 *
 * 只放已佐證的資歷；ACE／ISSA 兩張證照履歷查無，依定稿文案僅在頁尾
 * Credentials 區塊（CertificationMarquee）列出，此處不放。
 *
 * 備選（更偏商業成果，5 項，客戶如要換可直接替換字典內容）：
 *   '教練職涯培訓講師｜私教變現顧問',
 *   '威豪健身總教官｜約 50 人教練團隊管理',
 *   '房仲業務轉職，帶著銷售實戰進健身房',
 *   'NSCA-CPT｜TQUK 心理諮詢｜NLP 執行師',
 *   '《陪你健身》Podcast 主持人｜58 集',
 */

/**
 * 「關於阿倫教官」輪播照片（每 3 秒交叉淡入換一張）。
 * 預設用這 5 張 Cloudinary 照片；可由 site_content 的 `coach_intro_images`
 * （JSON 陣列字串）覆寫。舊的單張 key `coach_intro_image_url` 已不再用於本區。
 */
const COACH_IMAGES: string[] = [
  'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471250/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_3_oswqyt.jpg',
  'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471253/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_10_irutga.jpg',
  'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471255/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_8_r0asnz.jpg',
  'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471245/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_2_takrul.jpg',
  'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471246/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_4_qbqs36.jpg',
];

/** 輪播間隔（ms） */
const IMAGE_ROTATE_MS = 3000;

/**
 * 響應式圖片設定（取代原本寫死的 `f_auto,q_auto,w_900`）。
 *
 * 版面實測：容器 `max-w-sm mx-auto md:max-w-[26rem]`
 *   → 手機 ≈ 100vw 扣掉 px-4（上限 24rem / 384px）
 *   → 桌機（md↑）固定 26rem / 416px
 * 原圖為 900×1199，再往上的寬度沒有意義，所以梯度封頂 900。
 * 實際挑哪一支由瀏覽器依 `sizes` × devicePixelRatio 決定。
 */
const IMAGE_WIDTHS = [384, 480, 640, 768, 900] as const;
const IMAGE_SIZES = '(min-width: 768px) 26rem, 92vw';
/** 原圖寬高（原始素材 1537×2048，w_900 輸出 900×1199）— 填 width/height 占位消除 CLS */
const IMAGE_W = 900;
const IMAGE_H = 1199;

/**
 * `fetchpriority="high"` 用小寫 + spread。
 * @types/react 18.3 雖然認得 camelCase `fetchPriority`，但 react-dom 18.3.1
 * 的 DOM 屬性表還沒有它 —— 直接寫 camelCase 雖然「會」輸出成屬性（HTML
 * 屬性名大小寫不敏感），但每次 SSR 都會噴一行 dev warning。
 * 用 spread 傳小寫自訂屬性即可：行為相同、零警告，TS 也不會對 spread
 * 做多餘屬性檢查。
 */
const FETCH_PRIORITY_HIGH = { fetchpriority: 'high' } as const;

/**
 * 交叉淡入輪播圖（每 IMAGE_ROTATE_MS 換一張）。
 *
 * ⚠️ 刻意用「純 CSS opacity 過渡」而非 framer-motion 的 initial:{opacity:0}：
 * 後者會讓 SSR 直接輸出 <img style="opacity:0">，必須等 client JS 跑動畫才可見，
 * 一旦 JS 慢/被舊 SW 卡住，圖片就整個看不到。這裡第一張在 SSR 就是 opacity-100，
 * 不依賴 JS 也一定顯示；JS 運作時再以 CSS 過渡做交叉淡入。
 */
const RotatingImage: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
  const [idx, setIdx] = useState(0);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (reduceMotion || images.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % images.length),
      IMAGE_ROTATE_MS
    );
    return () => clearInterval(t);
  }, [reduceMotion, images.length]);

  // images 變更（DB 載入）時避免索引越界
  useEffect(() => {
    setIdx((i) => (i >= images.length ? 0 : i));
  }, [images.length]);

  if (!images.length) return null;

  return (
    <>
      {images.map((src, i) =>
        i === 0 ? (
          // 第一張走「正常流」：撐出容器寬高（欄位 mx-auto 需要內容寬度，
          // 若全部 absolute 會讓欄位縮成 0 寬、圖片被壓成 0）。非當前張時
          // 仍保留在流內（opacity-0）以維持容器尺寸。
          <img
            key={src}
            src={cloudinaryUrl(src, { w: IMAGE_W })}
            srcSet={cloudinarySrcSet(src, IMAGE_WIDTHS) || undefined}
            sizes={IMAGE_SIZES}
            width={IMAGE_W}
            height={IMAGE_H}
            alt={alt}
            loading="eager"
            {...FETCH_PRIORITY_HIGH}
            decoding="async"
            className={`block w-full h-auto object-cover transition-opacity duration-700 ease-in-out ${
              idx === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          // 其餘疊在第一張上方做交叉淡入
          <img
            key={src}
            src={cloudinaryUrl(src, { w: IMAGE_W })}
            srcSet={cloudinarySrcSet(src, IMAGE_WIDTHS) || undefined}
            sizes={IMAGE_SIZES}
            width={IMAGE_W}
            height={IMAGE_H}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )
      )}
    </>
  );
};

const CoachIntroSection: React.FC<CoachIntroSectionProps> = ({
  className = '',
}) => {
  const { t, isZhTW } = useLanguage();
  const copy = t.coachIntro;

  /**
   * site_content 的值目前只有中文（公開 API `GET /api/content` 只回傳
   * content_value，未帶 content_value_en）：中文模式 DB 值優先、空值退回字典；
   * 英文模式一律用字典，避免把中文 DB 值吐給英文使用者。
   */
  const pick = (dbValue: string, dict: string): string =>
    isZhTW && dbValue.trim() ? dbValue : dict;
  // ✅ SSR-safe：使用確定性範本，避免 Math.random() hydration mismatch
  // 本文採定稿新 A 案（資歷＋定位並重）。備選：
  //   B 案（對話感優先）：'你的專業應該值更多錢，這是我做這件事的全部理由。我從房仲業務轉行當私人教練，
  //     在第一線一堂課一堂課賣起，被拒絕過無數次；後來帶起 50 人的教練團隊，才真正看懂業績不是逼出來的，
  //     是設計出來的。現在我做的事很單純：把這套設計交給還在硬撐的教練。'
  //   C 案（精簡，版面吃緊時用）：'私教變現顧問、教練職涯培訓講師。台東威豪健身總教官，帶約 50 人教練團隊。
  //     第一線私教出身，專攻銷售心理學與教練經營，只服務一種人——想把專業變成收入的私人教練。'
  const [aboutCoach, setAboutCoach] = useState(
    () => readSSRContent().about_coach?.trim() || getDefaultTemplate('about_coach')
  );
  // tagline 備選：'關於教練'（保守）／'我是誰，憑什麼教你'（強對話感）
  const [tagline, setTagline] = useState(
    () => readSSRContent().coach_intro_tagline?.trim() || ''
  );
  const [coachName, setCoachName] = useState(
    () => readSSRContent().coach_intro_name?.trim() || ''
  );
  // 頭銜備選：'教練職涯培訓講師' ／ '教練的教練'
  const [coachTitle, setCoachTitle] = useState(
    () => readSSRContent().coach_intro_title?.trim() || ''
  );
  const [images, setImages] = useState<string[]>(
    () => parseJsonArray(readSSRContent().coach_intro_images) ?? COACH_IMAGES
  );
  const [bullets, setBullets] = useState<string[]>(
    () => parseJsonArray(readSSRContent().coach_intro_bullets) ?? []
  );
  // CTA 備選：'我的職涯故事' ／ '為什麼是我'
  const [cta, setCta] = useState(
    () => readSSRContent().coach_intro_cta?.trim() || ''
  );

  // 從後台載入內容，若 DB 回傳空值則保留範本
  // SSR 預抓資料只作初值；mount 後仍照常抓最新（SSR HTML 可能是 CDN 舊快取）
  useEffect(() => {
    contentService
      .getPublicContent()
      .then((content) => {
        if (content.about_coach?.trim()) setAboutCoach(content.about_coach);
        if (content.coach_intro_tagline?.trim())
          setTagline(content.coach_intro_tagline);
        if (content.coach_intro_name?.trim())
          setCoachName(content.coach_intro_name);
        if (content.coach_intro_title?.trim())
          setCoachTitle(content.coach_intro_title);
        // 輪播照片：優先讀 coach_intro_images（JSON 陣列字串），沒有就用預設 5 張
        if (content.coach_intro_images) {
          try {
            const arr = JSON.parse(content.coach_intro_images);
            if (Array.isArray(arr) && arr.length > 0) setImages(arr);
          } catch (err) {
            console.warn(
              '[CoachIntroSection] 解析 coach_intro_images 失敗',
              err
            );
          }
        }
        if (content.coach_intro_cta?.trim()) setCta(content.coach_intro_cta);
        if (content.coach_intro_bullets) {
          try {
            const arr = JSON.parse(content.coach_intro_bullets);
            if (Array.isArray(arr) && arr.length > 0) setBullets(arr);
          } catch (err) {
            console.warn(
              '[CoachIntroSection] 解析 coach_intro_bullets 失敗',
              err
            );
          }
        }
      })
      .catch((err) => {
        console.warn('[CoachIntroSection] 載入網站內容失敗', err);
      });
  }, []);

  // 顯示用文案（中文模式吃 DB 覆寫，英文模式用字典）
  const displayName = pick(coachName, copy.name);
  const displayBullets =
    isZhTW && bullets.length > 0 ? bullets : copy.bullets;

  return (
    <section
      className={`relative py-16 sm:py-20 md:py-24 px-4 overflow-hidden ${className}`}
    >
      {/*
        首屏 LCP 候選：輪播第一張照片。
        用 Helmet 輸出 <link rel="preload" as="image">，讓瀏覽器在解析完 head
        就開始抓圖（SSR 時 entry-server 會把它收進 head，不必等 JS）。
        imageSrcSet / imageSizes 必須與 <img> 的 srcSet / sizes 完全一致，
        否則瀏覽器會判定成另一張圖而重複下載。只對第一張做。
        屬性刻意用 React 的 camelCase（TS 型別認得）；Helmet 是逐字把
        key 當 HTML 屬性名輸出／setAttribute，而 HTML 屬性名大小寫不敏感，
        兩端都會正規化成 imagesrcset / imagesizes / fetchpriority。
      */}
      {images[0] && (
        <Helmet>
          <link
            rel="preload"
            as="image"
            href={cloudinaryUrl(images[0], { w: IMAGE_W })}
            imageSrcSet={cloudinarySrcSet(images[0], IMAGE_WIDTHS) || undefined}
            imageSizes={IMAGE_SIZES}
            fetchPriority="high"
          />
        </Helmet>
      )}

      {/* Aceternity Background Gradient — 緩慢軌道式環境光暈 */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          background: [
            'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(197,160,89,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(197,160,89,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(197,160,89,0.07) 0%, transparent 70%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-360 mx-auto">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Image — 從左滑入 */}
          <div
            className="relative max-w-sm mx-auto md:max-w-[26rem]"
            data-aos="fade-right"
            data-aos-duration="800"
          >
            {/* 第一張圖走正常流撐出容器寬高（見 RotatingImage 註解）；
                容器 relative 供其餘輪播圖 absolute 疊放 */}
            <div className="relative rounded-xl overflow-hidden">
              <RotatingImage images={images} alt={displayName} />
            </div>
            {/* 圖片裝飾框 — 也做 breathing glow */}
            <motion.div
              className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 border border-gold/30 rounded-xl -z-10"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gold/10 rounded-xl -z-10" />
          </div>

          {/* Content — 各子元素依序從下方彈入 */}
          <div className="text-center md:text-left">
            <span
              className="inline-block text-gold text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4"
              data-aos="fade-up"
              data-aos-delay="0"
            >
              {pick(tagline, copy.tagline)}
            </span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90 mb-4 sm:mb-6 leading-tight"
              data-aos="fade-up"
              data-aos-delay="80"
            >
              {displayName}
              <br />
              <span className="text-gold">{pick(coachTitle, copy.title)}</span>
            </h2>
            <p
              className="text-muted text-base sm:text-lg font-light leading-relaxed mb-4 sm:mb-6"
              data-aos="fade-up"
              data-aos-delay="160"
            >
              {pick(aboutCoach, copy.about)}
            </p>
            <ul
              className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-left max-w-md mx-auto md:mx-0"
              data-aos="fade-up"
              data-aos-delay="240"
            >
              {displayBullets.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-white/70"
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div data-aos="fade-up" data-aos-delay="320">
              <TextButton to="/about" theme="studio">
                {pick(cta, copy.cta)}
              </TextButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachIntroSection;
