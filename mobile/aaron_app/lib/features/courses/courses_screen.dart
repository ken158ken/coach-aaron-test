import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../theme/colors.dart';
import 'courses_providers.dart';
import 'models.dart';

class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key});

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  String? _level; // null = 全部

  @override
  Widget build(BuildContext context) {
    final coursesAsync = ref.watch(coursesListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'COURSES',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(coursesListProvider.future),
        child: coursesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorView(
            message: '$e',
            onRetry: () => ref.invalidate(coursesListProvider),
          ),
          data: (courses) {
            if (courses.isEmpty) {
              return const _EmptyView();
            }
            final filtered = _level == null
                ? courses
                : courses.where((c) => c.level == _level).toList();
            return CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _LevelFilter(
                    selected: _level,
                    onChanged: (lv) => setState(() => _level = lv),
                  ),
                ),
                if (filtered.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: Text('找不到符合條件的課程')),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    sliver: SliverList.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: 14),
                      itemBuilder: (_, i) => _CourseCard(course: filtered[i]),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _LevelFilter extends StatelessWidget {
  const _LevelFilter({required this.selected, required this.onChanged});
  final String? selected;
  final ValueChanged<String?> onChanged;

  static const _levels = <(String?, String)>[
    (null, '全部'),
    ('beginner', '入門'),
    ('intermediate', '進階'),
    ('advanced', '專業'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _levels.map((entry) {
            final isActive = selected == entry.$1;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(entry.$2),
                selected: isActive,
                onSelected: (_) => onChanged(entry.$1),
                selectedColor: AppColors.gold.withValues(alpha: 0.2),
                backgroundColor: AppColors.surface2,
                shape: StadiumBorder(
                  side: BorderSide(
                    color: isActive ? AppColors.gold : const Color(0x22C5A059),
                  ),
                ),
                labelStyle: TextStyle(
                  color: isActive ? AppColors.gold : AppColors.textMuted,
                  letterSpacing: 1.5,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/courses/${course.id}'),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0x22C5A059)),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: course.thumbnailUrl != null
                    ? CachedNetworkImage(
                        imageUrl: course.thumbnailUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) =>
                            Container(color: AppColors.surface2),
                        errorWidget: (_, _, _) => Container(
                          color: AppColors.surface2,
                          child: const Icon(
                            Icons.image_outlined,
                            color: AppColors.textMuted,
                          ),
                        ),
                      )
                    : Container(
                        color: AppColors.surface2,
                        child: const Icon(
                          Icons.school_outlined,
                          color: AppColors.textMuted,
                          size: 32,
                        ),
                      ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        if (course.levelLabel.isNotEmpty)
                          _Chip(text: course.levelLabel),
                        if (course.category != null && course.category!.isNotEmpty)
                          _Chip(text: course.category!, dim: true),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      course.title,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textMain,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (course.description != null &&
                        course.description!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        course.description!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textMuted,
                          height: 1.5,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (course.lessonsCount != null)
                          _Meta(
                            icon: Icons.menu_book_outlined,
                            text: '${course.lessonsCount} 堂',
                          ),
                        if ((course.ratingCount ?? 0) > 0) ...[
                          const SizedBox(width: 14),
                          _Meta(
                            icon: Icons.star,
                            text:
                                '${(course.ratingAverage ?? 0).toStringAsFixed(1)}'
                                ' (${course.ratingCount})',
                          ),
                        ],
                        const Spacer(),
                        Text(
                          course.priceLabel,
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.text, this.dim = false});
  final String text;
  final bool dim;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: dim ? AppColors.surface2 : AppColors.gold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: dim ? AppColors.textMuted : AppColors.gold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
      ],
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 120),
        Icon(Icons.school_outlined, size: 64, color: AppColors.textMuted),
        SizedBox(height: 12),
        Center(
          child: Text(
            '目前沒有上架的課程',
            style: TextStyle(color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 80),
        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
        const SizedBox(height: 12),
        Center(child: Text(message, textAlign: TextAlign.center)),
        const SizedBox(height: 16),
        Center(
          child: OutlinedButton(onPressed: onRetry, child: const Text('重試')),
        ),
      ],
    );
  }
}
