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
  useLocalize,
} from "@/hooks";
import { useLanguage } from "@/context/LanguageContext";
import { courseService } from "@/services";
import { Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import type { Course, CourseReview } from "@/types";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { hasPurchasedCourse, loadingPurchases } = useUser();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { loc } = useLocalize();
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
        setError(language === "en" ? "Course not found" : "找不到課程");
      }
    } catch (err) {
      console.error("Failed to fetch course:", err);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [id, user, language, t]);

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
    if (!course?.show_price) return t.course.inquirePrice;
    if (!course?.price) return t.course.free;
    return `NT$ ${course.price.toLocaleString()}`;
  };

  const levelLabels: Record<string, string> = {
    beginner: t.course.beginner,
    intermediate: t.course.intermediate,
    advanced: t.course.advanced,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "zh-TW", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  if (loading) return <Loading text={t.common.loading} />;

  if (error || !course) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">{error || (language === "en" ? "Course not found" : "找不到課程")}</p>
          <Link to="/courses" className="text-[#d4d4d4] hover:underline">{t.course.backToList}</Link>
        </div>
      </div>
    );
  }

  const hasReviewed = user && reviews.some((r) => r.user_id === user.user_id);

  return (
    <div className="min-h-screen bg-transparent relative">
      <SEOHead
        title={loc(course as unknown as Record<string, unknown>, "course_title")}
        description={loc(course as unknown as Record<string, unknown>, "course_description") || loc(course as unknown as Record<string, unknown>, "course_title")}
        keywords={course.keywords || (language === "en" ? ["fitness", "courses", "training"] : ["健身", "課程", "訓練"])}
        image={course.thumbnail}
        url={`/courses/${course.id}`}
        type="product"
      />

      {/* ── Full-width Banner ── */}
      <div
        className="banner-area relative w-full flex items-end pt-20"
        style={{
          height: "clamp(280px, 55vw, 580px)",
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
              {loc(course as unknown as Record<string, unknown>, "course_title")}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 sm:gap-6 text-white/60 text-sm sm:text-base">
              {course.lessonsCount && <span>📖 {course.lessonsCount} {t.course.lessons}</span>}
              {course.duration && <span>⏱️ {course.duration}</span>}
              {course.ratingAverage !== undefined && course.ratingCount! > 0 && (
                <span>⭐ {course.ratingAverage.toFixed(1)} ({course.ratingCount} {t.course.reviews})</span>
              )}
              {course.totalEnrolled !== undefined && (
                <span>👥 {course.totalEnrolled} {t.course.enrolled}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: 2fr / 1fr ── */}
      <div className="detail-body px-4 sm:px-6 lg:px-12 relative z-10 -mt-6 pb-20">
        <div className="max-w-300 mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12">

          {/* ── Left: Content ── */}
          <div className="space-y-10">

            {/* Description */}
            {course.description && (
              <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
                <h2 className="text-xl sm:text-2xl font-light text-white mb-4 pb-3 border-b border-white/10">{t.course.intro}</h2>
                <p className="text-white/60 leading-relaxed text-sm sm:text-base">
                  {loc(course as unknown as Record<string, unknown>, "course_description")}
                </p>
              </section>
            )}

            {/* Full Content */}
            {course.content && (
              <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
                <h2 className="text-xl sm:text-2xl font-light text-white mb-4 pb-3 border-b border-white/10">{t.course.courseContent}</h2>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: loc(course as unknown as Record<string, unknown>, "course_content") || course.content }}
                />
              </section>
            )}

            {/* What You'll Learn */}
            <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-light text-white mb-6 pb-3 border-b border-white/10">{t.course.whatYouLearn}</h2>
              <ul className="space-y-3">
                {[
                  t.course.learnItem1,
                  t.course.learnItem2,
                  t.course.learnItem3,
                  t.course.learnItem4,
                  t.course.learnItem5,
                  t.course.learnItem6,
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
                {t.course.studentReviews} ({reviews.length})
              </h2>

              {/* Review Form */}
              <div className="bg-white/5 rounded-lg p-5 sm:p-6 mb-8">
                {loadingPurchases ? (
                  <p className="text-center text-white/50 py-4">{t.common.loading}</p>
                ) : !isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-white/50 mb-4">{t.course.loginToReview}</p>
                    <Link to="/login" className="inline-block px-6 py-2 border border-white/30 text-white text-sm tracking-widest hover:border-white transition-colors">
                      {t.nav.login}
                    </Link>
                  </div>
                ) : !hasPurchasedCourse(course.course_id!) ? (
                  <div className="text-center py-4">
                    <p className="text-white/50 mb-4">{t.course.purchaseToReview}</p>
                    <button
                      onClick={() => navigate(`/checkout?course=${course.course_id}`)}
                      className="px-6 py-2 border border-white/30 text-white text-sm tracking-widest hover:border-white transition-colors"
                    >
                      {t.course.buyNow}
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-medium text-white/90 mb-4">
                      {hasReviewed ? t.course.updateReview : t.course.rateThis}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm mr-1">{t.course.ratingLabel}</span>
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
                          placeholder={language === "en" ? "Share your thoughts about this course (optional)..." : "分享你對這門課程的看法（可選）..."}
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
                        {submitting ? t.course.submittingReview : hasReviewed ? t.course.updateReviewBtn : t.course.submitReview}
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
                          <span className="text-white/80 text-sm">{review.users?.display_name || t.course.anonymous}</span>
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
                <p className="text-white/40 text-center py-8 text-sm">{t.course.noReviews}</p>
              )}
            </section>
          </div>

          {/* ── Right: Purchase Card (sticky) ── */}
          <div className="detail-sidebar lg:sticky lg:top-28 h-fit">
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
                  <span className="relative z-10">{t.course.buyNow}</span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-linear-to-r from-transparent via-black/10 to-transparent skew-x-[-30deg]" />
                </button>
              ) : (
                <Link to="/login" className="block">
                  <button className="w-full py-4 bg-white/10 border border-white/30 text-white font-bold tracking-[3px] uppercase text-sm hover:bg-white/15 transition-colors">
                    {t.course.loginToBuy}
                  </button>
                </Link>
              )}

              {/* Includes List */}
              <ul className="mt-8 space-y-4">
                {[
                  course.lessonsCount ? `${course.lessonsCount} ${t.course.includesVideos}` : t.course.includesVideos,
                  t.course.includesPdf,
                  t.course.includesUnlimited,
                  t.course.includesCommunity,
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
                  <div className="text-white/40 text-xs">{course.ratingCount} {t.course.reviews}</div>
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
