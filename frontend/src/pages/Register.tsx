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
import { useLanguage } from "@/context/LanguageContext";
import { LogoVertical } from "@/components/brand";

/**
 * Register - 註冊頁面
 *
 * @returns {JSX.Element} 註冊頁面
 */
const Register: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
      setError(t.register.passwordMismatch);
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.register.passwordTooShort);
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
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
            {/* 保留 h1 作為頁面標題語意，可視內容改為直式品牌 lockup；
                文字為 currentColor，沿用原本的 text-gold */}
            <h1 className="text-gold m-0">
              <LogoVertical
                title="阿倫教官 Coach Aaron"
                className="h-32 sm:h-40 w-auto mx-auto"
              />
            </h1>
          </Link>
          <p className="text-sm sm:text-base text-muted mt-2 font-light">
            {t.register.subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface p-5 sm:p-8 rounded-lg border border-gold/10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Input
              name="name"
              label={t.register.name}
              placeholder={t.register.name}
              value={formData.name}
              onChange={handleChange}
              theme="studio"
              required
            />
            <Input
              name="email"
              type="email"
              label={t.register.email}
              placeholder={t.register.email}
              value={formData.email}
              onChange={handleChange}
              theme="studio"
              required
            />
            <Input
              name="password"
              type="password"
              label={t.register.password}
              placeholder={t.register.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              theme="studio"
              required
            />
            <Input
              name="confirmPassword"
              type="password"
              label={t.register.confirmPassword}
              placeholder={t.register.confirmPassword}
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
              {loading ? t.register.submitting : t.register.submit}
            </PillButton>
          </form>

          {/* Terms */}
          <p className="text-center text-muted text-[10px] sm:text-xs mt-4 sm:mt-6 px-2">
            {t.register.terms}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
            <div className="flex-1 border-t border-gold/10" />
            <span className="text-muted text-xs sm:text-sm">
              {t.register.orWith}
            </span>
            <div className="flex-1 border-t border-gold/10" />
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons />

          {/* Login Link */}
          <p className="text-center text-sm sm:text-base text-muted mt-6">
            {t.register.hasAccount}{" "}
            <Link to="/login" className="text-gold hover:underline">
              {t.register.loginNow}
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
        <Toast message={t.register.successMsg} type="success" />
      )}
    </div>
  );
};

export default Register;
