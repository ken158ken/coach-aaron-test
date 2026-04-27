import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../theme/colors.dart';
import 'admin_providers.dart';
import 'models.dart';

class AdminWhitelistScreen extends ConsumerWidget {
  const AdminWhitelistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(whitelistProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'WHITELIST',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context, ref),
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.studioBg,
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(whitelistProvider.future),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 60),
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AppColors.error,
              ),
              const SizedBox(height: 12),
              Center(child: Text('$e', textAlign: TextAlign.center)),
            ],
          ),
          data: (entries) {
            if (entries.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 100),
                  Center(
                    child: Text(
                      '白名單目前是空的',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
              itemCount: entries.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _WhitelistTile(
                entry: entries[i],
                onTap: () => _showEditSheet(context, ref, entries[i]),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showAddDialog(BuildContext ctx, WidgetRef ref) async {
    final result = await showModalBottomSheet<bool>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const _AddWhitelistSheet(),
    );
    if (result == true) ref.invalidate(whitelistProvider);
  }

  Future<void> _showEditSheet(
    BuildContext ctx,
    WidgetRef ref,
    WhitelistEntry entry,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _EditWhitelistSheet(entry: entry),
    );
    if (result == true) ref.invalidate(whitelistProvider);
  }
}

class _WhitelistTile extends StatelessWidget {
  const _WhitelistTile({required this.entry, required this.onTap});
  final WhitelistEntry entry;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final identifier = entry.email ?? entry.phoneNumber ?? '?';
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(10),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0x22C5A059)),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: entry.isActive
                      ? AppColors.gold.withValues(alpha: 0.15)
                      : AppColors.surface2,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(
                  Icons.shield_outlined,
                  size: 18,
                  color: entry.isActive ? AppColors.gold : AppColors.textMuted,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            entry.displayName?.isNotEmpty == true
                                ? entry.displayName!
                                : identifier,
                            style: const TextStyle(
                              color: AppColors.textMain,
                              fontWeight: FontWeight.w500,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (!entry.isActive) ...[
                          const SizedBox(width: 6),
                          const Text(
                            '(已停用)',
                            style: TextStyle(
                              color: AppColors.error,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (entry.displayName?.isNotEmpty == true)
                      Text(
                        identifier,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    if (entry.note?.isNotEmpty == true)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          entry.note!,
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textMuted,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AddWhitelistSheet extends ConsumerStatefulWidget {
  const _AddWhitelistSheet();

  @override
  ConsumerState<_AddWhitelistSheet> createState() => _AddWhitelistSheetState();
}

class _AddWhitelistSheetState extends ConsumerState<_AddWhitelistSheet> {
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

  Future<void> _save() async {
    if (_email.text.trim().isEmpty && _phone.text.trim().isEmpty) {
      setState(() => _error = '請至少填寫 email 或電話');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(adminRepoProvider).addWhitelist(
            email: _email.text.trim(),
            phoneNumber: _phone.text.trim(),
            note: _note.text.trim(),
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
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
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
              const SizedBox(height: 18),
              const Text(
                '新增白名單',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 18),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.mail_outline),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: '手機號碼',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _note,
                decoration: const InputDecoration(
                  labelText: '備註',
                  prefixIcon: Icon(Icons.notes_outlined),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 6),
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
                onPressed: _busy ? null : _save,
                child: _busy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.studioBg,
                        ),
                      )
                    : const Text('新增'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EditWhitelistSheet extends ConsumerStatefulWidget {
  const _EditWhitelistSheet({required this.entry});
  final WhitelistEntry entry;

  @override
  ConsumerState<_EditWhitelistSheet> createState() =>
      _EditWhitelistSheetState();
}

class _EditWhitelistSheetState extends ConsumerState<_EditWhitelistSheet> {
  late final TextEditingController _displayName;
  late final TextEditingController _note;
  late bool _isActive;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _displayName = TextEditingController(
      text: widget.entry.displayName ?? '',
    );
    _note = TextEditingController(text: widget.entry.note ?? '');
    _isActive = widget.entry.isActive;
  }

  @override
  void dispose() {
    _displayName.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(adminRepoProvider).updateWhitelist(
            widget.entry.id,
            note: _note.text.trim(),
            displayName: _displayName.text.trim(),
            isActive: _isActive,
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = describeApiError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('刪除白名單？'),
        content: Text(
          '${widget.entry.email ?? widget.entry.phoneNumber ?? '?'} 將被永久移除。',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              '刪除',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(adminRepoProvider).deleteWhitelist(widget.entry.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = describeApiError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final identifier = widget.entry.email ?? widget.entry.phoneNumber ?? '?';
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
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
              const SizedBox(height: 18),
              Text(
                identifier,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _displayName,
                decoration: const InputDecoration(
                  labelText: '顯示名稱（聊天時顯示給客戶看的）',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _note,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: '備註',
                  prefixIcon: Icon(Icons.notes_outlined),
                ),
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                title: const Text('啟用中'),
                value: _isActive,
                activeColor: AppColors.gold,
                onChanged: (v) => setState(() => _isActive = v),
                contentPadding: EdgeInsets.zero,
              ),
              if (_error != null) ...[
                const SizedBox(height: 6),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: AppColors.error,
                    fontSize: 13,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _busy ? null : _delete,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                      ),
                      child: const Text('刪除'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _busy ? null : _save,
                      child: _busy
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.studioBg,
                              ),
                            )
                          : const Text('儲存'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
