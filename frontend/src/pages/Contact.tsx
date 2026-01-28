/**
 * Contact 頁面 - 聯絡我們
 * @module pages/Contact
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { useTheme } from "@/context";
import { Input, Textarea, PillButton, Toast } from "@/components/ui";
import { SOCIAL_LINKS } from "@/constants";

/**
 * Contact - 聯絡頁面
 *
 * @returns {JSX.Element} 聯絡頁面
 */
const Contact: React.FC = () => {
  const { setTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setToast({ message: "訊息已送出，我們會盡快回覆您！", type: "success" });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setToast({ message: "送出失敗，請稍後再試", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const socialItems = [
    { name: "Instagram", href: SOCIAL_LINKS.INSTAGRAM, icon: "📷" },
    { name: "Facebook", href: SOCIAL_LINKS.FACEBOOK, icon: "👤" },
    { name: "YouTube", href: SOCIAL_LINKS.YOUTUBE, icon: "🎬" },
    { name: "LINE", href: SOCIAL_LINKS.LINE, icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-luxe-bg">
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-luxe-gold text-sm uppercase tracking-widest mb-4">
              Contact
            </span>
            <h1 className="text-4xl md:text-5xl font-light text-luxe-text mb-4">
              聯絡我們
            </h1>
            <p className="text-luxe-muted max-w-xl mx-auto font-light">
              有任何問題或諮詢需求，歡迎與我們聯繫
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-xl text-luxe-text mb-6 font-light">
                傳送訊息
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  name="name"
                  label="姓名"
                  placeholder="請輸入您的姓名"
                  value={formData.name}
                  onChange={handleChange}
                  theme="luxe"
                  required
                />
                <Input
                  name="email"
                  type="email"
                  label="電子郵件"
                  placeholder="請輸入您的電子郵件"
                  value={formData.email}
                  onChange={handleChange}
                  theme="luxe"
                  required
                />
                <Input
                  name="subject"
                  label="主旨"
                  placeholder="請輸入訊息主旨"
                  value={formData.subject}
                  onChange={handleChange}
                  theme="luxe"
                  required
                />
                <Textarea
                  name="message"
                  label="訊息內容"
                  placeholder="請輸入您想詢問的內容..."
                  value={formData.message}
                  onChange={handleChange}
                  theme="luxe"
                  required
                />
                <PillButton
                  type="submit"
                  variant="outline"
                  theme="luxe"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "送出中..." : "送出訊息"}
                </PillButton>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-xl text-luxe-text mb-6 font-light">
                其他聯絡方式
              </h2>

              {/* Info Cards */}
              <div className="space-y-6 mb-8">
                <div className="p-6 bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 hover:shadow-lg hover:shadow-luxe-gold/5 transition-all duration-300">
                  <h3 className="text-luxe-gold text-sm uppercase tracking-widest mb-2">
                    Email
                  </h3>
                  <p className="text-luxe-text">contact@coach-aaron.com</p>
                </div>
                <div className="p-6 bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 hover:shadow-lg hover:shadow-luxe-gold/5 transition-all duration-300">
                  <h3 className="text-luxe-gold text-sm uppercase tracking-widest mb-2">
                    營業時間
                  </h3>
                  <p className="text-luxe-text">週一至週六 09:00 - 21:00</p>
                </div>
              </div>

              {/* Social Links */}
              <h3 className="text-luxe-text mb-4 font-light">社群媒體</h3>
              <div className="grid grid-cols-2 gap-4">
                {socialItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/40 hover:shadow-lg hover:shadow-luxe-gold/10 hover:-translate-y-1 transition-all duration-300"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-luxe-text">{item.name}</span>
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
