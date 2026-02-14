/**
 * MemberCenter 頁面 - 會員中心
 * @module pages/MemberCenter
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, useTheme } from "@/context";
import { StatCard, PillButton, Input, Toast, Modal } from "@/components/ui";
import { AvatarPicker } from "@/components/ui/avatar";
import { PrismScene } from "@/components/three";
import SEOHead from "@/components/seo/SEOHead";
import { userService } from "@/services";

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[MemberCenter] ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`[MemberCenter] ${msg}`, err),
};

/**
 * MemberCenter - 會員中心頁面
 *
 * @returns {JSX.Element} 會員中心頁面
 */
const MemberCenter: React.FC = () => {
  const { setTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "courses" | "settings"
  >("profile");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  /**
   * AvatarPicker 選擇完成 → 上傳到後端
   */
  const handleAvatarSelect = useCallback(
    async (avatarBase64: string) => {
      setAvatarUploading(true);
      try {
        logger.info("上傳頭像到後端...");
        const result = await userService.uploadAvatar(
          avatarBase64,
          "generated",
        );
        if (result.success && result.avatarUrl) {
          updateUser({ avatar_url: result.avatarUrl });
          setToast({ message: "頭像更新成功！", type: "success" });
          setShowAvatarPicker(false);
          logger.info("頭像更新成功");
        }
      } catch (err) {
        logger.error("頭像上傳失敗", err);
        setToast({ message: "頭像上傳失敗，請稍後再試", type: "error" });
      } finally {
        setAvatarUploading(false);
      }
    },
    [updateUser],
  );

  /**
   * 刪除頭像
   */
  const handleAvatarDelete = useCallback(async () => {
    setAvatarUploading(true);
    try {
      const result = await userService.deleteAvatar();
      if (result.success) {
        updateUser({ avatar_url: undefined });
        setToast({ message: "頭像已移除", type: "success" });
      }
    } catch (err) {
      logger.error("刪除頭像失敗", err);
      setToast({ message: "刪除頭像失敗", type: "error" });
    } finally {
      setAvatarUploading(false);
    }
  }, [updateUser]);

  // Auth guard 已由 App.tsx RequireAuth 統一處理

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
      <SEOHead title="會員中心 | 阿倫教官" noIndex={true} />
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
                  {/* 頭像區域 — 點擊開啟 AvatarPicker */}
                  <div className="relative group flex-shrink-0">
                    {/* 頭像圓形 */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-luxe-gold/40 avatar-glow">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-luxe-gold/20 flex items-center justify-center">
                          <span className="text-luxe-gold text-xl sm:text-2xl font-semibold">
                            {user?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hover 遮罩 — 更換頭貼 */}
                    <div
                      onClick={() =>
                        !avatarUploading && setShowAvatarPicker(true)
                      }
                      className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      {avatarUploading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white mb-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                            />
                          </svg>
                          <span className="text-[9px] sm:text-[10px] text-white/90">
                            更換頭貼
                          </span>
                        </>
                      )}
                    </div>

                    {/* 有頭像時顯示刪除按鈕 */}
                    {user?.avatar_url && !avatarUploading && (
                      <button
                        onClick={handleAvatarDelete}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px]"
                        title="移除頭像"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-base sm:text-lg text-luxe-text truncate">
                      {user?.display_name || user?.name || "會員"}
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

      {/* AvatarPicker Modal */}
      <Modal
        isOpen={showAvatarPicker}
        onClose={() => !avatarUploading && setShowAvatarPicker(false)}
        title="選擇頭像"
        size="md"
        theme="luxe"
      >
        <AvatarPicker
          userName={user?.display_name || user?.name || ""}
          userEmail={user?.email}
          onSelect={handleAvatarSelect}
          onCancel={() => setShowAvatarPicker(false)}
          loading={avatarUploading}
        />
      </Modal>

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
