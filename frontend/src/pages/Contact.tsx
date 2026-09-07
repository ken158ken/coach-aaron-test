/**
 * Contact 頁面 - 聯絡阿倫教官
 * @module pages/Contact
 * @theme luxe (LUXE 高端主題)
 * @description 包含聯絡表單（透過 Resend 發送郵件）、教練個人資訊與社群連結
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, PillButton, Toast, PageHeader } from "@/components/ui";
import { ImagesBadge, type BadgeItem } from "@/components/ui/ImagesBadge";
import { SOCIAL_LINKS, COACH_INFO, API_BASE_URL } from "@/constants";
import { contentService } from "@/services/site/content.service";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";

/** 表單資料介面 */
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/** 初始表單資料 */
const INITIAL_FORM_DATA: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

/**
 * Contact - 聯絡頁面
 *
 * @returns {JSX.Element} 聯絡頁面
 */
const Contact: React.FC = () => {
  const { t, language } = useLanguage();
  const extra = t.contactExtra;

  /**
   * 聯絡資訊（後台「內容管理 → 聯絡資訊」可抽換）：
   * site_content 的 contact_* keys，讀不到就 fallback 到 constants 的舊值，
   * 後台沒填任何東西時頁面與改版前一模一樣。
   */
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  useEffect(() => {
    contentService
      .getPublicContent()
      .then(setSiteContent)
      .catch(() => {});
  }, []);
  /** 取 contact_{key}，英文介面優先吃 {key}_en */
  const cc = (key: string, fallback = ""): string => {
    if (language === "en") {
      const en = siteContent[`contact_${key}_en`]?.trim();
      if (en) return en;
    }
    return siteContent[`contact_${key}`]?.trim() || fallback;
  };

  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_DATA);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /**
   * 前端輸入基礎驗證
   */
  const validateForm = (): string | null => {
    const { name, email, subject, message } = formData;

    if (!name.trim() || name.trim().length < 2) {
      return extra.validation.nameMin;
    }
    if (name.trim().length > 50) {
      return extra.validation.nameMax;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return extra.validation.emailInvalid;
    }

    // 電話可選，但若填寫要驗證格式
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+\-() ]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        return extra.validation.phoneInvalid;
      }
    }

    if (!subject.trim() || subject.trim().length < 2) {
      return extra.validation.subjectRequired;
    }
    if (subject.trim().length > 100) {
      return extra.validation.subjectMax;
    }

    if (!message.trim() || message.trim().length < 10) {
      return extra.validation.messageMin;
    }
    if (message.trim().length > 2000) {
      return extra.validation.messageMax;
    }

    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * 送出聯絡表單
   * @description 呼叫後端 /api/contact API 透過 Resend 發送郵件
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端驗證
    const validationError = validateForm();
    if (validationError) {
      setToast({ message: validationError, type: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || extra.errors.sendFailed);
      }

      setToast({
        message: t.contact.formSuccess,
        type: "success",
      });
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : extra.errors.sendFailedRetry;
      setToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /** 社群連結列表（BadgeItem 格式，供 ImagesBadge 使用）——後台 contact_socials JSON 可整組抽換 */
  const defaultSocialItems: BadgeItem[] = [
    {
      name: "Instagram",
      href: SOCIAL_LINKS.INSTAGRAM,
      icon: "📷",
      desc: "@coach.luen",
      bg: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
    },
    {
      name: extra.social.lineOfficialName,
      href: SOCIAL_LINKS.LINE_OFFICIAL,
      icon: "💬",
      desc: COACH_INFO.LINE_ID,
      bg: "#06C755",
    },
    {
      name: extra.social.lineGroupName,
      href: SOCIAL_LINKS.LINE_GROUP,
      icon: "👥",
      desc: extra.social.lineGroupDesc,
      bg: "#06a845",
    },
    {
      name: "Facebook",
      href: SOCIAL_LINKS.FACEBOOK,
      icon: "👤",
      desc: extra.social.facebookDesc,
      bg: "#1877F2",
    },
    {
      name: "TikTok",
      href: SOCIAL_LINKS.TIKTOK,
      icon: "🎵",
      desc: "@coachluen",
      bg: "#111111",
    },
    {
      name: "Podcast",
      href: SOCIAL_LINKS.PODCAST,
      icon: "🎙️",
      desc: extra.social.podcastDesc,
      bg: "#9b59b6",
    },
    {
      name: "Notion",
      href: SOCIAL_LINKS.NOTION,
      icon: "📝",
      desc: extra.social.notionDesc,
      bg: "#191919",
    },
  ];

  /** 後台有填 contact_socials（JSON 陣列）就用它；解析失敗一律退回預設，不讓頁面掛掉 */
  const socialItems: BadgeItem[] = (() => {
    const raw = siteContent["contact_socials"];
    if (!raw) return defaultSocialItems;
    try {
      const arr = JSON.parse(raw) as Array<Partial<BadgeItem>>;
      if (!Array.isArray(arr)) return defaultSocialItems;
      const items = arr
        .filter(
          (s): s is BadgeItem =>
            !!s && typeof s.name === "string" && typeof s.href === "string" && !!s.href,
        )
        .map((s) => ({
          name: s.name,
          href: s.href,
          icon: s.icon || "🔗",
          desc: s.desc || "",
          bg: s.bg || "#444444",
        }));
      return items.length > 0 ? items : defaultSocialItems;
    } catch {
      return defaultSocialItems;
    }
  })();

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title={t.contact.heading}
        description={t.contact.subtitle}
        keywords={extra.seoKeywords}
        url="/contact"
      />
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 relative z-10">
        <div className="studio-container">
          {/* Header */}
          <PageHeader
            label={t.contact.pageLabel}
            title={t.contact.heading}
            subtitle={t.contact.subtitle}
          />

          {/* Coach Info Banner */}
          <div
            className="mb-8 sm:mb-10 p-5 sm:p-8 bg-surface rounded-xl border border-gold/20"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#c5a059]/10 border-2 border-gold/40 flex items-center justify-center shrink-0">
                <span className="text-3xl sm:text-4xl">🏆</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl text-white/90 font-medium mb-1">
                  {t.coachInfo.name}
                </h2>
                <p className="text-sm text-gold mb-2">
                  {t.coachInfo.title}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    {extra.badges.nsca}
                  </span>
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    {extra.badges.tquk}
                  </span>
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    {extra.badges.nlp}
                  </span>
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    {extra.badges.coachesTrained}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Contact Form */}
            <div data-aos="fade-right" data-aos-delay="150">
              <h2 className="text-lg sm:text-xl text-white/90 mb-4 sm:mb-6 font-light">
                {t.contact.formSection}
              </h2>
              <div className="panel-glass rounded-xl p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <Input
                  name="name"
                  label={t.contact.formName}
                  placeholder={t.contact.namePlaceholder}
                  value={formData.name}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <Input
                  name="email"
                  type="email"
                  label={t.contact.formEmail}
                  placeholder={t.contact.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <Input
                  name="phone"
                  type="tel"
                  label={t.contact.formPhone}
                  placeholder={t.contact.phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange}
                  theme="studio"
                />
                <Input
                  name="subject"
                  label={t.contact.formSubject}
                  placeholder={t.contact.subjectPlaceholder}
                  value={formData.subject}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <Textarea
                  name="message"
                  label={t.contact.formMessage}
                  placeholder={t.contact.messagePlaceholder}
                  value={formData.message}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <PillButton
                  type="submit"
                  variant="default"
                  theme="studio"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? extra.sending : t.contact.formSubmit}
                </PillButton>
                <p className="text-xs text-muted text-center whitespace-pre-line">
                  {cc("form_intro") || t.contact.formNote}
                </p>
              </form>
              </div>
            </div>

            {/* Contact Info & Social */}
            <div data-aos="fade-left" data-aos-delay="200">
              <h2 className="text-lg sm:text-xl text-white/90 mb-4 sm:mb-6 font-light">
                {t.contact.infoSection}
              </h2>

              {/* 教練形象照（後台「聯絡資訊」可抽換；照片上文字走 hero-has-photo 豁免，雙主題皆亮字） */}
              {cc("photo_url") && (
                <motion.div
                  className="hero-has-photo relative rounded-xl overflow-hidden border border-gold/25 mb-5 sm:mb-6"
                  whileHover={{ y: -4, boxShadow: "0 12px 36px rgba(0,0,0,0.25)" }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src={cc("photo_url")}
                    alt={cc("name", COACH_INFO.NAME)}
                    className="w-full aspect-square object-cover object-top"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-12"
                    style={{ background: "linear-gradient(to top, rgba(8,8,8,0.75), transparent)" }}
                  >
                    <p className="text-white font-medium tracking-wide">
                      {cc("name", COACH_INFO.NAME)}
                    </p>
                    <p className="text-white/75 text-xs mt-0.5">
                      {cc("title", COACH_INFO.TITLE)}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Info Cards */}
              <div className="space-y-4 mb-6 sm:mb-8">
                {/* LINE 快速聯繫 */}
                <motion.a
                  href={cc("line_url", SOCIAL_LINKS.LINE_OFFICIAL)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-5 bg-[#06C755]/8 rounded-lg border border-[#06C755]/25"
                  whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(6,199,85,0.22)", borderColor: "rgba(6,199,85,0.6)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <h3 className="text-[#06C755] text-sm font-medium mb-0.5">
                        {t.contact.lineQuickContact}
                      </h3>
                      <p className="text-sm text-white/90">
                        ID: {cc("line_id", COACH_INFO.LINE_ID)}
                      </p>
                    </div>
                  </div>
                </motion.a>

                {/* Email */}
                <motion.div
                  className="p-4 sm:p-5 tile-tint tile-tint--gold rounded-lg"
                  whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(197,160,89,0.18)", borderColor: "rgba(197,160,89,0.45)" }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-gold text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                    {t.contact.email}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 break-all">
                    {cc("email", COACH_INFO.EMAIL)}
                  </p>
                </motion.div>

                {/* 營業時間 */}
                <motion.div
                  className="p-4 sm:p-5 tile-tint tile-tint--wine rounded-lg"
                  whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(197,160,89,0.18)", borderColor: "rgba(197,160,89,0.45)" }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-gold text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                    {t.contact.businessHours}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90">
                    {cc("hours", t.coachInfo.businessHours)}
                  </p>
                </motion.div>
              </div>

              {/* Social Links — Images Badge */}
              <h3 className="text-sm sm:text-base text-white/90 mb-2 font-light">
                {t.contact.socialSection}
              </h3>
              <p className="text-xs text-white/35 mb-4">{extra.hoverHint}</p>

              <ImagesBadge
                items={socialItems}
                badgeSize={48}
                hoverTranslateY={130}
                hoverSpread={20}
                overlap={-14}
              />

              {/* 悄悄話區塊已於 2026-09-07 依業主要求移除（表單說明欄位改由後台聯絡資訊管理） */}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Contact;
