/**
 * 會員中心頁面元件
 *
 * 顯示會員個人資訊、快捷功能和管理員入口。
 * 包含身份驗證檢查和載入狀態處理。
 *
 * @module pages/MemberCenter
 */

import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaShoppingBag,
  FaBook,
  FaShieldAlt,
} from "react-icons/fa";

import { useAuth } from "@/context/AuthContext";

/**
 * 格式化日期字串
 *
 * @param {string | undefined} dateString - ISO 日期字串
 * @returns {string} 格式化後的日期
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "未知";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "未知";
  }
};

/**
 * 擴展 User 介面以支援額外屬性
 */
interface ExtendedUser {
  user_id: number;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  displayName?: string;
  username?: string;
  phoneNumber?: string;
  createdAt?: string;
  isAdmin?: boolean;
  sex?: string;
}

/**
 * 會員中心頁面元件
 *
 * 展示會員資訊、快捷功能連結和管理員專屬入口。
 *
 * @returns {JSX.Element | null} 會員中心頁面元件
 */
const MemberCenter: React.FC = (): JSX.Element | null => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * 檢查使用者登入狀態,未登入則導向登入頁
   */
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) return null;

  const extendedUser = user as ExtendedUser;

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 使用者資訊卡片 */}
        <div className="card bg-base-100 shadow-md border border-base-300 mb-6">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-20">
                  <span className="text-3xl">
                    {(extendedUser.displayName ||
                      extendedUser.name ||
                      extendedUser.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">
                  {extendedUser.displayName ||
                    extendedUser.username ||
                    extendedUser.name}
                </h1>
                <p className="text-base-content/60">{extendedUser.email}</p>
                {(extendedUser.phoneNumber || extendedUser.phone_number) && (
                  <p className="text-sm text-base-content/50">
                    {extendedUser.phoneNumber || extendedUser.phone_number}
                  </p>
                )}
                <p className="text-sm text-base-content/50 mt-1">
                  加入時間:
                  {formatDate(
                    extendedUser.createdAt || extendedUser.created_at
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {extendedUser.isAdmin && (
                  <span className="badge badge-primary gap-1">
                    <FaShieldAlt /> 管理員
                  </span>
                )}
                {extendedUser.sex && (
                  <span className="badge badge-secondary">私密相簿權限</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 快捷功能 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link
            to="/courses"
            className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow"
          >
            <div className="card-body items-center text-center">
              <FaBook className="text-4xl text-primary mb-2" />
              <h3 className="font-semibold">瀏覽課程</h3>
              <p className="text-sm text-base-content/60">探索所有線上課程</p>
            </div>
          </Link>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body items-center text-center">
              <FaShoppingBag className="text-4xl text-secondary mb-2" />
              <h3 className="font-semibold">我的訂單</h3>
              <p className="text-sm text-base-content/60">查看購買記錄</p>
              <span className="badge badge-ghost">即將推出</span>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body items-center text-center">
              <FaCog className="text-4xl text-accent mb-2" />
              <h3 className="font-semibold">帳號設定</h3>
              <p className="text-sm text-base-content/60">修改個人資料</p>
              <span className="badge badge-ghost">即將推出</span>
            </div>
          </div>
        </div>

        {/* 管理員入口 */}
        {extendedUser.isAdmin && (
          <div className="card bg-neutral text-neutral-content shadow-md mb-6">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-3xl" />
                  <div>
                    <h3 className="font-bold text-lg">管理員後台</h3>
                    <p className="text-sm opacity-80">管理會員、課程、影片等</p>
                  </div>
                </div>
                <Link to="/admin" className="btn btn-primary">
                  進入後台
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 私密相簿提示 */}
        {extendedUser.sex && (
          <div className="card bg-secondary text-secondary-content shadow-md mb-6">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">🔓 私密相簿已解鎖</h3>
                  <p className="text-sm opacity-80">
                    您已獲得「阿倫私密淫照」的檢視權限
                  </p>
                </div>
                <Link to="/photos" className="btn btn-outline btn-sm">
                  前往相簿
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 登出 */}
        <div className="text-center">
          <button onClick={logout} className="btn btn-outline btn-error">
            登出
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberCenter;
