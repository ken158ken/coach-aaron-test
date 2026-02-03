/**
 * ArticleDetail 頁面 - 文章詳細內容
 * @module pages/ArticleDetail
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { articleService } from "@/services/article.service";
import { useAuth } from "@/context";
import { Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import type { Article, ArticleComment, ArticleRating } from "@/types";

/**
 * ArticleDetail - 文章詳細頁面
 *
 * @returns {JSX.Element} 文章詳細頁面
 */
const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [, setRatings] = useState<ArticleRating[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchArticle = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError("");
      const data = await articleService.getByIdentifier(slug);

      if (data) {
        setArticle(data);
        // 載入評分和留言
        const [ratingsData, commentsData] = await Promise.all([
          articleService.getRatings(data.article_id),
          articleService.getComments(data.article_id),
        ]);
        setRatings(ratingsData || []);
        setComments(commentsData || []);

        // 檢查用戶是否已評分
        if (user) {
          const userRatingData = ratingsData?.find(
            (r: ArticleRating) => r.user_id === user.user_id,
          );
          if (userRatingData) {
            setUserRating(userRatingData.rating);
          }
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

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleRate = async (rating: number) => {
    if (!isAuthenticated || !article) return;

    try {
      await articleService.rateArticle(article.article_id, rating);
      setUserRating(rating);
      // 重新載入文章以獲取更新後的評分
      fetchArticle();
    } catch (err) {
      console.error("Failed to rate article:", err);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated || !article || !commentText.trim()) return;

    try {
      setSubmitting(true);
      await articleService.addComment(article.article_id, commentText.trim());
      setCommentText("");
      // 重新載入留言
      const commentsData = await articleService.getComments(article.article_id);
      setComments(commentsData || []);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!isAuthenticated || !article || !replyText.trim()) return;

    try {
      setSubmitting(true);
      await articleService.addComment(
        article.article_id,
        replyText.trim(),
        parentId,
      );
      setReplyText("");
      setReplyingTo(null);
      // 重新載入留言
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
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 組織留言為巢狀結構
  const organizeComments = (flatComments: ArticleComment[]) => {
    const commentMap = new Map<
      number,
      ArticleComment & { replies: ArticleComment[] }
    >();
    const topLevel: (ArticleComment & { replies: ArticleComment[] })[] = [];

    // 先建立所有留言的 map
    flatComments.forEach((comment) => {
      commentMap.set(comment.comment_id, { ...comment, replies: [] });
    });

    // 組織巢狀結構
    flatComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.comment_id)!;
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        topLevel.push(commentWithReplies);
      }
    });

    return topLevel;
  };

  // 取得作者名稱
  const getAuthorName = (comment: ArticleComment) => {
    return (
      comment.author?.display_name || comment.users?.display_name || "使用者"
    );
  };

  const renderComment = (
    comment: ArticleComment & { replies?: ArticleComment[] },
    depth = 0,
  ) => {
    if (!comment.is_visible) return null;

    return (
      <div
        key={comment.comment_id}
        className={`${depth > 0 ? "ml-8 border-l border-luxe-gold/10 pl-4" : ""}`}
      >
        <div className="bg-luxe-surface rounded-lg p-4 mb-3">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-luxe-gold/20 flex items-center justify-center">
                <span className="text-luxe-gold text-sm">
                  {getAuthorName(comment).charAt(0) || "U"}
                </span>
              </div>
              <span className="text-luxe-text text-sm">
                {getAuthorName(comment)}
              </span>
            </div>
            <span className="text-luxe-muted text-xs">
              {formatDate(comment.created_at)}
            </span>
          </div>

          {/* Comment Content */}
          <p className="text-luxe-text/80 text-sm whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Reply Button */}
          {isAuthenticated && depth < 2 && (
            <button
              onClick={() =>
                setReplyingTo(
                  replyingTo === comment.comment_id ? null : comment.comment_id,
                )
              }
              className="text-luxe-gold text-xs mt-2 hover:underline"
            >
              {replyingTo === comment.comment_id ? "取消回覆" : "回覆"}
            </button>
          )}

          {/* Reply Input */}
          {replyingTo === comment.comment_id && (
            <div className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="輸入回覆..."
                className="w-full bg-luxe-bg border border-luxe-gold/20 rounded-lg px-4 py-2 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50"
                rows={2}
              />
              <button
                onClick={() => handleReply(comment.comment_id)}
                disabled={submitting || !replyText.trim()}
                className="mt-2 px-4 py-1 bg-luxe-gold/20 text-luxe-gold text-sm rounded-lg hover:bg-luxe-gold/30 disabled:opacity-50"
              >
                {submitting ? "送出中..." : "送出回覆"}
              </button>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {comment.replies &&
          comment.replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return <Loading text="載入中..." />;
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-luxe-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-luxe-muted mb-4">{error || "找不到文章"}</p>
          <Link to="/articles" className="text-luxe-gold hover:underline">
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  const organizedComments = organizeComments(comments);

  return (
    <div className="min-h-screen bg-luxe-bg">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title={article.article_title}
        description={article.article_description || article.article_title}
        keywords={article.article_keywords || []}
        image={article.article_thumbnail_url}
        url={`/articles/${article.article_slug || article.article_id}`}
        type="article"
        isArticle={true}
        publishedTime={article.published_at || article.created_at}
        modifiedTime={article.updated_at}
        author={
          article.author?.display_name ||
          article.users?.display_name ||
          "Coach Aaron"
        }
        category={article.article_category}
      />

      {/* Article Header */}
      <div className="bg-luxe-surface border-b border-luxe-gold/10 py-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/articles"
              className="text-luxe-muted hover:text-luxe-gold transition-colors text-sm"
            >
              ← 返回文章列表
            </Link>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            {article.article_category && (
              <span className="text-luxe-gold text-sm">
                {article.article_category}
              </span>
            )}
            {article.is_featured && (
              <span className="text-yellow-500 text-sm">★ 精選文章</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-light text-luxe-text mb-6">
            {article.article_title}
          </h1>

          {/* Article Info */}
          <div className="flex flex-wrap items-center gap-6 text-luxe-muted text-sm">
            {(article.author || article.users) && (
              <span>
                作者：
                {article.author?.display_name ||
                  article.users?.display_name ||
                  "Coach Aaron"}
              </span>
            )}
            <span>
              {formatDate(article.published_at || article.created_at)}
            </span>
            <span>{article.view_count || 0} 次瀏覽</span>
            {article.rating_count > 0 && (
              <span>
                ★ {article.rating_average.toFixed(1)} ({article.rating_count}{" "}
                個評分)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Thumbnail */}
          {article.article_thumbnail_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.article_thumbnail_url}
                alt={article.article_title}
                className="w-full"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none text-luxe-text/80"
            dangerouslySetInnerHTML={{
              __html: article.article_content || "<p>文章內容尚未撰寫</p>",
            }}
          />

          {/* Keywords */}
          {article.article_keywords && article.article_keywords.length > 0 && (
            <div className="mt-8 pt-8 border-t border-luxe-gold/10">
              <div className="flex flex-wrap gap-2">
                {article.article_keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-luxe-gold/10 text-luxe-gold text-sm rounded-full"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div className="mt-12 pt-8 border-t border-luxe-gold/10">
            <h3 className="text-xl font-light text-luxe-text mb-4">
              為這篇文章評分
            </h3>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={!isAuthenticated}
                  className={`text-3xl transition-colors ${
                    star <= userRating
                      ? "text-yellow-500"
                      : "text-luxe-muted hover:text-yellow-500/50"
                  } ${!isAuthenticated ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  ★
                </button>
              ))}
              {userRating > 0 && (
                <span className="ml-2 text-luxe-muted text-sm">
                  你的評分：{userRating}
                </span>
              )}
            </div>
            {!isAuthenticated && (
              <p className="text-luxe-muted text-sm mt-2">
                <Link to="/login" className="text-luxe-gold hover:underline">
                  登入
                </Link>
                後即可評分
              </p>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-12 pt-8 border-t border-luxe-gold/10">
            <h3 className="text-xl font-light text-luxe-text mb-6">
              留言 ({comments.filter((c) => c.is_visible).length})
            </h3>

            {/* Add Comment */}
            {isAuthenticated ? (
              <div className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="分享你的想法..."
                  className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50"
                  rows={3}
                />
                <button
                  onClick={handleComment}
                  disabled={submitting || !commentText.trim()}
                  className="mt-3 px-6 py-2 bg-luxe-gold text-black rounded-full hover:bg-luxe-gold/80 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "送出中..." : "送出留言"}
                </button>
              </div>
            ) : (
              <p className="text-luxe-muted mb-8">
                <Link to="/login" className="text-luxe-gold hover:underline">
                  登入
                </Link>
                後即可留言
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {organizedComments.length > 0 ? (
                organizedComments.map((comment) => renderComment(comment))
              ) : (
                <p className="text-luxe-muted text-center py-8">
                  尚無留言，成為第一個留言的人吧！
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
