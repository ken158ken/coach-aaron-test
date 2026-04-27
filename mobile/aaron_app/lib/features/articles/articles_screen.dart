import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../theme/colors.dart';
import 'articles_providers.dart';
import 'models.dart';

class ArticlesScreen extends ConsumerWidget {
  const ArticlesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(articlesListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'ARTICLES',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(articlesListProvider.future),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
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
              const SizedBox(height: 16),
              Center(
                child: OutlinedButton(
                  onPressed: () => ref.invalidate(articlesListProvider),
                  child: const Text('重試'),
                ),
              ),
            ],
          ),
          data: (articles) {
            if (articles.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Icon(
                    Icons.article_outlined,
                    size: 64,
                    color: AppColors.textMuted,
                  ),
                  SizedBox(height: 12),
                  Center(
                    child: Text(
                      '還沒有發佈的文章',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: articles.length,
              separatorBuilder: (_, _) => const SizedBox(height: 14),
              itemBuilder: (_, i) => _ArticleCard(article: articles[i]),
            );
          },
        ),
      ),
    );
  }
}

class _ArticleCard extends StatelessWidget {
  const _ArticleCard({required this.article});
  final ArticleSummary article;

  @override
  Widget build(BuildContext context) {
    final identifier = article.slug ?? '${article.id}';
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/articles/$identifier'),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0x22C5A059)),
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 100,
                  height: 100,
                  child: article.thumbnailUrl != null
                      ? CachedNetworkImage(
                          imageUrl: article.thumbnailUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, _) =>
                              Container(color: AppColors.surface2),
                          errorWidget: (_, _, _) => Container(
                            color: AppColors.surface2,
                            child: const Icon(
                              Icons.article_outlined,
                              color: AppColors.textMuted,
                            ),
                          ),
                        )
                      : Container(
                          color: AppColors.surface2,
                          child: const Icon(
                            Icons.article_outlined,
                            color: AppColors.textMuted,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (article.isFeatured)
                          const Padding(
                            padding: EdgeInsets.only(right: 6),
                            child: Icon(
                              Icons.star,
                              size: 14,
                              color: AppColors.gold,
                            ),
                          ),
                        if (article.category != null &&
                            article.category!.isNotEmpty)
                          Text(
                            article.category!,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.gold,
                              letterSpacing: 1.5,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      article.title,
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppColors.textMain,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (article.description != null &&
                        article.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        article.description!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                          height: 1.5,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (article.publishedAt != null)
                          Text(
                            DateFormat('yyyy/MM/dd').format(article.publishedAt!),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted,
                            ),
                          ),
                        const Spacer(),
                        Icon(
                          Icons.visibility_outlined,
                          size: 12,
                          color: AppColors.textMuted,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '${article.viewCount}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textMuted,
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
