/**
 * CourseDetail 頁面 - 課程詳細內容
 * @module pages/CourseDetail
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTheme, useAuth } from "@/context";
import { courseService } from "@/services";
import { PillButton, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { PrismScene } from "@/components/three";
import type { Course, CourseReview } from "@/types";

/**
 * CourseDetail - 課程詳細頁面
 *
 * @returns {JSX.Element} 課程詳細頁面
 */
const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setTheme("prism");
  }, [setTheme]);

  const fetchCourse = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");
      const data = await courseService.getById(Number(id));

      if (data) {
        setCourse(data);
        // 嘗試載入評論
        try {
          const reviewsData = await courseService.getReviews(Number(id));
          setReviews(reviewsData || []);
        } catch {
          // 評論載入失敗不影響主要內容
          setReviews([]);
        }
      } else {
        setError("找不到課程");
      }
    } catch (err) {
      console.error("Failed to fetch course:", err);
      setError("載入課程失敗");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const formatPrice = (price?: number) => {
    if (!price) return "免費";
    return `NT$ ${price.toLocaleString()}`;
  };

  const levelLabels: Record<string, string> = {
    beginner: "初學者",
    intermediate: "進階",
    advanced: "專家",
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <Loading text="載入中..." />;
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-prism-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-prism-text/70 mb-4">{error || "找不到課程"}</p>
          <Link to="/courses" className="text-prism-accent hover:underline">
            返回課程列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-prism-bg relative">
      {/* Three.js Background */}
      <PrismScene />

      {/* SEO Meta 標籤 */}
      <SEOHead
        title={course.title}
        description={course.description || course.title}
        keywords={course.keywords || ["健身", "課程", "訓練"]}
        image={course.thumbnail}
        url={`/courses/${course.id}`}
        type="product"
      />

      {/* Course Header */}
      <div className="relative overflow-hidden z-10">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-prism-bg via-purple-900/20 to-prism-bg" />

        <div className="relative container mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/courses"
              className="text-prism-text/50 hover:text-prism-accent transition-colors text-sm"
            >
              ← 返回課程列表
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Course Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-prism-accent/10">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl text-prism-accent/30">📚</span>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="flex flex-col justify-center">
              {/* Level Badge */}
              {course.level && (
                <span className="inline-block w-fit px-3 py-1 bg-prism-accent/20 text-prism-accent text-sm rounded-full mb-4">
                  {levelLabels[course.level] || course.level}
                </span>
              )}

              {/* Title */}
              <h1 className="text-4xl font-light text-prism-text mb-4">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-prism-text/70 mb-6 leading-relaxed">
                {course.description}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 mb-8 text-sm text-prism-text/50">
                {course.lessonsCount && (
                  <span>📖 {course.lessonsCount} 堂課</span>
                )}
                {course.duration && <span>⏱️ {course.duration}</span>}
                {course.ratingAverage !== undefined &&
                  course.ratingCount !== undefined &&
                  course.ratingCount > 0 && (
                    <span>
                      ⭐ {course.ratingAverage.toFixed(1)} ({course.ratingCount}{" "}
                      則評價)
                    </span>
                  )}
                {course.totalEnrolled !== undefined && (
                  <span>👥 {course.totalEnrolled} 位學員</span>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center gap-6">
                <span className="text-3xl font-light text-prism-accent">
                  {formatPrice(course.price)}
                </span>
                {isAuthenticated ? (
                  <PillButton theme="prism" variant="filled" size="lg">
                    立即購買
                  </PillButton>
                ) : (
                  <Link to="/login">
                    <PillButton theme="prism" variant="outline" size="lg">
                      登入後購買
                    </PillButton>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Course Description */}
          {course.content && (
            <section className="mb-12">
              <h2 className="text-2xl font-light text-prism-text mb-6">
                課程介紹
              </h2>
              <div
                className="prose prose-invert prose-lg max-w-none text-prism-text/80"
                dangerouslySetInnerHTML={{ __html: course.content }}
              />
            </section>
          )}

          {/* What You'll Learn */}
          <section className="mb-12">
            <h2 className="text-2xl font-light text-prism-text mb-6">
              你將學到
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "建立正確的訓練觀念",
                "學習安全有效的動作技巧",
                "了解肌肉生長原理",
                "制定個人化訓練計畫",
                "掌握營養補充要點",
                "避免常見訓練錯誤",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-prism-accent/5 rounded-lg"
                >
                  <span className="text-prism-accent">✓</span>
                  <span className="text-prism-text/80">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-light text-prism-text mb-6">
              學員評價 ({reviews.length})
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.review_id}
                    className="bg-prism-accent/5 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-prism-accent/20 flex items-center justify-center">
                          {review.users?.avatar_url ? (
                            <img
                              src={review.users.avatar_url}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-prism-accent">
                              {review.users?.display_name?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <span className="text-prism-text">
                          {review.users?.display_name || "匿名用戶"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={
                              star <= review.rating
                                ? "text-yellow-500"
                                : "text-prism-text/20"
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-prism-text/70">{review.comment}</p>
                    <span className="text-prism-text/40 text-sm mt-2 block">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-prism-text/50 text-center py-8">
                尚無評價，成為第一位評價的人吧！
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
