/**
 * Register 頁面 - 註冊
 * @module pages/Register
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import { Input, PillButton, Toast } from "@/components/ui";
import SEOHead from "@/components/seo/SEOHead";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

/**
 * Register - 註冊頁面
 *
 * @returns {JSX.Element} 註冊頁面
 */
const Register: React.FC = () => {
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
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 pt-24 pb-8 sm:pt-28 sm:pb-12 relative">
      <SEOHead title="註冊 | 阿倫教官" noIndex={true} />
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8 sm:mb-10">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-light text-[#c5a059] tracking-widest">
              AARON
            </h1>
          </Link>
          <p className="text-sm sm:text-base text-[#888] mt-2 font-light">
            建立您的帳號
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#141414] p-5 sm:p-8 rounded-lg border border-[#c5a059]/10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
              placeholder="請輸入電子郵件"
              value={formData.email}
              onChange={handleChange}
              theme="studio"
              required
            />
            <Input
              name="password"
              type="password"
              label="密碼"
              placeholder="請輸入密碼 (至少 6 個字元)"
              value={formData.password}
              onChange={handleChange}
              theme="studio"
              required
            />
            <Input
              name="confirmPassword"
              type="password"
              label="確認密碼"
              placeholder="請再次輸入密碼"
              value={formData.confirmPassword}
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
              {loading ? "註冊中..." : "註冊"}
            </PillButton>
          </form>

          {/* Terms */}
          <p className="text-center text-[#888] text-[10px] sm:text-xs mt-4 sm:mt-6 px-2">
            註冊即表示您同意我們的{" "}
            <Link to="/terms" className="text-[#c5a059] hover:underline">
              服務條款
            </Link>{" "}
            與{" "}
            <Link to="/privacy" className="text-[#c5a059] hover:underline">
              隱私政策
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
            <div className="flex-1 border-t border-[#c5a059]/10" />
            <span className="text-[#888] text-xs sm:text-sm">
              或使用以下方式註冊
            </span>
            <div className="flex-1 border-t border-[#c5a059]/10" />
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons />

          {/* Login Link */}
          <p className="text-center text-sm sm:text-base text-[#888] mt-6">
            已經有帳號？{" "}
            <Link to="/login" className="text-[#c5a059] hover:underline">
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
