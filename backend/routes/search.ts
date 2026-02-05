/**
 * 搜尋路由
 * @module routes/search
 * @description 全站內容搜尋 API
 */

import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { sanitizeSearchQuery, logSecurityEvent } from "../utils/sanitizer.js";

const router = Router();

interface SearchResult {
  id: string | number;
  type: "course" | "article" | "comment" | "review";
  title: string;
  description?: string;
  thumbnail?: string;
  url: string;
  highlight?: string;
}

/**
 * 全站搜尋
 * GET /api/search?q=關鍵字
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawQuery = req.query.q as string;
    if (!rawQuery || rawQuery.trim().length === 0) {
      res.json({ results: [], total: 0 });
      return;
    }

    // 輸入消毒
    const query = sanitizeSearchQuery(rawQuery);
    if (query.length < 2) {
      res.json({ results: [], total: 0 });
      return;
    }

    const results: SearchResult[] = [];

    // 搜尋課程
    const { data: courses } = await supabaseAdmin
      .from("courses")
      .select("id, title, description, thumbnail_url")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);

    if (courses) {
      for (const course of courses) {
        results.push({
          id: course.id,
          type: "course",
          title: course.title,
          description: course.description?.substring(0, 100) + "...",
          thumbnail: course.thumbnail_url,
          url: `/courses/${course.id}`,
        });
      }
    }

    // 搜尋文章
    const { data: articles } = await supabaseAdmin
      .from("articles")
      .select("id, title, excerpt, slug, cover_image")
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`,
      )
      .limit(5);

    if (articles) {
      for (const article of articles) {
        results.push({
          id: article.id,
          type: "article",
          title: article.title,
          description: article.excerpt?.substring(0, 100) + "...",
          thumbnail: article.cover_image,
          url: `/articles/${article.slug}`,
        });
      }
    }

    // 搜尋課程評價
    const { data: reviews } = await supabaseAdmin
      .from("course_reviews")
      .select(
        `
        id,
        comment,
        rating,
        course_id,
        courses (title)
      `,
      )
      .ilike("comment", `%${query}%`)
      .limit(5);

    if (reviews) {
      for (const review of reviews) {
        const coursesData = review.courses as unknown as
          | { title: string }[]
          | null;
        const courseTitle = coursesData?.[0]?.title || "課程";
        results.push({
          id: review.id,
          type: "review",
          title: `課程評價: ${courseTitle}`,
          description: review.comment?.substring(0, 100) + "...",
          url: `/courses/${review.course_id}`,
          highlight: `⭐ ${review.rating}/5`,
        });
      }
    }

    // 搜尋文章留言
    const { data: comments } = await supabaseAdmin
      .from("article_comments")
      .select(
        `
        id,
        content,
        article_id,
        articles (title, slug)
      `,
      )
      .ilike("content", `%${query}%`)
      .limit(5);

    if (comments) {
      for (const comment of comments) {
        const articlesData = comment.articles as unknown as
          | { title: string; slug: string }[]
          | null;
        const articleInfo = articlesData?.[0];
        results.push({
          id: comment.id,
          type: "comment",
          title: `文章留言: ${articleInfo?.title || "文章"}`,
          description: comment.content?.substring(0, 100) + "...",
          url: `/articles/${articleInfo?.slug || comment.article_id}`,
        });
      }
    }

    // 記錄搜尋
    logSecurityEvent("SEARCH", {
      query: query,
      resultsCount: results.length,
      ip: req.ip,
    });

    res.json({
      results,
      total: results.length,
      query: query,
    });
  } catch (error) {
    console.error("搜尋失敗:", error);
    res.status(500).json({ error: "搜尋失敗" });
  }
});

export default router;
