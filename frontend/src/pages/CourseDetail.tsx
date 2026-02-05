/**
 * CourseDetail 頁面 - 課程詳細內容
 * @module pages/CourseDetail
 * @theme prism (VOID PRISM 水晶主題)
 * @security 實施前端輸入消毒與驗證
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTheme, useAuth } from "@/context";
import {
  useUser,
  useSafeInput,
  useRatingInput,
  renderSafeContent,
} from "@/hooks";
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
  const { user, isAuthenticated } = useAuth();
  const { hasPurchasedCourse, loadingPurchases } = useUser();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 使用安全輸入 Hook 處理評論
  const {
    value: reviewComment,
    setValue: setReviewComment,
    handleChange: handleCommentChange,
    validation: commentValidation,
    getSanitizedValue: getSanitizedComment,
    reset: resetComment,
  } = useSafeInput("", {
    maxLength: 2000,
    allowNewlines: true,
    strictMode: true,
  });

  // 使用安全評分 Hook
  const {
    rating: userRating,
    setRating: setUserRating,
    hoverRating,
    setHoverRating,
    isValid: isRatingValid,
    reset: resetRating,
  } = useRatingInput(0);

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

          // 檢查用戶是否已評論過
          if (user && reviewsData) {
            const existingReview = reviewsData.find(
              (r: CourseReview) => r.user_id === user.user_id,
            );
            if (existingReview) {
              setUserRating(existingReview.rating);
              // 安全設定現有評論內容
              setReviewComment(existingReview.comment || "");
            } else {
              // 重置評論狀態
              resetRating();
              resetComment();
            }
          }
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
  }, [id, user]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  /**
   * 提交評分與評論
   * @security 使用消毒後的內容提交
   */
  const handleSubmitReview = async () => {
    if (!isAuthenticated || !course || !isRatingValid) return;

    // 前端驗證
    if (!commentValidation.isValid && reviewComment.trim()) {
      console.warn("Review validation failed:", commentValidation.errorMessage);
      return;
    }

    try {
      setSubmitting(true);
      // 使用消毒後的內容
      const sanitizedComment = getSanitizedComment();
      await courseService.addReview(
        course.course_id!,
        userRating,
        sanitizedComment || undefined,
      );
      // 重新載入課程和評論
      await fetchCourse();
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

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

  // 檢查用戶是否已評論過
  const hasReviewed = user && reviews.some((r) => r.user_id === user.user_id);

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

            {/* 評分表單 - 根據購買狀態顯示不同 UI */}
            <div className="bg-prism-accent/10 rounded-xl p-6 mb-8">
              {loadingPurchases ? (
                <div className="text-center py-4">
                  <span className="text-prism-text/60">載入中...</span>
                </div>
              ) : !isAuthenticated ? (
                // 未登入
                <div className="text-center py-4">
                  <p className="text-prism-text/60 mb-4">
                    登入後購買此課程即可留下評價
                  </p>
                  <Link
                    to="/login"
                    className="inline-block px-6 py-2 bg-prism-accent text-prism-bg rounded-full hover:bg-prism-accent/80 transition-colors"
                  >
                    登入
                  </Link>
                </div>
              ) : !hasPurchasedCourse(course.course_id!) ? (
                // 已登入但未購買（管理員也需要購買才能評論）
                <div className="text-center py-4">
                  <p className="text-prism-text/60 mb-4">
                    購買此課程後即可留下評價
                  </p>
                  <button
                    onClick={() =>
                      navigate(`/checkout?course=${course.course_id}`)
                    }
                    className="px-6 py-2 bg-prism-accent text-prism-bg rounded-full hover:bg-prism-accent/80 transition-colors"
                  >
                    立即購買
                  </button>
                </div>
              ) : (
                // 已購買或管理員
                <div>
                  <h3 className="text-lg font-medium text-prism-text mb-4">
                    {hasReviewed ? "更新你的評價" : "為此課程評分"}
                  </h3>
                  <div className="space-y-4">
                    {/* 星星評分 */}
                    <div className="flex items-center gap-2">
                      <span className="text-prism-text/70 text-sm mr-2">
                        評分：
                      </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`text-3xl transition-colors ${
                            star <= (hoverRating || userRating)
                              ? "text-yellow-500"
                              : "text-prism-text/20 hover:text-yellow-500/50"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      {userRating > 0 && (
                        <span className="ml-2 text-prism-text/70 text-sm">
                          {userRating} / 5
                        </span>
                      )}
                    </div>

                    {/* 評論輸入 - 使用安全輸入 Hook */}
                    <div className="space-y-2">
                      <textarea
                        value={reviewComment}
                        onChange={handleCommentChange}
                        placeholder="分享你對這門課程的看法（可選）..."
                        className={`w-full bg-prism-bg border rounded-lg px-4 py-3 text-prism-text focus:outline-none resize-none transition-colors ${
                          !commentValidation.isValid && reviewComment
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-prism-accent/20 focus:border-prism-accent/50"
                        }`}
                        rows={3}
                        maxLength={2000}
                      />
                      <div className="flex justify-between items-center text-xs">
                        <span
                          className={`${
                            !commentValidation.isValid && reviewComment
                              ? "text-red-400"
                              : "text-prism-text/40"
                          }`}
                        >
                          {!commentValidation.isValid && reviewComment
                            ? commentValidation.errorMessage
                            : ""}
                        </span>
                        <span
                          className={`${
                            commentValidation.remainingChars < 100
                              ? "text-yellow-500"
                              : "text-prism-text/40"
                          }`}
                        >
                          {commentValidation.charCount} / 2000
                        </span>
                      </div>
                    </div>

                    {/* 提交按鈕 */}
                    <button
                      onClick={handleSubmitReview}
                      disabled={
                        submitting ||
                        !isRatingValid ||
                        (!commentValidation.isValid &&
                          reviewComment.trim() !== "")
                      }
                      className="px-6 py-2 bg-prism-accent text-prism-bg rounded-full hover:bg-prism-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting
                        ? "送出中..."
                        : hasReviewed
                          ? "更新評價"
                          : "送出評價"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 評論列表 */}
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
                    {review.comment && (
                      <p className="text-prism-text/70">
                        {renderSafeContent(review.comment)}
                      </p>
                    )}
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
