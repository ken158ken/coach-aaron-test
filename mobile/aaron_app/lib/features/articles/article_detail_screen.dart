import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/colors.dart';
import 'articles_providers.dart';
import 'models.dart';

class ArticleDetailScreen extends ConsumerWidget {
  const ArticleDetailScreen({super.key, required this.idOrSlug});
  final String idOrSlug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(articleDetailProvider(idOrSlug));

    return Scaffold(
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
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
                      ref.invalidate(articleDetailProvider(idOrSlug)),
                  child: const Text('重試'),
                ),
              ],
            ),
          ),
        ),
        data: (article) => _Body(article: article),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.article});
  final Article article;

  @override
  Widget build(BuildContext context) {
    final banner = article.bannerUrl ?? article.thumbnailUrl;
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: banner != null ? 220 : 0,
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
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 80),
          sliver: SliverList.list(
            children: [
              if (article.category != null && article.category!.isNotEmpty)
                Text(
                  article.category!,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 12,
                    letterSpacing: 2,
                  ),
                ),
              const SizedBox(height: 8),
              Text(
                article.title,
                style: const TextStyle(
                  fontSize: 24,
                  color: AppColors.textMain,
                  fontWeight: FontWeight.w500,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (article.authorName != null) ...[
                    if (article.authorAvatar != null)
                      CircleAvatar(
                        radius: 12,
                        backgroundImage: CachedNetworkImageProvider(
                          article.authorAvatar!,
                        ),
                      )
                    else
                      const CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.surface2,
                        child: Icon(
                          Icons.person,
                          size: 14,
                          color: AppColors.textMuted,
                        ),
                      ),
                    const SizedBox(width: 8),
                    Text(
                      article.authorName!,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  if (article.publishedAt != null)
                    Text(
                      DateFormat('yyyy/MM/dd').format(article.publishedAt!),
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  const Spacer(),
                  const Icon(
                    Icons.visibility_outlined,
                    size: 14,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${article.viewCount}',
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(height: 0.5, color: const Color(0x22C5A059)),
              const SizedBox(height: 16),
              if (article.description != null &&
                  article.description!.isNotEmpty)
                Text(
                  article.description!,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.textMuted,
                    height: 1.7,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              const SizedBox(height: 16),
              if (article.content != null && article.content!.trim().isNotEmpty)
                Html(
                  data: article.content!,
                  style: {
                    'body': Style(
                      color: AppColors.textMain,
                      fontSize: FontSize(15),
                      lineHeight: const LineHeight(1.75),
                      margin: Margins.zero,
                    ),
                    'h1, h2, h3': Style(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w400,
                    ),
                    'a': Style(color: AppColors.gold),
                    'img': Style(width: Width(100, Unit.percent)),
                    'p': Style(margin: Margins.only(bottom: 14)),
                    'blockquote': Style(
                      padding: HtmlPaddings.only(left: 14),
                      border: const Border(
                        left: BorderSide(color: AppColors.gold, width: 2),
                      ),
                      fontStyle: FontStyle.italic,
                      color: AppColors.textMuted,
                    ),
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
