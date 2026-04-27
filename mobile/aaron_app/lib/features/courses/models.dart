// 對齊後端 /api/courses 回傳結構
class Course {
  final int id;
  final String title;
  final String? description;
  final String? content; // HTML
  final String? thumbnailUrl;
  final String? bannerUrl;
  final String? category;
  final String? level; // beginner / intermediate / advanced
  final int? lessonsCount;
  final int? durationMinutes;
  final double? ratingAverage;
  final int? ratingCount;
  final int? totalEnrolled;
  final num price;
  final bool showPrice;

  const Course({
    required this.id,
    required this.title,
    this.description,
    this.content,
    this.thumbnailUrl,
    this.bannerUrl,
    this.category,
    this.level,
    this.lessonsCount,
    this.durationMinutes,
    this.ratingAverage,
    this.ratingCount,
    this.totalEnrolled,
    required this.price,
    required this.showPrice,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    final ratingRaw = json['rating_average'];
    return Course(
      id: (json['course_id'] as num?)?.toInt() ?? 0,
      title: json['course_title'] as String? ?? '',
      description: json['course_description'] as String?,
      content: json['course_content'] as String?,
      thumbnailUrl: json['course_thumbnail_url'] as String?,
      bannerUrl: json['course_banner_url'] as String?,
      category: json['course_category'] as String?,
      level: json['course_level'] as String?,
      lessonsCount: (json['lessons_count'] as num?)?.toInt(),
      durationMinutes: (json['duration_minutes'] as num?)?.toInt(),
      ratingAverage: ratingRaw == null ? null : (ratingRaw as num).toDouble(),
      ratingCount: (json['rating_count'] as num?)?.toInt(),
      totalEnrolled: (json['total_enrolled'] as num?)?.toInt(),
      price: (json['price'] as num?) ?? 0,
      showPrice: json['show_price'] as bool? ?? false,
    );
  }
}

extension CourseLevelLabel on Course {
  String get levelLabel {
    switch (level) {
      case 'beginner':
        return '入門';
      case 'intermediate':
        return '進階';
      case 'advanced':
        return '專業';
      default:
        return '';
    }
  }

  String get priceLabel {
    if (!showPrice) return '聯絡諮詢';
    if (price == 0) return '免費';
    return 'NT\$ ${price.toInt()}';
  }
}
