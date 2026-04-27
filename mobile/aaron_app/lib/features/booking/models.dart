// 對應後端 utils/slots.ts 的 AvailableSlot
class AvailableSlot {
  final DateTime startUtc;
  final DateTime endUtc;
  final String localDate; // YYYY-MM-DD（教練時區，鎖 Asia/Taipei）
  final String localTime; // HH:mm

  const AvailableSlot({
    required this.startUtc,
    required this.endUtc,
    required this.localDate,
    required this.localTime,
  });

  factory AvailableSlot.fromJson(Map<String, dynamic> json) {
    return AvailableSlot(
      startUtc: DateTime.parse(json['startIso'] as String).toUtc(),
      endUtc: DateTime.parse(json['endIso'] as String).toUtc(),
      localDate: json['localDate'] as String? ?? '',
      localTime: json['localTime'] as String? ?? '',
    );
  }
}

enum BookingStatus { pending, confirmed, rejected, cancelled, completed, unknown }

BookingStatus _parseStatus(String? raw) {
  switch (raw) {
    case 'pending':
      return BookingStatus.pending;
    case 'confirmed':
      return BookingStatus.confirmed;
    case 'rejected':
      return BookingStatus.rejected;
    case 'cancelled':
      return BookingStatus.cancelled;
    case 'completed':
      return BookingStatus.completed;
    default:
      return BookingStatus.unknown;
  }
}

class MyBooking {
  final String id;
  final DateTime startAt;
  final DateTime endAt;
  final BookingStatus status;
  final String? userNote;
  final String? coachNote;
  final String? contactEmail;
  final String? contactPhone;
  final DateTime? confirmedAt;
  final DateTime? cancelledAt;
  final DateTime? rejectedAt;
  final String? cancelledBy; // 'user' | 'coach'
  final String? courseTitle;
  final String? courseThumbnailUrl;

  const MyBooking({
    required this.id,
    required this.startAt,
    required this.endAt,
    required this.status,
    this.userNote,
    this.coachNote,
    this.contactEmail,
    this.contactPhone,
    this.confirmedAt,
    this.cancelledAt,
    this.rejectedAt,
    this.cancelledBy,
    this.courseTitle,
    this.courseThumbnailUrl,
  });

  factory MyBooking.fromJson(Map<String, dynamic> json) {
    final course = json['course'];
    return MyBooking(
      id: '${json['id']}',
      startAt: DateTime.parse(json['start_at'] as String),
      endAt: DateTime.parse(json['end_at'] as String),
      status: _parseStatus(json['status'] as String?),
      userNote: json['user_note'] as String?,
      coachNote: json['coach_note'] as String?,
      contactEmail: json['contact_email'] as String?,
      contactPhone: json['contact_phone'] as String?,
      confirmedAt: _maybeDate(json['confirmed_at']),
      cancelledAt: _maybeDate(json['cancelled_at']),
      rejectedAt: _maybeDate(json['rejected_at']),
      cancelledBy: json['cancelled_by'] as String?,
      courseTitle: course is Map ? course['course_title'] as String? : null,
      courseThumbnailUrl:
          course is Map ? course['course_thumbnail_url'] as String? : null,
    );
  }

  static DateTime? _maybeDate(Object? raw) {
    if (raw is String) return DateTime.tryParse(raw);
    return null;
  }
}

extension BookingStatusLabel on BookingStatus {
  String get label {
    switch (this) {
      case BookingStatus.pending:
        return '待審核';
      case BookingStatus.confirmed:
        return '已確認';
      case BookingStatus.rejected:
        return '已婉拒';
      case BookingStatus.cancelled:
        return '已取消';
      case BookingStatus.completed:
        return '已完成';
      case BookingStatus.unknown:
        return '未知';
    }
  }

  bool get cancellable =>
      this == BookingStatus.pending || this == BookingStatus.confirmed;
}
