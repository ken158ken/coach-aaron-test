import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/colors.dart';
import 'courses_providers.dart';
import 'models.dart';

class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.courseId});
  final int courseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(courseDetailProvider(courseId));

    return Scaffold(
      body: async.when(
        loading: () => const _Skeleton(),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 48,
                  color: AppColors.error,
                ),
                const SizedBox(height: 12),
                Text('$e', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () =>
                      ref.invalidate(courseDetailProvider(courseId)),
                  child: const Text('重試'),
                ),
              ],
            ),
          ),
        ),
        data: (course) => _CourseBody(course: course),
      ),
    );
  }
}

class _CourseBody extends StatelessWidget {
  const _CourseBody({required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    final banner = course.bannerUrl ?? course.thumbnailUrl;
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: banner != null ? 240 : 0,
          pinned: true,
          backgroundColor: AppColors.studioBg,
          flexibleSpace: banner != null
              ? FlexibleSpaceBar(
                  background: CachedNetworkImage(
                    imageUrl: banner,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(color: AppColors.surface2),
                    errorWidget: (_, _, _) =>
                        Container(color: AppColors.surface2),
                  ),
                )
              : null,
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
          sliver: SliverList.list(
            children: [
              Row(
                children: [
                  if (course.levelLabel.isNotEmpty) ...[
                    _Pill(text: course.levelLabel),
                    const SizedBox(width: 6),
                  ],
                  if (course.category != null && course.category!.isNotEmpty)
                    _Pill(text: course.category!, dim: true),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                course.title,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w400,
                  color: AppColors.textMain,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 12),
              if (course.description != null &&
                  course.description!.isNotEmpty)
                Text(
                  course.description!,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.textMuted,
                    height: 1.6,
                  ),
                ),
              const SizedBox(height: 20),
              const _Divider(),
              const SizedBox(height: 12),
              _MetaRow(course: course),
              const SizedBox(height: 20),
              if (course.content != null && course.content!.trim().isNotEmpty)
                Html(
                  data: course.content!,
                  style: {
                    'body': Style(
                      color: AppColors.textMain,
                      fontSize: FontSize(15),
                      lineHeight: const LineHeight(1.7),
                      margin: Margins.zero,
                    ),
                    'h1, h2, h3': Style(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w400,
                    ),
                    'a': Style(color: AppColors.gold),
                    'img': Style(width: Width(100, Unit.percent)),
                    'p': Style(margin: Margins.only(bottom: 12)),
                  },
                  onLinkTap: (url, _, _) async {
                    if (url == null) return;
                    final uri = Uri.tryParse(url);
                    if (uri != null && await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[];

    if (course.lessonsCount != null) {
      items.add(
        _MetaItem(
          icon: Icons.menu_book_outlined,
          label: '${course.lessonsCount} 堂',
        ),
      );
    }
    if (course.durationMinutes != null) {
      final h = course.durationMinutes! ~/ 60;
      final m = course.durationMinutes! % 60;
      items.add(
        _MetaItem(
          icon: Icons.schedule_outlined,
          label: h > 0 ? '${h}h ${m}m' : '$m 分鐘',
        ),
      );
    }
    if ((course.ratingCount ?? 0) > 0) {
      items.add(
        _MetaItem(
          icon: Icons.star,
          label:
              '${(course.ratingAverage ?? 0).toStringAsFixed(1)} '
              '(${course.ratingCount})',
        ),
      );
    }
    if (course.totalEnrolled != null) {
      items.add(
        _MetaItem(
          icon: Icons.people_outline,
          label: '${course.totalEnrolled} 人',
        ),
      );
    }

    items.add(const Spacer());
    items.add(
      Text(
        course.priceLabel,
        style: const TextStyle(
          color: AppColors.gold,
          fontWeight: FontWeight.w600,
          fontSize: 18,
        ),
      ),
    );

    return Row(children: items);
  }
}

class _MetaItem extends StatelessWidget {
  const _MetaItem({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 16),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, this.dim = false});
  final String text;
  final bool dim;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: dim ? AppColors.surface2 : AppColors.gold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: dim ? AppColors.textMuted : AppColors.gold,
          fontSize: 12,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Container(height: 0.5, color: const Color(0x22C5A059));
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}
