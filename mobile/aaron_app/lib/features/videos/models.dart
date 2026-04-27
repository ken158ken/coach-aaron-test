// 對齊後端 /api/videos 回傳的 Video 結構
class VideoItem {
  final int id;
  final String title;
  final String url;
  final String type; // youtube / instagram / vimeo / tiktok / other
  final String? thumbnail;
  final int? durationSeconds;
  final String? description;

  const VideoItem({
    required this.id,
    required this.title,
    required this.url,
    required this.type,
    this.thumbnail,
    this.durationSeconds,
    this.description,
  });

  factory VideoItem.fromJson(Map<String, dynamic> json) {
    return VideoItem(
      id: (json['video_id'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? '',
      url: json['url'] as String? ?? '',
      type: json['type'] as String? ?? 'other',
      thumbnail: json['thumbnail_url'] as String? ?? json['thumbnail'] as String?,
      durationSeconds: (json['duration'] as num?)?.toInt(),
      description: json['description'] as String?,
    );
  }
}

extension VideoTypeLabel on VideoItem {
  String get typeLabel {
    switch (type) {
      case 'youtube':
        return 'YouTube';
      case 'instagram':
        return 'Instagram';
      case 'vimeo':
        return 'Vimeo';
      case 'tiktok':
        return 'TikTok';
      default:
        return '影片';
    }
  }

  String? get durationLabel {
    if (durationSeconds == null) return null;
    final m = durationSeconds! ~/ 60;
    final s = durationSeconds! % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
