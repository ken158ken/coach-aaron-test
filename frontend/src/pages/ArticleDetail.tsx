/**
 * ArticleDetail 頁面 - 文章詳細內容
 * @module pages/ArticleDetail
 * @security 實施前端輸入消毒與驗證
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { articleService } from "@/services/content/article.service";
import { useAuth } from "@/context";
import { useSafeInput, useRatingInput, renderSafeContent } from "@/hooks";
import { useLocalize } from "@/hooks/useLocalize";
import { useLanguage } from "@/context/LanguageContext";
import { Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import type { Article, ArticleComment, ArticleRating } from "@/types";

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const { loc } = useLocalize();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [, setRatings] = useState<ArticleRating[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { rating: userRating, setRating: setUserRating } = useRatingInput(0);

  // Tracing Beam — 閱讀進度金色發光線
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["start center", "end center"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const beamHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);
  const dotTop = useTransform(smoothProgress, [0, 1], ["0%", "calc(100% - 12px)"]);

  const {
    value: commentText,
    handleChange: handleCommentChange,
    validation: commentValidation,
    getSanitizedValue: getSanitizedComment,
    reset: resetComment,
  } = useSafeInput("", { maxLength: 2000, minLength: 1, allowNewlines: true, strictMode: true });

  const {
    value: replyText,
    handleChange: handleReplyChange,
    validation: replyValidation,
    getSanitizedValue: getSanitizedReply,
    reset: resetReply,
  } = useSafeInput("", { maxLength: 1000, minLength: 1, allowNewlines: true, strictMode: true });

  const fetchArticle = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError("");
      const data = await articleService.getByIdentifier(slug);
      if (data) {
        setArticle(data);
        const [ratingsData, commentsData, popularData] = await Promise.all([
          articleService.getRatings(data.article_id),
          articleService.getComments(data.article_id),
          articleService.getAll({ limit: 12 }),
        ]);
        setRatings(ratingsData || []);
        setComments(commentsData || []);
        setPopularArticles(
          (popularData.articles || [])
            .filter((a) => a.article_id !== data.article_id)
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5),
        );
        if (user) {
          const userRatingData = ratingsData?.find(
            (r: ArticleRating) => r.user_id === user.user_id,
          );
          if (userRatingData) setUserRating(userRatingData.rating);
        }
      } else {
        setError("找不到文章");
      }
    } catch (err) {
      console.error("Failed to fetch article:", err);
      setError("載入文章失敗");
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => { fetchArticle(); }, [fetchArticle]);

  const handleRate = async (rating: number) => {
    if (!isAuthenticated || !article) return;
    try {
      await articleService.rateArticle(article.article_id, rating);
      setUserRating(rating);
      fetchArticle();
    } catch (err) {
      console.error("Failed to rate article:", err);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated || !article || !commentValidation.isValid) return;
    try {
      setSubmitting(true);
      await articleService.addComment(article.article_id, getSanitizedComment());
      resetComment();
      const commentsData = await articleService.getComments(article.article_id);
      setComments(commentsData || []);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!isAuthenticated || !article || !replyValidation.isValid) return;
    try {
      setSubmitting(true);
      await articleService.addComment(article.article_id, getSanitizedReply(), parentId);
      resetReply();
      setReplyingTo(null);
      const commentsData = await articleService.getComments(article.article_id);
      setComments(commentsData || []);
    } catch (err) {
      console.error("Failed to add reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(
      language === "en" ? "en-US" : "zh-TW",
      { year: "numeric", month: "long", day: "numeric" },
    );
  };

  const organizeComments = (flatComments: ArticleComment[]) => {
    const commentMap = new Map<number, ArticleComment & { replies: ArticleComment[] }>();
    const topLevel: (ArticleComment & { replies: ArticleComment[] })[] = [];
    flatComments.forEach((c) => commentMap.set(c.comment_id, { ...c, replies: [] }));
    flatComments.forEach((c) => {
      const node = commentMap.get(c.comment_id)!;
      if (c.parent_comment_id) {
        commentMap.get(c.parent_comment_id)?.replies.push(node);
      } else {
        topLevel.push(node);
      }
    });
    return topLevel;
  };

  const getAuthorName = (comment: ArticleComment) =>
    comment.author?.display_name || comment.users?.display_name || "使用者";

  const renderComment = (
    comment: ArticleComment & { replies?: ArticleComment[] },
    depth = 0,
  ) => {
    if (!comment.is_visible) return null;
    return (
      <div key={comment.comment_id} className={depth > 0 ? "ml-6 border-l border-white/10 pl-4" : ""}>
        <div className="bg-white/3 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <span className="text-white/60 text-xs">{getAuthorName(comment).charAt(0)}</span>
              </div>
              <span className="text-white/80 text-sm">{getAuthorName(comment)}</span>
            </div>
            <span className="text-white/30 text-xs">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-white/60 text-sm whitespace-pre-wrap">{renderSafeContent(comment.content)}</p>
          {isAuthenticated && depth < 2 && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.comment_id ? null : comment.comment_id)}
              className="text-white/40 hover:text-white/70 text-xs mt-2 transition-colors"
            >
              {replyingTo === comment.comment_id ? t.article.cancelReply : t.article.reply}
            </button>
          )}
          {replyingTo === comment.comment_id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={handleReplyChange}
                placeholder={t.article.shareThoughts}
                className={`w-full bg-transparent border rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none transition-colors resize-none ${
                  !replyValidation.isValid && replyText ? "border-red-500/50" : "border-white/10 focus:border-white/30"
                }`}
                rows={2}
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <span className={`text-xs ${!replyValidation.isValid && replyText ? "text-red-400" : "text-white/30"}`}>
                  {!replyValidation.isValid && replyText ? replyValidation.errorMessage : `${replyValidation.charCount} / 1000`}
                </span>
                <button
                  onClick={() => handleReply(comment.comment_id)}
                  disabled={submitting || !replyValidation.isValid}
                  className="px-4 py-1 border border-white/20 text-white/60 text-xs hover:border-white/40 disabled:opacity-40 transition-colors"
                >
                  {submitting ? t.common.loading : t.article.submitReply}
                </button>
              </div>
            </div>
          )}
        </div>
        {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading) return <Loading text={t.common.loading} />;

  if (error || !article) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">{error || t.article.noContent}</p>
          <Link to="/articles" className="text-[#d4d4d4] hover:underline">{t.article.backToList}</Link>
        </div>
      </div>
    );
  }

  const organizedComments = organizeComments(comments);
  const authorName = article.author?.display_name || article.users?.display_name || "Coach Aaron";
  const articleObj = article as unknown as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-transparent relative">
      <SEOHead
        title={loc(articleObj, "article_title")}
        description={loc(articleObj, "article_description") || loc(articleObj, "article_title")}
        keywords={article.article_keywords ? article.article_keywords.split(",").map((k) => k.trim()) : []}
        image={article.article_thumbnail_url}
        url={`/articles/${article.article_slug || article.article_id}`}
        type="article"
        isArticle={true}
        publishedTime={article.published_at || article.created_at}
        modifiedTime={article.updated_at}
        author={authorName}
        category={loc(articleObj, "article_category")}
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
          className={`absolute inset-0 -z-10${!(article.article_banner_url || article.article_thumbnail_url) ? " banner-fallback" : ""}`}
          style={
            (article.article_banner_url || article.article_thumbnail_url)
              ? {
                  background: `linear-gradient(to bottom, rgba(10,10,10,0.25), rgba(10,10,10,0.90)), url(${article.article_banner_url || article.article_thumbnail_url}) center/cover no-repeat`,
                }
              : undefined
          }
        />

        {/* Banner Content */}
        <div className="w-full px-6 sm:px-12 pb-10 sm:pb-14 relative z-10">
          <div className="max-w-300 mx-auto">
            {/* Breadcrumb */}
            <Link
              to="/articles"
              className="inline-block text-white/40 hover:text-white/70 text-xs sm:text-sm tracking-widest uppercase mb-4 transition-colors"
            >
              ← Knowledge
            </Link>

            {/* Category Tag */}
            {article.article_category && (
              <div className="mb-3 sm:mb-4">
                <span className="inline-block px-3 py-1 border border-white/40 text-white text-xs tracking-[2px] uppercase">
                  {loc(articleObj, "article_category")}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="silver-heading text-3xl sm:text-5xl md:text-6xl font-black tracking-[2px] sm:tracking-[4px] mb-4 sm:mb-5 leading-tight">
              {loc(articleObj, "article_title")}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 sm:gap-6 text-white/55 text-sm">
              <span>{authorName}</span>
              <span>{formatDate(article.published_at || article.created_at)}</span>
              {article.view_count > 0 && <span>{article.view_count} {t.article.views}</span>}
              {article.rating_count > 0 && (
                <span>★ {article.rating_average.toFixed(1)} ({article.rating_count} {t.article.ratings})</span>
              )}
              {article.is_featured && <span className="text-yellow-400">★ {t.article.featured}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: 2fr / 1fr ── */}
      <div className="detail-body px-4 sm:px-6 lg:px-12 relative z-10 -mt-6 pb-20">
        <div className="max-w-300 mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12">

          {/* ── Left: Article Content ── */}
          <div ref={contentRef} className="relative space-y-10">
            {/* Tracing Beam — 左側閱讀進度金色發光線 */}
            <div className="hidden lg:block absolute -left-5 top-0 bottom-0 w-px pointer-events-none">
              {/* Track */}
              <div className="absolute inset-0 bg-white/8 rounded-full" />
              {/* Beam fill */}
              <motion.div
                className="absolute top-0 left-0 right-0 origin-top rounded-full"
                style={{
                  height: beamHeight,
                  background: "linear-gradient(to bottom, transparent, rgba(197,160,89,0.6) 40%, rgba(197,160,89,0.9) 60%, transparent)",
                }}
              />
              {/* Glowing dot */}
              <motion.div
                className="absolute -translate-x-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-luxe-gold"
                style={{
                  top: dotTop,
                  boxShadow: "0 0 8px 2px rgba(197,160,89,0.7)",
                }}
              />
            </div>

            {/* Article Body */}
            <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: loc(articleObj, "article_content") || `<p>${t.article.noContent}</p>`,
                }}
              />

              {/* Keywords */}
              {article.article_keywords?.trim() && (
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2">
                  {article.article_keywords.split(",").map((kw, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/5 text-white/50 text-xs rounded-full">
                      #{kw.trim()}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Comments Section */}
            <section className="bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-3 border-b border-white/10">
                <h2 className="text-xl sm:text-2xl font-light text-white">
                  {t.article.comments} ({comments.filter((c) => c.is_visible).length})
                </h2>
                {/* Rating Stars */}
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs">{t.article.rateThis}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? t.article.loginToRate : `${star} ★`}
                        className={`text-xl transition-colors ${
                          star <= userRating ? "text-yellow-400" : "text-white/20 hover:text-yellow-400/50"
                        } ${!isAuthenticated ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >★</button>
                    ))}
                  </div>
                  {article.rating_count > 0 && (
                    <span className="text-white/30 text-xs">
                      {article.rating_average.toFixed(1)} ({article.rating_count})
                    </span>
                  )}
                </div>
              </div>

              {/* Add Comment */}
              {isAuthenticated ? (
                <div className="mb-8 space-y-2">
                  <textarea
                    value={commentText}
                    onChange={handleCommentChange}
                    placeholder={t.article.shareThoughts}
                    className={`w-full bg-transparent border rounded-lg px-4 py-3 text-white/80 text-sm focus:outline-none transition-colors resize-none ${
                      !commentValidation.isValid && commentText
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-white/30"
                    }`}
                    rows={3}
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className={!commentValidation.isValid && commentText ? "text-red-400" : "text-transparent"}>
                      {commentValidation.errorMessage}
                    </span>
                    <span className={commentValidation.remainingChars < 100 ? "text-yellow-500" : "text-white/30"}>
                      {commentValidation.charCount} / 2000
                    </span>
                  </div>
                  <button
                    onClick={handleComment}
                    disabled={submitting || !commentValidation.isValid}
                    className="px-6 py-2 border border-white/30 text-white text-sm tracking-widest hover:border-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? t.common.loading : t.article.submitComment}
                  </button>
                </div>
              ) : (
                <p className="text-white/40 text-sm mb-8">
                  <Link to="/login" className="text-[#d4d4d4] hover:underline">{t.login.submit}</Link>{" "}{t.article.loginToComment}
                </p>
              )}

              {/* Comment List */}
              <div className="space-y-4">
                {organizedComments.length > 0 ? (
                  organizedComments.map((c) => renderComment(c))
                ) : (
                  <p className="text-white/30 text-center py-8 text-sm">{t.article.noComments}</p>
                )}
              </div>
            </section>
          </div>

          {/* ── Right: Sticky Info Card ── */}
          <div className="detail-sidebar lg:sticky lg:top-28 h-fit space-y-5">

            {/* Author Card */}
            <div
              className="rounded-lg p-6 sm:p-8"
              style={{
                background: "linear-gradient(145deg, rgba(30,30,30,0.4) 0%, rgba(10,10,10,0.85) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderTop: "2px solid rgba(255,255,255,0.5)",
              }}
            >
              <p className="text-white/30 text-xs uppercase tracking-widest mb-3">{t.article.author}</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <span className="text-white/60 text-sm">{authorName.charAt(0)}</span>
                </div>
                <span className="text-white/80 font-light">{authorName}</span>
              </div>
              <div className="space-y-2 text-sm text-white/50">
                <div>{formatDate(article.published_at || article.created_at)}</div>
                {article.view_count > 0 && <div>{article.view_count} {t.article.views}</div>}
              </div>
            </div>

            {/* Popular Articles Card */}
            <div
              className="rounded-lg p-6"
              style={{
                background: "linear-gradient(145deg, rgba(30,30,30,0.4) 0%, rgba(10,10,10,0.85) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">{t.article.popularArticles}</p>
              {popularArticles.length > 0 ? (
                <div className="space-y-4">
                  {popularArticles.map((a, idx) => (
                    <Link
                      key={a.article_id}
                      to={`/articles/${a.article_slug || a.article_id}`}
                      className="flex gap-3 group"
                    >
                      <span className="text-white/20 text-xs font-mono w-4 shrink-0 pt-0.5">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-white/70 text-sm leading-snug group-hover:text-white/90 transition-colors line-clamp-2">
                          {loc(a as unknown as Record<string, unknown>, "article_title")}
                        </p>
                        {a.view_count > 0 && (
                          <p className="text-white/30 text-xs mt-1">{a.view_count} {t.article.views}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm">{t.common.noData}</p>
              )}
            </div>

            {/* Back Button */}
            <Link
              to="/articles"
              className="block w-full py-3 border border-white/20 text-white/50 text-sm tracking-widest text-center hover:border-white/40 hover:text-white/70 transition-colors"
            >
              ← {t.article.backToList}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
