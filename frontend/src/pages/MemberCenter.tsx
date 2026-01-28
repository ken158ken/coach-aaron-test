/**
 * MemberCenter 頁面 - 會員中心
 * @module pages/MemberCenter
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth, useTheme } from "@/context";
import { StatCard, PillButton, Input, Toast } from "@/components/ui";

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
    <div className="min-h-screen bg-luxe-bg">
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-luxe-text mb-2">
                會員中心
              </h1>
              <p className="text-luxe-muted">
                歡迎回來，{user?.name || user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-luxe-muted hover:text-luxe-gold transition-colors text-sm"
            >
              登出
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
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
          <div className="flex gap-1 mb-8 border-b border-luxe-gold/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-6
                  py-3
                  text-sm
                  transition-colors
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
          <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl text-luxe-text font-light mb-6">
                  個人資料
                </h2>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-luxe-gold/20 flex items-center justify-center">
                    <span className="text-luxe-gold text-2xl">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-luxe-text text-lg">
                      {user?.name || "會員"}
                    </p>
                    <p className="text-luxe-muted text-sm">{user?.email}</p>
                  </div>
                </div>
                <form className="space-y-4 max-w-md">
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
                <h2 className="text-xl text-luxe-text font-light mb-6">
                  我的課程
                </h2>
                <div className="text-center py-12">
                  <p className="text-luxe-muted mb-4">您尚未購買任何課程</p>
                  <Link to="/courses">
                    <PillButton theme="luxe" variant="outline">
                      瀏覽課程
                    </PillButton>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-xl text-luxe-text font-light mb-6">
                  帳號設定
                </h2>
                <form className="space-y-4 max-w-md">
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
