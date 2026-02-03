/**
 * Dashboard 頁面 - 用戶儀表板
 * @module pages/Dashboard
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth, useTheme } from "@/context";
import { StatCard, PillButton } from "@/components/ui";
import { PrismScene } from "@/components/three";

/**
 * Dashboard - 用戶儀表板頁面
 *
 * @returns {JSX.Element} 儀表板頁面
 */
const Dashboard: React.FC = () => {
  const { setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const stats = [
    {
      value: "85%",
      label: "本週進度",
      trend: { value: 5, direction: "up" as const },
    },
    {
      value: "12",
      label: "完成課堂",
      trend: { value: 20, direction: "up" as const },
    },
    {
      value: "156",
      label: "累計分鐘",
      trend: { value: 15, direction: "up" as const },
    },
    {
      value: "7",
      label: "連續天數",
      trend: { value: 2, direction: "down" as const },
    },
  ];

  const recentCourses = [
    { id: "1", title: "初學者健身入門", progress: 75, lastAccess: "今天" },
    { id: "2", title: "增肌實戰計畫", progress: 30, lastAccess: "昨天" },
  ];

  return (
    <div className="min-h-screen bg-luxe-bg relative">
      {/* Three.js Background */}
      <PrismScene />

      <div className="pt-24 pb-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-luxe-text mb-2">
              歡迎回來，{user?.name || "學員"}
            </h1>
            <p className="text-luxe-muted">繼續您的健身之旅</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
                trend={stat.trend}
                theme="luxe"
              />
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Recent Courses */}
            <div className="md:col-span-2 bg-luxe-surface rounded-lg border border-luxe-gold/10 p-6">
              <h2 className="text-xl text-luxe-text font-light mb-6">
                繼續學習
              </h2>
              {recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="flex items-center gap-4 p-4 bg-luxe-bg/50 rounded-lg hover:bg-luxe-bg transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-luxe-gold/20 flex items-center justify-center">
                        <span className="text-luxe-gold">📚</span>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-luxe-text font-medium">
                          {course.title}
                        </h3>
                        <p className="text-luxe-muted text-sm">
                          {course.lastAccess}學習
                        </p>
                        {/* Progress Bar */}
                        <div className="mt-2 h-1.5 bg-luxe-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-luxe-gold rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-luxe-gold font-medium">
                        {course.progress}%
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-luxe-muted mb-4">尚未開始任何課程</p>
                  <Link to="/courses">
                    <PillButton theme="luxe" variant="outline">
                      瀏覽課程
                    </PillButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-6">
              <h2 className="text-xl text-luxe-text font-light mb-6">
                快速操作
              </h2>
              <div className="space-y-3">
                <Link
                  to="/courses"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-luxe-bg transition-colors"
                >
                  <span className="text-lg">📚</span>
                  <span className="text-luxe-text">瀏覽課程</span>
                </Link>
                <Link
                  to="/videos"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-luxe-bg transition-colors"
                >
                  <span className="text-lg">🎬</span>
                  <span className="text-luxe-text">觀看影片</span>
                </Link>
                <Link
                  to="/member"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-luxe-bg transition-colors"
                >
                  <span className="text-lg">👤</span>
                  <span className="text-luxe-text">會員中心</span>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-luxe-bg transition-colors"
                >
                  <span className="text-lg">✉️</span>
                  <span className="text-luxe-text">聯絡教練</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
