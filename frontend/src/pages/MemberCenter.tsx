/**
 * MemberCenter 頁面 - 會員中心
 * @module pages/MemberCenter
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context";
import { StatCard, PillButton, Input, Toast, Modal } from "@/components/ui";
import { AvatarPicker } from "@/components/ui/avatar";
import SEOHead from "@/components/seo/SEOHead";
import { userService } from "@/services";
import { put, getAuthToken } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

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
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "profile" | "courses" | "settings" | "export"
  >("profile");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // 匯出 state
  const [exportConvs, setExportConvs] = useState<
    { id: string; name: string; type: string; message_count: number }[]
  >([]);
  const [exportConvsLoading, setExportConvsLoading] = useState(false);
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"md" | "txt" | "xlsx" | "docx">("txt");

  // 初始化表單值
  useEffect(() => {
    if (user) {
      setProfileDisplayName(user.display_name || user.name || "");
    }
  }, [user]);

  /** 前端危險字元過濾模式 */
  const DANGEROUS_INPUT_PATTERN =
    /<script|<iframe|javascript:|on\w+=|<\/?\w+[^>]*>|\{\{|\$\{|union\s+select/i;

  /** 顯示名稱合法字元（中英數字 + 空格 + 常見標點 + emoji） */
  const DISPLAY_NAME_PATTERN =
    /^[\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}\s._\-]+$/u;

  /**
   * 前端輸入消毒：移除危險字元
   */
  const sanitizeInput = useCallback((value: string): string => {
    return value
      .replace(/<[^>]*>/g, "") // 移除 HTML 標籤
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // 控制字元
      .trim();
  }, []);

  /**
   * 更新個人資料表單提交
   */
  const handleProfileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const cleanName = sanitizeInput(profileDisplayName);

      // 前端驗證
      if (!cleanName || cleanName.length < 1) {
        setToast({ message: t.member.displayNameEmpty, type: "error" });
        return;
      }
      if (cleanName.length > 30) {
        setToast({ message: t.member.displayNameTooLong, type: "error" });
        return;
      }
      if (DANGEROUS_INPUT_PATTERN.test(cleanName)) {
        setToast({ message: t.member.displayNameInvalid, type: "error" });
        logger.error("前端偵測到危險輸入", cleanName.substring(0, 50));
        return;
      }
      if (!DISPLAY_NAME_PATTERN.test(cleanName)) {
        setToast({
          message: t.member.displayNameCharset,
          type: "error",
        });
        return;
      }

      setProfileSaving(true);
      try {
        logger.info("更新個人資料...");
        const result = await put<{
          success: boolean;
          data: { display_name: string };
        }>("/api/user/profile", { displayName: cleanName });

        if (result.success) {
          updateUser({ display_name: result.data.display_name });
          setToast({ message: t.member.profileUpdateSuccess, type: "success" });
          logger.info("個人資料更新成功");
        }
      } catch (err: unknown) {
        // 從 AxiosError 中提取後端返回的錯誤訊息
        const axiosErr = err as {
          response?: {
            data?: {
              error?: string;
              detail?: string;
              code?: string;
              hint?: string;
            };
          };
        };
        const respData = axiosErr?.response?.data;
        const detail = respData?.detail;
        const serverMsg = respData?.error;
        // 完整日誌（含 Supabase 錯誤碼、hint）以便追蹤
        logger.error("更新個人資料失敗", {
          error: serverMsg,
          detail,
          code: respData?.code,
          hint: respData?.hint,
        });
        const errorMsg =
          serverMsg ||
          (err instanceof Error ? err.message : t.common.error);
        setToast({ message: errorMsg, type: "error" });
      } finally {
        setProfileSaving(false);
      }
    },
    [profileDisplayName, sanitizeInput, updateUser, t],
  );

  /** 顯示名稱是否已修改 */
  const profileChanged = useMemo(() => {
    const original = user?.display_name || user?.name || "";
    return profileDisplayName !== original;
  }, [profileDisplayName, user]);

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
          setToast({ message: t.member.avatarUpdateSuccess, type: "success" });
          setShowAvatarPicker(false);
          logger.info("頭像更新成功");
        }
      } catch (err) {
        logger.error("頭像上傳失敗", err);
        setToast({ message: t.member.avatarUpdateFailed, type: "error" });
      } finally {
        setAvatarUploading(false);
      }
    },
    [updateUser, t],
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
        setToast({ message: t.member.avatarRemoved, type: "success" });
      }
    } catch (err) {
      logger.error("刪除頭像失敗", err);
      setToast({ message: t.member.avatarDeleteFailed, type: "error" });
    } finally {
      setAvatarUploading(false);
    }
  }, [updateUser, t]);

  // 載入對話列表（切到匯出 tab 時）
  useEffect(() => {
    if (activeTab !== "export") return;
    setExportConvsLoading(true);
    const token = getAuthToken();
    fetch("/api/export/my-chats", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => setExportConvs(data.conversations || []))
      .catch(() => setExportConvs([]))
      .finally(() => setExportConvsLoading(false));
  }, [activeTab]);

  // 下載對話匯出
  const handleExportChat = useCallback(async (convId: string) => {
    const token = getAuthToken();
    if (!token) return;
    setExportLoadingId(convId);
    try {
      const res = await fetch(`/api/export/chat/${convId}?format=${exportFormat}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t.memberCenter.downloadFailed);
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*=UTF-8''(.+)/i);
      const filename = match
        ? decodeURIComponent(match[1])
        : `${t.memberCenter.chatFilePrefix}_${convId}.${exportFormat}`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: t.exportFeature.exportSuccess, type: "success" });
    } catch {
      setToast({ message: t.exportFeature.exportFailed, type: "error" });
    } finally {
      setExportLoadingId(null);
    }
  }, [exportFormat, t]);

  // Auth guard 已由 App.tsx RequireAuth 統一處理

  const tabs = [
    { key: "profile" as const, label: t.member.personalInfo },
    { key: "courses" as const, label: t.member.myCourses },
    { key: "settings" as const, label: t.member.accountSettings },
    { key: "export" as const, label: t.exportFeature.exportData },
  ];

  const stats = [
    { value: "3", label: t.member.purchasedCourses },
    { value: "12", label: t.member.completedLessons },
    { value: "28", label: t.member.studyDays },
  ];

  return (
    <div className="min-h-screen bg-transparent relative">
      <SEOHead title={t.memberCenter.seoTitle} noIndex={true} />
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 relative z-10">
        <div className="studio-container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-8 sm:mb-12">
            <div>
              <span className="inline-block text-[#d4d4d4] text-xs sm:text-sm uppercase tracking-widest mb-2">
                Member Center
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold text-white/90 mb-1 sm:mb-2">
                {t.member.heading}
              </h1>
              <p
                className="text-sm sm:text-base text-white/50 truncate max-w-[250px] sm:max-w-none"
                suppressHydrationWarning
              >
                {t.memberCenter.welcomeLine.replace(
                  "{name}",
                  user?.display_name || user?.name || user?.email || "",
                )}
              </p>
            </div>
            <button
              data-tour="member-logout"
              onClick={logout}
              className="self-start sm:self-auto text-[#888] hover:text-[#c5a059] transition-colors text-xs sm:text-sm"
            >
              {t.nav.logout}
            </button>
          </div>

          {/* Stats */}
          <div
            data-tour="member-stats"
            className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8"
          >
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
                theme="studio"
              />
            ))}
          </div>

          {/* Tabs */}
          <div
            data-tour="member-tabs"
            className="flex gap-0.5 sm:gap-1 mb-6 sm:mb-8 border-b border-[#c5a059]/10 overflow-x-auto"
          >
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
                      ? "text-[#c5a059] border-b-2 border-[#c5a059]"
                      : "text-[#888] hover:text-white/90"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div
            data-tour="member-panel"
            className="bg-[#141414] rounded-lg border border-[#c5a059]/10 p-4 sm:p-6"
          >
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl text-white/90 font-light mb-4 sm:mb-6">
                  {t.member.personalInfo}
                </h2>
                <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                  {/* 頭像區域 — 點擊開啟 AvatarPicker */}
                  <div
                    data-tour="member-avatar"
                    className="relative group flex-shrink-0"
                  >
                    {/* 頭像圓形 */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#c5a059]/40 avatar-glow">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[rgba(197,160,89,0.2)] flex items-center justify-center">
                          <span className="text-[#c5a059] text-xl sm:text-2xl font-semibold">
                            {user?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hover 遮罩 — 更換頭貼 */}
                    <div
                      data-tour="member-avatar-edit"
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
                            {t.member.changeAvatar}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 有頭像時顯示刪除按鈕 */}
                    {user?.avatar_url && !avatarUploading && (
                      <button
                        onClick={handleAvatarDelete}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px]"
                        title={t.member.removeAvatar}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-base sm:text-lg text-white/90 truncate">
                      {user?.display_name || user?.name || t.member.member}
                    </p>
                    <p className="text-xs sm:text-sm text-[#888] truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <form
                  className="space-y-3 sm:space-y-4 max-w-md"
                  onSubmit={handleProfileSubmit}
                >
                  <Input
                    data-tour="member-display-name"
                    label={t.member.displayName}
                    value={profileDisplayName}
                    onChange={(e) =>
                      setProfileDisplayName(e.target.value.slice(0, 30))
                    }
                    placeholder={t.member.displayName}
                    theme="studio"
                    maxLength={30}
                    autoComplete="name"
                    spellCheck={false}
                  />
                  <p className="text-[10px] text-[#888] -mt-2">
                    {profileDisplayName.length}/30
                  </p>
                  <Input
                    label={t.login.email}
                    value={user?.email || ""}
                    theme="studio"
                    disabled
                    readOnly
                    tabIndex={-1}
                  />
                  <PillButton
                    data-tour="member-profile-save"
                    theme="studio"
                    variant="default"
                    type="submit"
                    disabled={profileSaving || !profileChanged}
                  >
                    {profileSaving ? t.member.updating : t.member.updateProfile}
                  </PillButton>
                </form>
              </div>
            )}

            {activeTab === "courses" && (
              <div>
                <h2 className="text-lg sm:text-xl text-white/90 font-light mb-4 sm:mb-6">
                  {t.member.myCourses}
                </h2>
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-[#888] mb-3 sm:mb-4">
                    {t.member.noCourses}
                  </p>
                  <Link to="/courses">
                    <PillButton theme="studio" variant="default">
                      {t.member.browseCourses}
                    </PillButton>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl text-white/90 font-light mb-4 sm:mb-6">
                  {t.member.accountSettings}
                </h2>
                <form className="space-y-3 sm:space-y-4 max-w-md">
                  <Input
                    type="password"
                    label={t.member.currentPassword}
                    placeholder={t.member.currentPassword}
                    theme="studio"
                  />
                  <Input
                    type="password"
                    label={t.member.newPassword}
                    placeholder={t.member.newPassword}
                    theme="studio"
                  />
                  <Input
                    type="password"
                    label={t.member.confirmPassword}
                    placeholder={t.member.confirmPassword}
                    theme="studio"
                  />
                  <PillButton theme="studio" variant="default">
                    {t.member.changePassword}
                  </PillButton>
                </form>
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-5">
                <h2 className="text-lg sm:text-xl text-white/90 font-light">
                  {t.exportFeature.exportMyChats}
                </h2>

                {/* 格式選擇 */}
                <div>
                  <p className="text-xs text-[#888] mb-2">{t.exportFeature.exportFormat}</p>
                  <div className="flex flex-wrap gap-2">
                    {(["txt", "md", "xlsx", "docx"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          exportFormat === fmt
                            ? "bg-[#c5a059]/20 border-[#c5a059] text-[#c5a059]"
                            : "border-[#c5a059]/20 text-[#888] hover:border-[#c5a059]/40 hover:text-white/80"
                        }`}
                      >
                        {fmt === "txt" && t.exportFeature.formatTxt}
                        {fmt === "md" && t.exportFeature.formatMd}
                        {fmt === "xlsx" && t.exportFeature.formatXlsx}
                        {fmt === "docx" && t.exportFeature.formatDocx}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 對話清單 */}
                {exportConvsLoading ? (
                  <div className="text-center py-8 text-[#888] text-sm">
                    {t.common.loading}
                  </div>
                ) : exportConvs.length === 0 ? (
                  <div className="text-center py-8 text-[#888] text-sm">
                    {t.exportFeature.noConversations}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exportConvs.map((conv) => {
                      const isLoading = exportLoadingId === conv.id;
                      return (
                        <div
                          key={conv.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-[#1a1a1a] border border-[#c5a059]/10 rounded-lg hover:border-[#c5a059]/20 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-base shrink-0">
                              {conv.type === "group" ? "👥" : "💬"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm text-white/80 truncate">{conv.name}</p>
                              <p className="text-xs text-[#888]">
                                {conv.message_count} {t.exportFeature.messageCount}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleExportChat(conv.id)}
                            disabled={exportLoadingId !== null}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                              isLoading
                                ? "border-[#c5a059]/30 text-[#c5a059]"
                                : "border-[#c5a059]/20 text-[#888] hover:border-[#c5a059] hover:text-[#c5a059] disabled:opacity-40 disabled:cursor-not-allowed"
                            }`}
                          >
                            {isLoading ? (
                              <>
                                <span className="w-3 h-3 border border-t-transparent border-[#c5a059] rounded-full animate-spin" />
                                {t.exportFeature.exporting}
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {t.exportFeature.exportData}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AvatarPicker Modal */}
      <Modal
        isOpen={showAvatarPicker}
        onClose={() => !avatarUploading && setShowAvatarPicker(false)}
        title={t.member.selectAvatar}
        size="md"
        theme="studio"
        tourId="member-avatar-picker"
      >
        <AvatarPicker
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
