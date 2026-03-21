/**
 * Contact 頁面 - 聯絡阿倫教官
 * @module pages/Contact
 * @theme luxe (LUXE 高端主題)
 * @description 包含聯絡表單（透過 Resend 發送郵件）、教練個人資訊與社群連結
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, PillButton, Toast, PageHeader } from "@/components/ui";
import { SOCIAL_LINKS, COACH_INFO, API_BASE_URL } from "@/constants";
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
  const { t } = useLanguage();
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
      return "請輸入至少 2 個字的姓名";
    }
    if (name.trim().length > 50) {
      return "姓名不能超過 50 個字";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return "請輸入有效的電子郵件地址";
    }

    // 電話可選，但若填寫要驗證格式
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+\-() ]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        return "電話格式不正確";
      }
    }

    if (!subject.trim() || subject.trim().length < 2) {
      return "請輸入訊息主旨";
    }
    if (subject.trim().length > 100) {
      return "主旨不能超過 100 個字";
    }

    if (!message.trim() || message.trim().length < 10) {
      return "訊息內容至少需要 10 個字";
    }
    if (message.trim().length > 2000) {
      return "訊息內容不能超過 2000 個字";
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
        throw new Error(result.error || "送出失敗");
      }

      setToast({
        message: t.contact.formSuccess,
        type: "success",
      });
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "送出失敗，請稍後再試";
      setToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /** 社群連結列表 */
  const socialItems = [
    {
      name: "Instagram",
      href: SOCIAL_LINKS.INSTAGRAM,
      icon: "📷",
      desc: "@coach.luen",
    },
    {
      name: "LINE 官方",
      href: SOCIAL_LINKS.LINE_OFFICIAL,
      icon: "💬",
      desc: COACH_INFO.LINE_ID,
    },
    {
      name: "LINE 社群",
      href: SOCIAL_LINKS.LINE_GROUP,
      icon: "👥",
      desc: "私人教練專業變現",
    },
    {
      name: "Facebook",
      href: SOCIAL_LINKS.FACEBOOK,
      icon: "👤",
      desc: "阿倫教官",
    },
    {
      name: "TikTok",
      href: SOCIAL_LINKS.TIKTOK,
      icon: "🎵",
      desc: "@coachluen",
    },
    {
      name: "Podcast",
      href: SOCIAL_LINKS.PODCAST,
      icon: "🎙️",
      desc: "陪你健身",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title={t.contact.heading}
        description={t.contact.subtitle}
        keywords={[
          "聯絡阿倫教官",
          "教練諮詢",
          "免費諮詢",
          "私人教練培訓",
          "私人教練銷售",
          "健身教練銷售",
          "皮拉提斯銷售",
          "阿倫教官LINE",
          "教練業績提升",
        ]}
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
                  {COACH_INFO.NAME}
                </h2>
                <p className="text-sm text-gold mb-2">
                  {COACH_INFO.TITLE}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    NSCA-CPT 認證
                  </span>
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    TQUK 心理諮詢師
                  </span>
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    NLP 心理執行師
                  </span>
                  <span className="bg-[#c5a059]/10 px-2 py-1 rounded">
                    130+ 教練培訓
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
              <div className="rounded-xl bg-black/60 border border-white/8 p-5 sm:p-6">
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
                  {loading ? t.common.submit + "..." : t.contact.formSubmit}
                </PillButton>
                <p className="text-xs text-muted text-center">
                  {t.contact.formNote}
                </p>
              </form>
              </div>
            </div>

            {/* Contact Info & Social */}
            <div data-aos="fade-left" data-aos-delay="200">
              <h2 className="text-lg sm:text-xl text-white/90 mb-4 sm:mb-6 font-light">
                {t.contact.infoSection}
              </h2>

              {/* Info Cards */}
              <div className="space-y-4 mb-6 sm:mb-8">
                {/* LINE 快速聯繫 */}
                <motion.a
                  href={SOCIAL_LINKS.LINE_OFFICIAL}
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
                        ID: {COACH_INFO.LINE_ID}
                      </p>
                    </div>
                  </div>
                </motion.a>

                {/* Email */}
                <motion.div
                  className="p-4 sm:p-5 bg-black/40 rounded-lg border border-gold/15"
                  whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(197,160,89,0.18)", borderColor: "rgba(197,160,89,0.45)" }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-gold text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                    {t.contact.email}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 break-all">
                    {COACH_INFO.EMAIL}
                  </p>
                </motion.div>

                {/* 營業時間 */}
                <motion.div
                  className="p-4 sm:p-5 bg-black/40 rounded-lg border border-gold/15"
                  whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(197,160,89,0.18)", borderColor: "rgba(197,160,89,0.45)" }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-gold text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                    {t.contact.businessHours}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90">
                    {COACH_INFO.BUSINESS_HOURS}
                  </p>
                </motion.div>
              </div>

              {/* Social Links — Images Badge */}
              <h3 className="text-sm sm:text-base text-white/90 mb-4 sm:mb-5 font-light">
                {t.contact.socialSection}
              </h3>

              {/* Overlapping circle badges */}
              <div className="flex flex-wrap gap-y-6 gap-x-2 items-center justify-start">
                {socialItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                    style={{ marginRight: "-8px" }}
                  >
                    {/* Circle */}
                    <motion.div
                      className="w-12 h-12 rounded-full border-2 border-studio-bg flex items-center justify-center text-xl bg-white/8 backdrop-blur-sm shadow-lg"
                      whileHover={{ y: -6, scale: 1.15, zIndex: 20 }}
                      transition={{ duration: 0.18 }}
                      style={{ position: "relative", zIndex: 1 }}
                    >
                      {item.icon}
                    </motion.div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                      <div className="bg-black/90 border border-white/10 rounded-lg px-3 py-1.5 shadow-xl">
                        <p className="text-white/90 text-xs font-medium">{item.name}</p>
                        <p className="text-white/45 text-[11px]">{item.desc}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Social names row */}
              <div className="mt-6 flex flex-wrap gap-2">
                {socialItems.map((item) => (
                  <a
                    key={`label-${item.name}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/40 hover:text-gold transition-colors px-2 py-1 rounded-md hover:bg-gold/8"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
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
