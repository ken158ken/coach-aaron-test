/**
 * CoachIntroSection 元件 - 教練介紹區塊（Aceternity Background Gradient 環境光暈）
 * @module components/sections/CoachIntroSection
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TextButton } from '@/components/ui';
import { contentService } from '@/services/site/content.service';
import { getDefaultTemplate } from '@/utils/contentTemplates';

interface CoachIntroSectionProps {
  className?: string;
}

/**
 * 預設 bullets（DB 無值時 fallback）
 *
 * 只放已佐證的資歷；ACE／ISSA 兩張證照履歷查無，依定稿文案僅在頁尾
 * Credentials 區塊（CertificationMarquee）列出，此處不放。
 *
 * 備選（更偏商業成果，5 項，客戶如要換可直接替換整個陣列）：
 *   '教練職涯培訓講師｜私教變現顧問',
 *   '威豪健身總教官｜約 50 人教練團隊管理',
 *   '房仲業務轉職，帶著銷售實戰進健身房',
 *   'NSCA-CPT｜TQUK 心理諮詢｜NLP 執行師',
 *   '《陪你健身》Podcast 主持人｜58 集',
 */
const DEFAULT_BULLETS: string[] = [
  '威豪健身 Pro Fitness 總教官｜統籌約 50 人教練團隊',
  'NSCA-CPT 美國肌力與體能協會私人教練認證',
  'TQUK 英國心理諮詢認證｜NLP 執行師',
  '逾 1000 小時教學與授課時數',
];

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
 * 為 Cloudinary 圖片網址插入優化參數（自動格式/品質、限寬），大幅降低傳輸量。
 * 只處理 res.cloudinary.com 的 /image/upload/ 網址；已含轉換參數者原樣返回。
 */
function optimizeCloudinary(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }
  if (/\/image\/upload\/[a-z]_[^/]+\//.test(url)) return url; // 已有轉換參數
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_900/');
}

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
            src={optimizeCloudinary(src)}
            alt={alt}
            loading="eager"
            className={`block w-full h-auto object-cover transition-opacity duration-700 ease-in-out ${
              idx === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          // 其餘疊在第一張上方做交叉淡入
          <img
            key={src}
            src={optimizeCloudinary(src)}
            alt={alt}
            loading="lazy"
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
  // ✅ SSR-safe：使用確定性範本，避免 Math.random() hydration mismatch
  // 本文採定稿新 A 案（資歷＋定位並重）。備選：
  //   B 案（對話感優先）：'你的專業應該值更多錢，這是我做這件事的全部理由。我從房仲業務轉行當私人教練，
  //     在第一線一堂課一堂課賣起，被拒絕過無數次；後來帶起 50 人的教練團隊，才真正看懂業績不是逼出來的，
  //     是設計出來的。現在我做的事很單純：把這套設計交給還在硬撐的教練。'
  //   C 案（精簡，版面吃緊時用）：'私教變現顧問、教練職涯培訓講師。台東威豪健身總教官，帶約 50 人教練團隊。
  //     第一線私教出身，專攻銷售心理學與教練經營，只服務一種人——想把專業變成收入的私人教練。'
  const [aboutCoach, setAboutCoach] = useState(() =>
    getDefaultTemplate(
      'about_coach',
      '教練職涯培訓講師、私教變現顧問。第一線私教出身，現任台東威豪健身總教官，統籌約 50 人的教練團隊，負責業績與續約 KPI、教練育成與教學品質管理。十年產業經驗讓我很確定一件事：多數教練卡住的不是專業，是沒有一套把專業換成收入的系統。所以近年我把私教與管理的實戰方法整理成課程與陪跑，只教一件事——教練怎麼把技術變成穩定業績。'
    )
  );
  // tagline 備選：'關於教練'（保守）／'我是誰，憑什麼教你'（強對話感）
  const [tagline, setTagline] = useState('關於阿倫教官');
  const [coachName, setCoachName] = useState('阿倫教官');
  // 頭銜備選：'教練職涯培訓講師' ／ '教練的教練'
  const [coachTitle, setCoachTitle] = useState('私教變現顧問');
  const [images, setImages] = useState<string[]>(COACH_IMAGES);
  const [bullets, setBullets] = useState<string[]>(DEFAULT_BULLETS);
  // CTA 備選：'我的職涯故事' ／ '為什麼是我'
  const [cta, setCta] = useState('完整經歷');

  // 從後台載入內容，若 DB 回傳空值則保留範本
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

  return (
    <section
      className={`relative py-16 sm:py-20 md:py-24 px-4 overflow-hidden ${className}`}
    >
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
            className="relative max-w-sm mx-auto md:max-w-none"
            data-aos="fade-right"
            data-aos-duration="800"
          >
            {/* 第一張圖走正常流撐出容器寬高（見 RotatingImage 註解）；
                容器 relative 供其餘輪播圖 absolute 疊放 */}
            <div className="relative rounded-xl overflow-hidden">
              <RotatingImage images={images} alt={coachName} />
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
              {tagline}
            </span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-light text-white/90 mb-4 sm:mb-6 leading-tight"
              data-aos="fade-up"
              data-aos-delay="80"
            >
              {coachName}
              <br />
              <span className="text-gold">{coachTitle}</span>
            </h2>
            <p
              className="text-muted text-base sm:text-lg font-light leading-relaxed mb-4 sm:mb-6"
              data-aos="fade-up"
              data-aos-delay="160"
            >
              {aboutCoach}
            </p>
            <ul
              className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-left max-w-md mx-auto md:mx-0"
              data-aos="fade-up"
              data-aos-delay="240"
            >
              {bullets.map((item, index) => (
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
                {cta}
              </TextButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachIntroSection;
