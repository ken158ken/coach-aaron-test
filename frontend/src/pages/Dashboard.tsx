/**
 * Dashboard 頁面 - 用戶儀表板
 * @module pages/Dashboard
 * @theme luxe (LUXE 高端主題)
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { StatCard, PillButton } from "@/components/ui";
import SEOHead from "@/components/seo/SEOHead";

/**
 * Dashboard - 用戶儀表板頁面
 *
 * @returns {JSX.Element} 儀表板頁面
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Auth guard 已由 App.tsx RequireAuth 統一處理

  const stats = [
    {
      value: "85%",
      label: t.dashboard.statWeeklyProgress,
      trend: { value: 5, direction: "up" as const },
    },
    {
      value: "12",
      label: t.dashboard.statCompletedLessons,
      trend: { value: 20, direction: "up" as const },
    },
    {
      value: "156",
      label: t.dashboard.statTotalMinutes,
      trend: { value: 15, direction: "up" as const },
    },
    {
      value: "7",
      label: t.dashboard.statStreakDays,
      trend: { value: 2, direction: "down" as const },
    },
  ];

  const recentCourses = [
    {
      id: "1",
      title: t.dashboard.demoCourse1,
      progress: 75,
      lastAccess: t.dashboard.today,
    },
    {
      id: "2",
      title: t.dashboard.demoCourse2,
      progress: 30,
      lastAccess: t.dashboard.yesterday,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent relative">
      <SEOHead title={t.dashboard.seoTitle} noIndex={true} />
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 relative z-10">
        <div className="studio-container">
          {/* Header */}
          <div data-tour="dash-header" className="text-center mb-8 sm:mb-12">
            <span className="inline-block text-[#d4d4d4] text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              Dashboard
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white/90 mb-3 sm:mb-4">
              {t.dashboard.welcome.replace(
                "{name}",
                user?.name || t.dashboard.guestName,
              )}
            </h1>
            <p className="text-sm sm:text-base text-white/50">
              {t.dashboard.subtitle}
            </p>
          </div>

          {/* Stats Grid */}
          <div
            data-tour="dash-stats"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
                trend={stat.trend}
                theme="studio"
              />
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Recent Courses */}
            <div
              data-tour="dash-recent"
              className="md:col-span-2 bg-surface rounded-lg border border-gold/10 p-6"
            >
              <h2 className="text-xl text-white/90 font-light mb-6">
                {t.dashboard.continueLearning}
              </h2>
              {recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="flex items-center gap-4 p-4 bg-transparent/50 rounded-lg hover:bg-transparent transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-[rgba(197,160,89,0.2)] flex items-center justify-center">
                        <span className="text-[#c5a059]">📚</span>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-white/90 font-medium">
                          {course.title}
                        </h3>
                        <p className="text-muted text-sm">
                          {t.dashboard.lastStudied.replace(
                            "{when}",
                            course.lastAccess,
                          )}
                        </p>
                        {/* Progress Bar */}
                        <div className="mt-2 h-1.5 bg-transparent rounded-full overflow-hidden">
                          <div
                            className="h-full bg-luxe-gold rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[#c5a059] font-medium">
                        {course.progress}%
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted mb-4">{t.dashboard.noCoursesStarted}</p>
                  <Link to="/courses">
                    <PillButton theme="studio" variant="default">
                      {t.member.browseCourses}
                    </PillButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div
              data-tour="dash-actions"
              className="bg-surface rounded-lg border border-gold/10 p-6"
            >
              <h2 className="text-xl text-white/90 font-light mb-6">
                {t.dashboard.quickActions}
              </h2>
              <div className="space-y-3">
                <Link
                  data-tour="dash-action-courses"
                  to="/courses"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-transparent transition-colors"
                >
                  <span className="text-lg">📚</span>
                  <span className="text-white/90">{t.member.browseCourses}</span>
                </Link>
                <Link
                  to="/videos"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-transparent transition-colors"
                >
                  <span className="text-lg">🎬</span>
                  <span className="text-white/90">{t.dashboard.actionWatchVideos}</span>
                </Link>
                <Link
                  data-tour="dash-action-member"
                  to="/member"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-transparent transition-colors"
                >
                  <span className="text-lg">👤</span>
                  <span className="text-white/90">{t.nav.memberCenter}</span>
                </Link>
                <Link
                  data-tour="dash-action-contact"
                  to="/contact"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-transparent transition-colors"
                >
                  <span className="text-lg">✉️</span>
                  <span className="text-white/90">{t.dashboard.actionContactCoach}</span>
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
