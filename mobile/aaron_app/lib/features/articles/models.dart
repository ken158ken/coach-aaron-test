// 對齊後端 /api/articles 回傳結構
class ArticleSummary {
  final int id;
  final String title;
  final String? slug;
  final String? description;
  final String? thumbnailUrl;
  final String? category;
  final int viewCount;
  final double? ratingAverage;
  final int? ratingCount;
  final int? commentCount;
  final bool isFeatured;
  final DateTime? publishedAt;

  const ArticleSummary({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.thumbnailUrl,
    this.category,
    required this.viewCount,
    this.ratingAverage,
    this.ratingCount,
    this.commentCount,
    required this.isFeatured,
    this.publishedAt,
  });

  factory ArticleSummary.fromJson(Map<String, dynamic> json) {
    final ratingRaw = json['rating_average'];
    return ArticleSummary(
      id: (json['article_id'] as num?)?.toInt() ?? 0,
      title: json['article_title'] as String? ?? '',
      slug: json['article_slug'] as String?,
      description: json['article_description'] as String?,
      thumbnailUrl: json['article_thumbnail_url'] as String?,
      category: json['article_category'] as String?,
      viewCount: (json['view_count'] as num?)?.toInt() ?? 0,
      ratingAverage: ratingRaw == null ? null : (ratingRaw as num).toDouble(),
      ratingCount: (json['rating_count'] as num?)?.toInt(),
      commentCount: (json['comment_count'] as num?)?.toInt(),
      isFeatured: json['is_featured'] as bool? ?? false,
      publishedAt: _parseDate(json['published_at']),
    );
  }

  static DateTime? _parseDate(Object? raw) {
    if (raw is String) return DateTime.tryParse(raw);
    return null;
  }
}

class Article {
  final int id;
  final String title;
  final String? slug;
  final String? description;
  final String? content; // HTML
  final String? thumbnailUrl;
  final String? bannerUrl;
  final String? category;
  final int viewCount;
  final DateTime? publishedAt;
  final String? authorName;
  final String? authorAvatar;

  const Article({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.content,
    this.thumbnailUrl,
    this.bannerUrl,
    this.category,
    required this.viewCount,
    this.publishedAt,
    this.authorName,
    this.authorAvatar,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    final author = json['users'];
    return Article(
      id: (json['article_id'] as num?)?.toInt() ?? 0,
      title: json['article_title'] as String? ?? '',
      slug: json['article_slug'] as String?,
      description: json['article_description'] as String?,
      content: json['article_content'] as String?,
      thumbnailUrl: json['article_thumbnail_url'] as String?,
      bannerUrl: json['article_banner_url'] as String?,
      category: json['article_category'] as String?,
      viewCount: (json['view_count'] as num?)?.toInt() ?? 0,
      publishedAt: ArticleSummary._parseDate(json['published_at']),
      authorName: author is Map ? author['display_name'] as String? : null,
      authorAvatar: author is Map ? author['avatar_url'] as String? : null,
    );
  }
}
