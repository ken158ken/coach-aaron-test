/**
 * MemberCenter 頁面 - 會員中心
 * @module pages/MemberCenter
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth, useTheme } from "@/context";
import { StatCard, PillButton, Input, Toast } from "@/components/ui";
import { PrismScene } from "@/components/three";

/**
 * MemberCenter - 會員中心頁面
 *
 * @returns {JSX.Element} 會員中心頁面
 */
const MemberCenter: React.FC = () => {
  const { setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "courses" | "settings"
  >("profile");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { key: "profile" as const, label: "個人資料" },
    { key: "courses" as const, label: "我的課程" },
    { key: "settings" as const, label: "帳號設定" },
  ];

  const stats = [
    { value: "3", label: "已購課程" },
    { value: "12", label: "完成課堂" },
    { value: "28", label: "學習天數" },
  ];

  return (
    <div className="min-h-screen bg-luxe-bg relative">
      {/* Three.js Background */}
      <PrismScene />

      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-luxe-text mb-1 sm:mb-2">
                會員中心
              </h1>
              <p className="text-sm sm:text-base text-luxe-muted truncate max-w-[250px] sm:max-w-none">
                歡迎回來，{user?.name || user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="self-start sm:self-auto text-luxe-muted hover:text-luxe-gold transition-colors text-xs sm:text-sm"
            >
              登出
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
                theme="luxe"
              />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 sm:gap-1 mb-6 sm:mb-8 border-b border-luxe-gold/10 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-3
                  sm:px-6
                  py-2.5
                  sm:py-3
                  text-xs
                  sm:text-sm
                  transition-colors
                  whitespace-nowrap
                  ${
                    activeTab === tab.key
                      ? "text-luxe-gold border-b-2 border-luxe-gold"
                      : "text-luxe-muted hover:text-luxe-text"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-6">
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl text-luxe-text font-light mb-4 sm:mb-6">
                  個人資料
                </h2>
                <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-luxe-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-luxe-gold text-xl sm:text-2xl">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg text-luxe-text truncate">
                      {user?.name || "會員"}
                    </p>
                    <p className="text-xs sm:text-sm text-luxe-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <form className="space-y-3 sm:space-y-4 max-w-md">
                  <Input
                    label="姓名"
                    defaultValue={user?.name || ""}
                    theme="luxe"
                  />
                  <Input
                    label="電子郵件"
                    defaultValue={user?.email || ""}
                    theme="luxe"
                    disabled
                  />
                  <PillButton theme="luxe" variant="outline">
                    更新資料
                  </PillButton>
                </form>
              </div>
            )}

            {activeTab === "courses" && (
              <div>
                <h2 className="text-lg sm:text-xl text-luxe-text font-light mb-4 sm:mb-6">
                  我的課程
                </h2>
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-luxe-muted mb-3 sm:mb-4">
                    您尚未購買任何課程
                  </p>
                  <Link to="/courses">
                    <PillButton theme="luxe" variant="outline">
                      瀏覽課程
                    </PillButton>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl text-luxe-text font-light mb-4 sm:mb-6">
                  帳號設定
                </h2>
                <form className="space-y-3 sm:space-y-4 max-w-md">
                  <Input
                    type="password"
                    label="目前密碼"
                    placeholder="請輸入目前密碼"
                    theme="luxe"
                  />
                  <Input
                    type="password"
                    label="新密碼"
                    placeholder="請輸入新密碼"
                    theme="luxe"
                  />
                  <Input
                    type="password"
                    label="確認新密碼"
                    placeholder="請再次輸入新密碼"
                    theme="luxe"
                  />
                  <PillButton theme="luxe" variant="outline">
                    更新密碼
                  </PillButton>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default MemberCenter;
