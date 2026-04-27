import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../theme/colors.dart';
import 'booking_providers.dart';
import 'models.dart';

class MyBookingsScreen extends ConsumerWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myBookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'MY BOOKINGS',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(myBookingsProvider.future),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 80),
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Center(child: Text('$e', textAlign: TextAlign.center)),
            ],
          ),
          data: (bookings) {
            if (bookings.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Icon(
                    Icons.calendar_today_outlined,
                    size: 64,
                    color: AppColors.textMuted,
                  ),
                  SizedBox(height: 12),
                  Center(
                    child: Text(
                      '還沒有任何預約',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: bookings.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _BookingCard(booking: bookings[i]),
            );
          },
        ),
      ),
    );
  }
}

class _BookingCard extends ConsumerStatefulWidget {
  const _BookingCard({required this.booking});
  final MyBooking booking;

  @override
  ConsumerState<_BookingCard> createState() => _BookingCardState();
}

class _BookingCardState extends ConsumerState<_BookingCard> {
  bool _busy = false;

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('取消預約？'),
        content: const Text('已確認的預約若距開始時間少於設定時數可能無法取消。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('保留'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              '取消預約',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await ref.read(bookingRepoProvider).cancel(widget.booking.id);
      ref.invalidate(myBookingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('已取消預約')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(describeApiError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Color _statusColor() {
    switch (widget.booking.status) {
      case BookingStatus.confirmed:
        return AppColors.success;
      case BookingStatus.pending:
        return AppColors.warning;
      case BookingStatus.rejected:
      case BookingStatus.cancelled:
        return AppColors.error;
      case BookingStatus.completed:
        return AppColors.info;
      case BookingStatus.unknown:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.booking;
    final localStart = b.startAt.toLocal();
    final dateText = DateFormat('yyyy/MM/dd (E)', 'zh_TW').format(localStart);
    final timeText =
        '${DateFormat('HH:mm').format(localStart)} – ${DateFormat('HH:mm').format(b.endAt.toLocal())}';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x22C5A059)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: _statusColor().withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  b.status.label,
                  style: TextStyle(
                    fontSize: 11,
                    color: _statusColor(),
                    fontWeight: FontWeight.w500,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
              const Spacer(),
              if (b.status.cancellable)
                TextButton(
                  onPressed: _busy ? null : _cancel,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(40, 32),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  child: _busy
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child:
                              CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          '取消',
                          style: TextStyle(
                            color: AppColors.error,
                            fontSize: 13,
                          ),
                        ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            dateText,
            style: const TextStyle(
              color: AppColors.textMain,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            timeText,
            style: const TextStyle(color: AppColors.gold, fontSize: 14),
          ),
          if (b.courseTitle != null && b.courseTitle!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.menu_book_outlined,
                  size: 14,
                  color: AppColors.textMuted,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    b.courseTitle!,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (b.userNote != null && b.userNote!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              '備註：${b.userNote}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
          ],
          if (b.coachNote != null && b.coachNote!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surface2,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '教練回覆：${b.coachNote}',
                style: const TextStyle(
                  color: AppColors.textMain,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
