/**
 * 文章服務
 * @module services/article.service
 */

import { get, post, put, del } from "./api";
import type {
  Article,
  ArticlesResponse,
  ArticleRating,
  ArticleComment,
} from "@/types";

/**
 * 正規化文章資料 (資料庫欄位 -> 前端欄位)
 * @param data 原始文章資料
 * @returns 正規化後的文章資料
 */
const normalizeArticle = (data: Partial<Article>): Article => {
  return {
    ...data,
    // 保留原始欄位，同時添加前端別名
    author: data.users || data.author,
  } as Article;
};

/**
 * 正規化留言資料 (資料庫欄位 -> 前端欄位)
 * @param data 原始留言資料
 * @returns 正規化後的留言資料
 */
const normalizeComment = (data: Partial<ArticleComment>): ArticleComment => {
  return {
    ...data,
    author: data.users || data.author,
    replies: data.replies?.map(normalizeComment),
  } as ArticleComment;
};

/**
 * 文章服務物件
 */
export const articleService = {
  /**
   * 取得所有已發布文章
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
  }): Promise<ArticlesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.category) queryParams.append("category", params.category);
    if (params?.featured) queryParams.append("featured", "true");

    const queryString = queryParams.toString();
    const response = await get<ArticlesResponse>(
      `/api/articles${queryString ? `?${queryString}` : ""}`,
    );
    return {
      ...response,
      articles: response.articles?.map(normalizeArticle) || [],
    };
  },

  /**
   * 取得單一文章（依 slug 或 id）
   */
  getByIdentifier: async (identifier: string | number): Promise<Article> => {
    const data = await get<Article>(`/api/articles/${identifier}`);
    return normalizeArticle(data);
  },

  /**
   * 取得文章評分
   */
  getRatings: async (articleId: number): Promise<ArticleRating[]> => {
    return get<ArticleRating[]>(`/api/articles/${articleId}/ratings`);
  },

  /**
   * 取得文章留言
   */
  getComments: async (articleId: number): Promise<ArticleComment[]> => {
    const data = await get<ArticleComment[]>(
      `/api/articles/${articleId}/comments`,
    );
    return Array.isArray(data) ? data.map(normalizeComment) : [];
  },

  /**
   * 新增或更新評分
   */
  rateArticle: async (
    articleId: number,
    rating: number,
  ): Promise<ArticleRating> => {
    return post<ArticleRating>(`/api/articles/${articleId}/ratings`, {
      rating,
    });
  },

  /**
   * 新增留言
   */
  addComment: async (
    articleId: number,
    content: string,
    parentCommentId?: number,
  ): Promise<ArticleComment> => {
    return post<ArticleComment>(`/api/articles/${articleId}/comments`, {
      content,
      parentCommentId,
    });
  },

  // ===== 管理員功能 =====

  /**
   * 取得所有文章（管理員）
   */
  getAllAdmin: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ArticlesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    return get<ArticlesResponse>(
      `/api/articles/admin/all${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * 建立文章（管理員）
   */
  create: async (data: {
    title: string;
    slug?: string;
    description?: string;
    content?: string;
    thumbnailUrl?: string;
    keywords?: string[];
    category?: string;
    status?: string;
    isFeatured?: boolean;
  }): Promise<Article> => {
    return post<Article>("/api/articles", data);
  },

  /**
   * 更新文章（管理員）
   */
  update: async (
    id: number,
    data: Partial<{
      title: string;
      slug: string;
      description: string;
      content: string;
      thumbnailUrl: string;
      keywords: string[];
      category: string;
      status: string;
      isFeatured: boolean;
    }>,
  ): Promise<Article> => {
    return put<Article>(`/api/articles/${id}`, data);
  },

  /**
   * 刪除文章（管理員）
   */
  delete: async (id: number): Promise<void> => {
    return del(`/api/articles/${id}`);
  },

  /**
   * 更新留言可見性（管理員）
   */
  updateCommentVisibility: async (
    commentId: number,
    isVisible: boolean,
  ): Promise<ArticleComment> => {
    return put<ArticleComment>(
      `/api/articles/comments/${commentId}/visibility`,
      {
        isVisible,
      },
    );
  },
};

export default articleService;
