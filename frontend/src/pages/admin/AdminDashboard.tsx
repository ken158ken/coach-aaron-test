/**
 * 後台總覽頁面
 * @description 顯示系統統計資料、快捷操作和系統資訊
 * @module pages/admin/AdminDashboard
 */

import { useState, useEffect } from "react";
import { FaUsers, FaBook, FaShoppingCart, FaDollarSign } from "react-icons/fa";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/ui";
import { StatCard, LoadingSpinner } from "@/components/ui";
import type { AdminStats } from "@/types";

/**
 * AdminDashboard 元件
 *
 * @returns {JSX.Element} 後台總覽頁面
 *
 * @example
 * ```tsx
 * <AdminDashboard />
 * ```
 */
const AdminDashboard = (): JSX.Element => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * 取得統計資料
   *
   * @returns {Promise<void>}
   */
  const fetchStats = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<AdminStats>("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("載入統計資料失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="載入中..." />;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">後台總覽</h1>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="會員總數"
          value={stats?.userCount || 0}
          icon={<FaUsers />}
        />
        <StatCard
          title="課程數量"
          value={stats?.courseCount || 0}
          icon={<FaBook />}
        />
        <StatCard
          title="訂單數量"
          value={stats?.orderCount || 0}
          icon={<FaShoppingCart />}
        />
        <StatCard
          title="本月營收"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          icon={<FaDollarSign />}
        />
      </div>

      {/* 快捷操作 */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a href="/admin/users" className="btn btn-outline btn-sm">
              管理會員
            </a>
            <a href="/admin/courses" className="btn btn-outline btn-sm">
              新增課程
            </a>
            <a href="/admin/videos" className="btn btn-outline btn-sm">
              新增影片
            </a>
            <a href="/admin/whitelist" className="btn btn-outline btn-sm">
              白名單設定
            </a>
          </div>
        </div>
      </div>

      {/* 最近活動 */}
      <div className="mt-6 card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">系統資訊</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-base-content/60">資料庫：</span>Supabase
              PostgreSQL
            </p>
            <p>
              <span className="text-base-content/60">前端：</span>React + Vite +
              TailwindCSS + DaisyUI
            </p>
            <p>
              <span className="text-base-content/60">後端：</span>Express.js
            </p>
            <p>
              <span className="text-base-content/60">部署：</span>Vercel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
