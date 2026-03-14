/**
 * Contact 頁面 - 聯絡阿倫教官
 * @module pages/Contact
 * @theme luxe (LUXE 高端主題)
 * @description 包含聯絡表單（透過 Resend 發送郵件）、教練個人資訊與社群連結
 */

import React, { useState } from "react";
import { Input, Textarea, PillButton, Toast } from "@/components/ui";
import { SOCIAL_LINKS, COACH_INFO, API_BASE_URL } from "@/constants";
import SEOHead from "@/components/seo/SEOHead";

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
        message: "訊息已送出！阿倫教官會盡快回覆您 📩",
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
        title="聯絡阿倫教官 - 免費40分鐘1對1諮詢 | 私教變現專家"
        description="想提升教練業績？立即預約阿倫教官免費諮詢。威豪健身總教官，NSCA+TQUK+NLP認證，已協助130+教練月收穩定8萬以上。LINE官方帳號：@667nqldx"
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
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block text-[#d4d4d4] text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              Contact
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white/90 mb-3 sm:mb-4">
              聯絡阿倫教官
            </h1>
            <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
              想提升教練業績？100天月入8萬起，免費 40 分鐘 1 對 1 諮詢
            </p>
          </div>

          {/* Coach Info Banner */}
          <div className="mb-8 sm:mb-10 p-5 sm:p-8 bg-[#141414] rounded-xl border border-[#c5a059]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#c5a059]/10 border-2 border-[#c5a059]/40 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl sm:text-4xl">🏆</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl text-white/90 font-medium mb-1">
                  {COACH_INFO.NAME}
                </h2>
                <p className="text-sm text-[#c5a059] mb-2">
                  {COACH_INFO.TITLE}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-[#888]">
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
            <div>
              <h2 className="text-lg sm:text-xl text-white/90 mb-4 sm:mb-6 font-light">
                傳送訊息
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <Input
                  name="name"
                  label="姓名"
                  placeholder="請輸入您的姓名"
                  value={formData.name}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <Input
                  name="email"
                  type="email"
                  label="電子郵件"
                  placeholder="請輸入您的電子郵件"
                  value={formData.email}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <Input
                  name="phone"
                  type="tel"
                  label="電話（選填）"
                  placeholder="例如：0912-345-678"
                  value={formData.phone}
                  onChange={handleChange}
                  theme="studio"
                />
                <Input
                  name="subject"
                  label="主旨"
                  placeholder="例如：想了解教練培訓課程"
                  value={formData.subject}
                  onChange={handleChange}
                  theme="studio"
                  required
                />
                <Textarea
                  name="message"
                  label="訊息內容"
                  placeholder="請描述您的需求或問題，我們會盡快回覆您..."
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
                  {loading ? "送出中..." : "📩 送出訊息"}
                </PillButton>
                <p className="text-xs text-[#888] text-center">
                  送出後將由 Email 通知阿倫教官，通常 24 小時內回覆
                </p>
              </form>
            </div>

            {/* Contact Info & Social */}
            <div>
              <h2 className="text-lg sm:text-xl text-white/90 mb-4 sm:mb-6 font-light">
                聯絡方式
              </h2>

              {/* Info Cards */}
              <div className="space-y-4 mb-6 sm:mb-8">
                {/* LINE 快速聯繫 */}
                <a
                  href={SOCIAL_LINKS.LINE_OFFICIAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-5 bg-[#06C755]/10 rounded-lg border border-[#06C755]/30 hover:border-[#06C755]/60 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <h3 className="text-[#06C755] text-sm font-medium mb-0.5">
                        LINE 官方帳號（最快回覆）
                      </h3>
                      <p className="text-sm text-white/90">
                        ID: {COACH_INFO.LINE_ID}
                      </p>
                    </div>
                  </div>
                </a>

                {/* Email */}
                <div className="p-4 sm:p-5 bg-[#141414] rounded-lg border border-[#c5a059]/10 hover:border-[#c5a059]/30 transition-all duration-300">
                  <h3 className="text-[#c5a059] text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                    Email
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 break-all">
                    {COACH_INFO.EMAIL}
                  </p>
                </div>

                {/* 營業時間 */}
                <div className="p-4 sm:p-5 bg-[#141414] rounded-lg border border-[#c5a059]/10 hover:border-[#c5a059]/30 transition-all duration-300">
                  <h3 className="text-[#c5a059] text-xs sm:text-sm uppercase tracking-widest mb-1.5">
                    營業時間
                  </h3>
                  <p className="text-sm sm:text-base text-white/90">
                    {COACH_INFO.BUSINESS_HOURS}
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <h3 className="text-sm sm:text-base text-white/90 mb-3 sm:mb-4 font-light">
                社群媒體
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {socialItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#141414] rounded-lg border border-[#c5a059]/10 hover:border-[#c5a059]/40 hover:shadow-lg hover:shadow-[#c5a059]/10 hover:-translate-y-1 transition-all duration-300"
                  >
                    <span className="text-xl sm:text-2xl">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-white/90 block">
                        {item.name}
                      </span>
                      <span className="text-xs text-[#888] truncate block">
                        {item.desc}
                      </span>
                    </div>
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
