/**
 * CourseDetail 頁面 - 課程詳細內容
 * @module pages/CourseDetail
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import {
  useUser,
  useSafeInput,
  useRatingInput,
  renderSafeContent,
} from "@/hooks";
import { courseService } from "@/services";
import { Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import type { Course, CourseReview } from "@/types";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { hasPurchasedCourse, loadingPurchases } = useUser();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    value: reviewComment,
    setValue: setReviewComment,
    handleChange: handleCommentChange,
    validation: commentValidation,
    getSanitizedValue: getSanitizedComment,
    reset: resetComment,
  } = useSafeInput("", { maxLength: 2000, allowNewlines: true, strictMode: true });

  const {
    rating: userRating,
    setRating: setUserRating,
    hoverRating,
    setHoverRating,
    isValid: isRatingValid,
    reset: resetRating,
  } = useRatingInput(0);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const data = await courseService.getById(Number(id));
      if (data) {
        setCourse(data);
        try {
          const reviewsData = await courseService.getReviews(Number(id));
          setReviews(reviewsData || []);
          if (user && reviewsData) {
            const existingReview = reviewsData.find(
              (r: CourseReview) => r.user_id === user.user_id,
            );
            if (existingReview) {
              setUserRating(existingReview.rating);
              setReviewComment(existingReview.comment || "");
            } else {
              resetRating();
              resetComment();
            }
          }
        } catch {
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

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated || !course || !isRatingValid) return;
    if (!commentValidation.isValid && reviewComment.trim()) return;
    try {
      setSubmitting(true);
      const sanitizedComment = getSanitizedComment();
      await courseService.addReview(course.course_id!, userRating, sanitizedComment || undefined);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = () => {
    if (!course?.show_price) return "洽詢價格";
    if (!course?.price) return "免費";
    return `NT$ ${course.price.toLocaleString()}`;
  };

  const levelLabels: Record<string, string> = {
    beginner: "初學者",
    intermediate: "進階",
    advanced: "專家",
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  if (loading) return <Loading text="載入中..." />;

  if (error || !course) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">{error || "找不到課程"}</p>
          <Link to="/courses" className="text-[#d4d4d4] hover:underline">返回課程列表</Link>
        </div>
      </div>
    );
  }

  const hasReviewed = user && reviews.some((r) => r.user_id === user.user_id);

  return (
    <div className="min-h-screen bg-transparent relative">
      <SEOHead
        title={course.title}
        description={course.description || course.title}
        keywords={course.keywords || ["健身", "課程", "訓練"]}
        image={course.thumbnail}
        url={`/courses/${course.id}`}
        type="product"
      />

      {/* ── Full-width Banner ── */}
      <div
        className="relative w-full flex items-end pt-20"
        style={{
          height: "60vh",
          maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
        }}
      >
        {/* Background — 有圖用圖，沒圖用 banner-fallback 動態背景 */}
        <div
          className={`absolute inset-0 -z-10${!(course.course_banner_url || course.thumbnail) ? " banner-fallback" : ""}`}
          style={
            (course.course_banner_url || course.thumbnail)
              ? {
                  background: `linear-gradient(to bottom, rgba(10,10,10,0.3), rgba(10,10,10,0.88)), url(${course.course_banner_url || course.thumbnail}) center/cover no-repeat`,
                }
              : undefined
          }
        />

        {/* Banner Content */}
        <div className="w-full px-6 sm:px-12 pb-10 sm:pb-14 relative z-10">
          <div className="max-w-300 mx-auto">
            {/* Breadcrumb */}
            <Link
              to="/courses"
              className="inline-block text-white/40 hover:text-white/70 text-xs sm:text-sm tracking-widest uppercase mb-4 transition-colors"
            >
              ← Courses
            </Link>

            {/* Level Tag */}
            {course.level && (
              <div className="mb-3 sm:mb-4">
                <span className="inline-block px-3 py-1 border border-white/40 text-white text-xs tracking-[2px] uppercase">
                  {levelLabels[course.level] || course.level}
                </span>
              </div>
            )}

            {/* Title */}
            <h1
              className="silver-heading text-3xl sm:text-5xl md:text-6xl font-black tracking-[3px] sm:tracking-[5px] uppercase mb-4 sm:mb-5 leading-tight"
            >
              {course.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 sm:gap-6 text-white/60 text-sm sm:text-base">
              {course.lessonsCount && <span>📖 {course.lessonsCount} 堂課</span>}
              {course.duration && <span>⏱️ {course.duration}</span>}
              {course.ratingAverage !== undefined && course.ratingCount! > 0 && (
                <span>⭐ {course.ratingAverage.toFixed(1)} ({course.ratingCount} 則評價)</span>
              )}
              {course.totalEnrolled !== undefined && (
                <span>👥 {course.totalEnrolled} 位學員</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: 2fr / 1fr ── */}
      <div className="px-4 sm:px-6 lg:px-12 relative z-10 -mt-6 pb-20">
        <div className="max-w-300 mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12">

          {/* ── Left: Content ── */}
          <div className="space-y-10">

            {/* Description */}
            {course.description && (
              <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
                <h2 className="text-xl sm:text-2xl font-light text-white mb-4 pb-3 border-b border-white/10">課程簡介</h2>
                <p className="text-white/60 leading-relaxed text-sm sm:text-base">{course.description}</p>
              </section>
            )}

            {/* Full Content */}
            {course.content && (
              <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
                <h2 className="text-xl sm:text-2xl font-light text-white mb-4 pb-3 border-b border-white/10">課程介紹</h2>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: course.content }}
                />
              </section>
            )}

            {/* What You'll Learn */}
            <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-light text-white mb-6 pb-3 border-b border-white/10">你將學到</h2>
              <ul className="space-y-3">
                {[
                  "建立正確的訓練觀念",
                  "學習安全有效的動作技巧",
                  "了解肌肉生長原理",
                  "制定個人化訓練計畫",
                  "掌握營養補充要點",
                  "避免常見訓練錯誤",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-white/60 text-sm sm:text-base">
                    <span className="text-white/80 text-base">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Reviews */}
            <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-light text-white mb-6 pb-3 border-b border-white/10">
                學員評價 ({reviews.length})
              </h2>

              {/* Review Form */}
              <div className="bg-white/5 rounded-lg p-5 sm:p-6 mb-8">
                {loadingPurchases ? (
                  <p className="text-center text-white/50 py-4">載入中...</p>
                ) : !isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-white/50 mb-4">登入後購買此課程即可留下評價</p>
                    <Link to="/login" className="inline-block px-6 py-2 border border-white/30 text-white text-sm tracking-widest hover:border-white transition-colors">
                      登入
                    </Link>
                  </div>
                ) : !hasPurchasedCourse(course.course_id!) ? (
                  <div className="text-center py-4">
                    <p className="text-white/50 mb-4">購買此課程後即可留下評價</p>
                    <button
                      onClick={() => navigate(`/checkout?course=${course.course_id}`)}
                      className="px-6 py-2 border border-white/30 text-white text-sm tracking-widest hover:border-white transition-colors"
                    >
                      立即購買
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-medium text-white/90 mb-4">
                      {hasReviewed ? "更新你的評價" : "為此課程評分"}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm mr-1">評分：</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className={`text-2xl sm:text-3xl transition-colors ${
                              star <= (hoverRating || userRating) ? "text-yellow-400" : "text-white/20 hover:text-yellow-400/50"
                            }`}
                          >★</button>
                        ))}
                        {userRating > 0 && (
                          <span className="ml-2 text-white/50 text-sm">{userRating} / 5</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <textarea
                          value={reviewComment}
                          onChange={handleCommentChange}
                          placeholder="分享你對這門課程的看法（可選）..."
                          className={`w-full bg-transparent border rounded-lg px-4 py-3 text-white/80 text-sm focus:outline-none resize-none transition-colors ${
                            !commentValidation.isValid && reviewComment
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-white/10 focus:border-white/30"
                          }`}
                          rows={3}
                          maxLength={2000}
                        />
                        <div className="flex justify-between text-xs">
                          <span className={!commentValidation.isValid && reviewComment ? "text-red-400" : "text-transparent"}>
                            {commentValidation.errorMessage}
                          </span>
                          <span className={commentValidation.remainingChars < 100 ? "text-yellow-500" : "text-white/30"}>
                            {commentValidation.charCount} / 2000
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleSubmitReview}
                        disabled={submitting || !isRatingValid || (!commentValidation.isValid && reviewComment.trim() !== "")}
                        className="px-6 py-2 border border-white/30 text-white text-sm tracking-widest hover:border-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? "送出中..." : hasReviewed ? "更新評價" : "送出評價"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Review List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.review_id} className="bg-white/3 rounded-lg p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            {review.users?.avatar_url ? (
                              <img src={review.users.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-white/70 text-sm">{review.users?.display_name?.charAt(0) || "U"}</span>
                            )}
                          </div>
                          <span className="text-white/80 text-sm">{review.users?.display_name || "匿名用戶"}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= review.rating ? "text-yellow-400 text-sm" : "text-white/20 text-sm"}>★</span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-white/60 text-sm leading-relaxed">{renderSafeContent(review.comment)}</p>
                      )}
                      <span className="text-white/30 text-xs mt-2 block">{formatDate(review.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8 text-sm">尚無評價，成為第一位評價的人吧！</p>
              )}
            </section>
          </div>

          {/* ── Right: Purchase Card (sticky) ── */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div
              className="rounded-lg p-6 sm:p-8 relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(30,30,30,0.4) 0%, rgba(10,10,10,0.85) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderTop: "2px solid rgba(255,255,255,0.6)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* Price */}
              <span className="block text-3xl sm:text-4xl font-bold text-white mb-6 tracking-wider">
                {formatPrice()}
              </span>

              {/* Buy Button */}
              {isAuthenticated ? (
                <button
                  onClick={() => navigate(`/checkout?course=${course.course_id}`)}
                  className="w-full py-4 bg-white text-black font-bold tracking-[3px] uppercase text-sm hover:bg-white/90 transition-colors relative overflow-hidden group"
                >
                  <span className="relative z-10">立即購買</span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-linear-to-r from-transparent via-black/10 to-transparent skew-x-[-30deg]" />
                </button>
              ) : (
                <Link to="/login" className="block">
                  <button className="w-full py-4 bg-white/10 border border-white/30 text-white font-bold tracking-[3px] uppercase text-sm hover:bg-white/15 transition-colors">
                    登入後購買
                  </button>
                </Link>
              )}

              {/* Includes List */}
              <ul className="mt-8 space-y-4">
                {[
                  course.lessonsCount ? `${course.lessonsCount} 支高畫質教學影片` : "高畫質教學影片",
                  "專屬學員課表講義 (PDF)",
                  "無限次數觀看權限",
                  "專屬學員社群",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-white/60 text-sm">
                    <span className="text-white/80">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Rating Summary */}
              {course.ratingAverage !== undefined && course.ratingCount! > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{course.ratingAverage.toFixed(1)}</div>
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={s <= Math.round(course.ratingAverage!) ? "text-yellow-400 text-sm" : "text-white/20 text-sm"}>★</span>
                    ))}
                  </div>
                  <div className="text-white/40 text-xs">{course.ratingCount} 則評價</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
