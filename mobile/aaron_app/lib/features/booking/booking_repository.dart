import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import 'models.dart';

class BookingRepository {
  BookingRepository(this._api);
  final ApiClient _api;

  /// from / to 為 YYYY-MM-DD，後端用教練時區（Asia/Taipei）解
  Future<List<AvailableSlot>> getSlots({
    required DateTime from,
    required DateTime to,
  }) async {
    final f = DateFormat('yyyy-MM-dd');
    final res = await _api.get<dynamic>(
      '/api/bookings/slots',
      query: {'from': f.format(from), 'to': f.format(to)},
    );
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => AvailableSlot.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<void> create({
    required DateTime startUtc,
    required DateTime endUtc,
    int? courseId,
    String? userNote,
    String? contactEmail,
    String? contactPhone,
  }) async {
    await _api.post<dynamic>(
      '/api/bookings',
      body: {
        'startAt': startUtc.toUtc().toIso8601String(),
        'endAt': endUtc.toUtc().toIso8601String(),
        if (courseId != null) 'courseId': courseId,
        if (userNote != null && userNote.isNotEmpty) 'userNote': userNote,
        if (contactEmail != null && contactEmail.isNotEmpty)
          'contactEmail': contactEmail,
        if (contactPhone != null && contactPhone.isNotEmpty)
          'contactPhone': contactPhone,
      },
    );
  }

  Future<List<MyBooking>> getMine() async {
    final res = await _api.get<dynamic>('/api/bookings/mine');
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => MyBooking.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<void> cancel(String bookingId) async {
    await _api.post<dynamic>('/api/bookings/$bookingId/cancel');
  }
}
