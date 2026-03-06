/**
 * Login 頁面 - 登入
 * @module pages/Login
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useTheme } from "@/context";
import { Input, PillButton, Toast } from "@/components/ui";
import { PrismScene } from "@/components/three";
import SEOHead from "@/components/seo/SEOHead";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

/**
 * Login - 登入頁面
 *
 * @returns {JSX.Element} 登入頁面
 */
const Login: React.FC = () => {
  const { setTheme } = useTheme();
  const { login, isAuthenticated, loading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  // 處理 OAuth 回呼：後端設定 cookie 後重導向到 /login?success=true
  useEffect(() => {
    const oauthSuccess = searchParams.get("success");
    const oauthError = searchParams.get("error");

    if (oauthSuccess === "true") {
      // Cookie 已設定，觸發 checkAuth 重新驗證
      checkAuth();
    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        access_denied: "您已取消授權登入",
        invalid_state: "登入驗證失敗，請重試",
        no_code: "登入授權失敗，請重試",
        invalid_profile: "無法取得帳號資訊",
        create_failed: "建立帳號失敗，請稍後再試",
        server_error: "伺服器錯誤，請稍後再試",
      };
      setError(errorMessages[oauthError] || "登入失敗，請重試");
    }
  }, [searchParams, checkAuth]);

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

    try {
      await login(formData.email, formData.password);
      navigate("/member");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.error ||
        (err instanceof Error ? err.message : null) ||
        "登入失敗，請檢查帳號密碼";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxe-bg flex items-center justify-center px-4 py-8 sm:py-12 relative">
      <SEOHead title="登入 | 阿倫教官" noIndex={true} />
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
            登入您的帳號
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-luxe-surface p-5 sm:p-8 rounded-lg border border-luxe-gold/10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
              placeholder="請輸入密碼"
              value={formData.password}
              onChange={handleChange}
              theme="luxe"
              required
            />

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm text-luxe-muted hover:text-luxe-gold transition-colors"
              >
                忘記密碼？
              </Link>
            </div>

            <PillButton
              type="submit"
              variant="outline"
              theme="luxe"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "登入中..." : "登入"}
            </PillButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
            <div className="flex-1 border-t border-luxe-gold/10" />
            <span className="text-luxe-muted text-xs sm:text-sm">
              或使用以下方式登入
            </span>
            <div className="flex-1 border-t border-luxe-gold/10" />
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons />

          {/* Register Link */}
          <p className="text-center text-sm sm:text-base text-luxe-muted mt-6">
            還沒有帳號？{" "}
            <Link to="/register" className="text-luxe-gold hover:underline">
              立即註冊
            </Link>
          </p>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
    </div>
  );
};

export default Login;
