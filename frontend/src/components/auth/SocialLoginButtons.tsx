/**
 * SocialLoginButtons - Google / LINE 社交登入按鈕
 *
 * @module components/auth/SocialLoginButtons
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { get } from "@/services/api";

/** OAuth 提供者狀態介面 */
interface OAuthProviders {
  google: boolean;
  line: boolean;
  facebook: boolean;
}

/**
 * 取得 API base URL（與 api.ts 一致）
 */
function getApiBaseUrl(): string {
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    return "";
  }
  return import.meta.env.VITE_API_URL || "http://localhost:5000";
}

/**
 * Google SVG Icon
 */
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * LINE SVG Icon
 */
const LineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 0 1-.63-.629V8.108a.63.63 0 0 1 .63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755Zm-3.855 3.016a.63.63 0 0 1-.63.63.626.626 0 0 1-.51-.262l-2.417-3.296v2.928a.63.63 0 0 1-1.26 0V8.108a.63.63 0 0 1 .63-.63c.2 0 .385.096.504.262l2.417 3.296V8.108a.63.63 0 0 1 1.266 0v4.771Zm-5.741 0a.63.63 0 0 1-1.26 0V8.108a.63.63 0 0 1 1.26 0v4.771Zm-2.527.63H4.856a.63.63 0 0 1-.63-.63V8.108a.63.63 0 0 1 1.26 0v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.63-.629.63ZM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

/**
 * Facebook SVG Icon
 */
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
  </svg>
);

/**
 * SocialLoginButtons - 社交登入按鈕組
 *
 * 自動偵測後端啟用的 OAuth 提供者，只顯示可用的按鈕。
 * 點擊後直接導向後端 OAuth 授權端點（瀏覽器跳轉）。
 */
export const SocialLoginButtons: React.FC = () => {
  const [providers, setProviders] = useState<OAuthProviders | null>(null);
  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    let cancelled = false;
    const fetchProviders = async () => {
      try {
        const data = await get<OAuthProviders>("/api/auth/providers");
        if (!cancelled) setProviders(data);
      } catch {
        // 靜默處理：API 不可用時不顯示社交按鈕
        if (!cancelled)
          setProviders({ google: false, line: false, facebook: false });
      }
    };
    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  // 載入中或全部未啟用時不渲染
  if (
    !providers ||
    (!providers.google && !providers.line && !providers.facebook)
  ) {
    return null;
  }

  const handleOAuthLogin = (provider: "google" | "line" | "facebook") => {
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {providers.google && (
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          aria-label="使用 Google 帳號登入"
          className="w-12 h-12 flex items-center justify-center
                     bg-white hover:bg-gray-50
                     rounded-full border border-gray-300
                     transition-all duration-200
                     hover:shadow-lg hover:scale-110 active:scale-95"
        >
          <GoogleIcon className="w-6 h-6" />
        </button>
      )}

      {providers.facebook && (
        <button
          type="button"
          onClick={() => handleOAuthLogin("facebook")}
          aria-label="使用 Facebook 帳號登入"
          className="w-12 h-12 flex items-center justify-center
                     bg-[#1877F2] hover:bg-[#166FE5]
                     text-white rounded-full
                     transition-all duration-200
                     hover:shadow-lg hover:scale-110 active:scale-95"
        >
          <FacebookIcon className="w-6 h-6" />
        </button>
      )}

      {providers.line && (
        <button
          type="button"
          onClick={() => handleOAuthLogin("line")}
          aria-label="使用 LINE 帳號登入"
          className="w-12 h-12 flex items-center justify-center
                     bg-[#06C755] hover:bg-[#05b34d]
                     text-white rounded-full
                     transition-all duration-200
                     hover:shadow-lg hover:scale-110 active:scale-95"
        >
          <LineIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default SocialLoginButtons;
