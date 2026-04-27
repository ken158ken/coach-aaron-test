import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../theme/colors.dart';
import 'admin_providers.dart';
import 'models.dart';

class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> {
  final _searchCtl = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(adminUsersProvider(_search));

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'USERS',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtl,
              decoration: InputDecoration(
                hintText: '搜尋 email / 名稱',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _searchCtl.clear();
                          setState(() => _search = '');
                        },
                      ),
              ),
              onSubmitted: (v) => setState(() => _search = v.trim()),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.gold,
              onRefresh: () async =>
                  ref.refresh(adminUsersProvider(_search).future),
              child: async.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
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
                data: (result) {
                  if (result.users.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 100),
                        Center(
                          child: Text(
                            '找不到會員',
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                    itemCount: result.users.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _UserTile(
                      user: result.users[i],
                      onTap: () => _editUser(result.users[i]),
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

  Future<void> _editUser(AdminUser user) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _EditUserSheet(user: user),
    );
    if (result == true) ref.invalidate(adminUsersProvider(_search));
  }
}

class _UserTile extends StatelessWidget {
  const _UserTile({required this.user, required this.onTap});
  final AdminUser user;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(10),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0x22C5A059)),
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.surface2,
                backgroundImage: user.avatarUrl != null
                    ? CachedNetworkImageProvider(user.avatarUrl!)
                    : null,
                child: user.avatarUrl == null
                    ? const Icon(
                        Icons.person,
                        color: AppColors.textMuted,
                        size: 18,
                      )
                    : null,
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
                            user.displayName?.isNotEmpty == true
                                ? user.displayName!
                                : user.username,
                            style: const TextStyle(
                              color: AppColors.textMain,
                              fontWeight: FontWeight.w500,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (user.isAdmin) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.gold.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'ADMIN',
                              style: TextStyle(
                                color: AppColors.gold,
                                fontSize: 9,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ],
                        if (!user.isActive) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              '已停用',
                              style: TextStyle(
                                color: AppColors.error,
                                fontSize: 9,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.email,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (user.lastLoginAt != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          '上次登入：${DateFormat('yyyy/MM/dd HH:mm').format(user.lastLoginAt!.toLocal())}',
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

class _EditUserSheet extends ConsumerStatefulWidget {
  const _EditUserSheet({required this.user});
  final AdminUser user;

  @override
  ConsumerState<_EditUserSheet> createState() => _EditUserSheetState();
}

class _EditUserSheetState extends ConsumerState<_EditUserSheet> {
  late final TextEditingController _displayName;
  late bool _isActive;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _displayName = TextEditingController(text: widget.user.displayName ?? '');
    _isActive = widget.user.isActive;
  }

  @override
  void dispose() {
    _displayName.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(adminRepoProvider).updateUser(
            widget.user.id,
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
              Text(
                '編輯：${widget.user.email}',
                style: const TextStyle(
                  color: AppColors.textMain,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _displayName,
                decoration: const InputDecoration(
                  labelText: '顯示名稱',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('啟用中'),
                subtitle: Text(
                  _isActive ? '可登入' : '已封鎖',
                  style: const TextStyle(color: AppColors.textMuted),
                ),
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
                    : const Text('儲存'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
