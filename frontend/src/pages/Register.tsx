/**
 * Register 頁面 - 註冊
 * @module pages/Register
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "@/context";
import { Input, PillButton, Toast } from "@/components/ui";
import { PrismScene } from "@/components/three";
import SEOHead from "@/components/seo/SEOHead";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

/**
 * Register - 註冊頁面
 *
 * @returns {JSX.Element} 註冊頁面
 */
const Register: React.FC = () => {
  const { setTheme } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/member");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("密碼確認不一致");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("密碼長度至少需要 6 個字元");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxe-bg flex items-center justify-center px-4 py-8 sm:py-12 relative">
      <SEOHead title="註冊 | 阿倫教官" noIndex={true} />
      {/* Three.js Background */}
      <PrismScene />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8 sm:mb-10">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-light text-luxe-gold tracking-widest">
              AARON
            </h1>
          </Link>
          <p className="text-sm sm:text-base text-luxe-muted mt-2 font-light">
            建立您的帳號
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-luxe-surface p-5 sm:p-8 rounded-lg border border-luxe-gold/10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
              placeholder="請輸入電子郵件"
              value={formData.email}
              onChange={handleChange}
              theme="luxe"
              required
            />
            <Input
              name="password"
              type="password"
              label="密碼"
              placeholder="請輸入密碼 (至少 6 個字元)"
              value={formData.password}
              onChange={handleChange}
              theme="luxe"
              required
            />
            <Input
              name="confirmPassword"
              type="password"
              label="確認密碼"
              placeholder="請再次輸入密碼"
              value={formData.confirmPassword}
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
              {loading ? "註冊中..." : "註冊"}
            </PillButton>
          </form>

          {/* Terms */}
          <p className="text-center text-luxe-muted text-[10px] sm:text-xs mt-4 sm:mt-6 px-2">
            註冊即表示您同意我們的{" "}
            <Link to="/terms" className="text-luxe-gold hover:underline">
              服務條款
            </Link>{" "}
            與{" "}
            <Link to="/privacy" className="text-luxe-gold hover:underline">
              隱私政策
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
            <div className="flex-1 border-t border-luxe-gold/10" />
            <span className="text-luxe-muted text-xs sm:text-sm">
              或使用以下方式註冊
            </span>
            <div className="flex-1 border-t border-luxe-gold/10" />
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons />

          {/* Login Link */}
          <p className="text-center text-sm sm:text-base text-luxe-muted mt-6">
            已經有帳號？{" "}
            <Link to="/login" className="text-luxe-gold hover:underline">
              立即登入
            </Link>
          </p>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      {/* Success Toast */}
      {success && (
        <Toast message="註冊成功！即將跳轉至登入頁面..." type="success" />
      )}
    </div>
  );
};

export default Register;
