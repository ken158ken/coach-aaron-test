/**
 * CoachIntroSection 元件 - 教練介紹區塊（Aceternity Background Gradient 環境光暈）
 * @module components/sections/CoachIntroSection
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TextButton } from '@/components/ui';
import { contentService } from '@/services/site/content.service';
import { getDefaultTemplate } from '@/utils/contentTemplates';

interface CoachIntroSectionProps {
  className?: string;
}

/** 預設 bullets（DB 無值時 fallback） */
const DEFAULT_BULLETS: string[] = [
  'ACE 美國運動委員會認證教練',
  'ISSA 國際運動科學協會認證',
  '運動營養專家認證',
  '1000+ 學員成功案例',
];

/** 預設教練照（DB 無 Cloudinary URL 時 fallback） */
const DEFAULT_IMAGE = '/images/coach-aaron.jpg';

const CoachIntroSection: React.FC<CoachIntroSectionProps> = ({
  className = '',
}) => {
  // ✅ SSR-safe：使用確定性範本，避免 Math.random() hydration mismatch
  const [aboutCoach, setAboutCoach] = useState(() =>
    getDefaultTemplate(
      'about_coach',
      '擁有超過 10 年健身教學經驗，專注於體態雕塑、增肌減脂與運動表現提升。結合科學化訓練方法與個人化指導，幫助學員突破極限，達成目標。'
    )
  );
  const [tagline, setTagline] = useState('關於教練');
  const [coachName, setCoachName] = useState('Aaron 教練');
  const [coachTitle, setCoachTitle] = useState('專業健身指導');
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [bullets, setBullets] = useState<string[]>(DEFAULT_BULLETS);
  const [cta, setCta] = useState('了解更多');

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
        if (content.coach_intro_image_url?.trim())
          setImageUrl(content.coach_intro_image_url);
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
            <div className="aspect-3/4 rounded-xl overflow-hidden">
              <img
                src={imageUrl}
                alt={coachName}
                className="w-full h-full object-cover"
              />
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
