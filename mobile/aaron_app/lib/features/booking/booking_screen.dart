import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../theme/colors.dart';
import 'booking_providers.dart';
import 'models.dart';

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
  }

  String get _slotsKey {
    final f = DateFormat('yyyy-MM-dd');
    final to = _selectedDate.add(const Duration(days: 1));
    return '${f.format(_selectedDate)}|${f.format(to)}';
  }

  @override
  Widget build(BuildContext context) {
    final slotsAsync = ref.watch(slotsProvider(_slotsKey));

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'BOOKING',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.event_available_outlined),
            tooltip: '我的預約',
            onPressed: () => context.push('/my-bookings'),
          ),
        ],
      ),
      body: Column(
        children: [
          _DateStrip(
            selected: _selectedDate,
            onChanged: (d) => setState(() => _selectedDate = d),
          ),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.gold,
              onRefresh: () async =>
                  ref.refresh(slotsProvider(_slotsKey).future),
              child: slotsAsync.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(24),
                  children: [
                    const SizedBox(height: 80),
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: 12),
                    Center(child: Text('$e', textAlign: TextAlign.center)),
                  ],
                ),
                data: (slots) {
                  if (slots.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 100),
                        Icon(
                          Icons.event_busy_outlined,
                          size: 48,
                          color: AppColors.textMuted,
                        ),
                        SizedBox(height: 12),
                        Center(
                          child: Text(
                            '這天沒有可預約的時段',
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    );
                  }
                  return GridView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 2.2,
                        ),
                    itemCount: slots.length,
                    itemBuilder: (_, i) => _SlotChip(
                      slot: slots[i],
                      onTap: () => _openBookingForm(slots[i]),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openBookingForm(AvailableSlot slot) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _BookingFormSheet(slot: slot),
    );
    if (ok == true && mounted) {
      ref.invalidate(slotsProvider(_slotsKey));
      ref.invalidate(myBookingsProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已送出預約，等候教練確認')),
      );
    }
  }
}

class _DateStrip extends StatelessWidget {
  const _DateStrip({required this.selected, required this.onChanged});

  final DateTime selected;
  final ValueChanged<DateTime> onChanged;

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day);

    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        itemCount: 30,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final date = start.add(Duration(days: i));
          final isSelected = _isSameDay(date, selected);
          return Material(
            color: isSelected ? AppColors.gold : AppColors.surface2,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              onTap: () => onChanged(date),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 56,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isSelected
                        ? AppColors.gold
                        : const Color(0x22C5A059),
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      DateFormat('E', 'zh_TW').format(date),
                      style: TextStyle(
                        fontSize: 11,
                        color: isSelected
                            ? AppColors.studioBg
                            : AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${date.day}',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                        color: isSelected
                            ? AppColors.studioBg
                            : AppColors.textMain,
                      ),
                    ),
                    Text(
                      DateFormat('M月').format(date),
                      style: TextStyle(
                        fontSize: 10,
                        color: isSelected
                            ? AppColors.studioBg
                            : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

class _SlotChip extends StatelessWidget {
  const _SlotChip({required this.slot, required this.onTap});
  final AvailableSlot slot;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            slot.localTime,
            style: const TextStyle(
              color: AppColors.gold,
              fontWeight: FontWeight.w500,
              fontSize: 15,
            ),
          ),
        ),
      ),
    );
  }
}

class _BookingFormSheet extends ConsumerStatefulWidget {
  const _BookingFormSheet({required this.slot});
  final AvailableSlot slot;

  @override
  ConsumerState<_BookingFormSheet> createState() => _BookingFormSheetState();
}

class _BookingFormSheetState extends ConsumerState<_BookingFormSheet> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _note = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _phone.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_email.text.trim().isEmpty && _phone.text.trim().isEmpty) {
      setState(() => _error = '請至少填寫 email 或電話一項');
      return;
    }
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await ref.read(bookingRepoProvider).create(
            startUtc: widget.slot.startUtc,
            endUtc: widget.slot.endUtc,
            userNote: _note.text.trim(),
            contactEmail: _email.text.trim(),
            contactPhone: _phone.text.trim(),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = describeApiError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel =
        '${widget.slot.localDate}  ${widget.slot.localTime}';
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Form(
            key: _form,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.textMuted.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  '預約時段',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  dateLabel,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 22,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email（選填）',
                    prefixIcon: Icon(Icons.mail_outline),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return null;
                    if (!v.contains('@')) return 'email 格式錯誤';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: '電話（選填）',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _note,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: '備註（如目標、需求）',
                    prefixIcon: Icon(Icons.notes_outlined),
                    alignLabelWithHint: true,
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: const TextStyle(
                      color: AppColors.error,
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.studioBg,
                          ),
                        )
                      : const Text('送出預約'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
