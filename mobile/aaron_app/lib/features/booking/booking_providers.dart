import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'booking_repository.dart';
import 'models.dart';

final bookingRepoProvider = Provider<BookingRepository>(
  (ref) => BookingRepository(ref.watch(apiClientProvider)),
);

/// 用 family 帶兩個日期區間（鍵 = 'from|to'，內部解析）
final slotsProvider = FutureProvider.family<List<AvailableSlot>, String>(
  (ref, key) async {
    final parts = key.split('|');
    final from = DateTime.parse(parts[0]);
    final to = DateTime.parse(parts[1]);
    return ref.watch(bookingRepoProvider).getSlots(from: from, to: to);
  },
);

final myBookingsProvider = FutureProvider<List<MyBooking>>((ref) {
  return ref.watch(bookingRepoProvider).getMine();
});
