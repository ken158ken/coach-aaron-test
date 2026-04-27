import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/colors.dart';
import 'models.dart';
import 'videos_providers.dart';

class VideosScreen extends ConsumerWidget {
  const VideosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(videosListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'VIDEOS',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(videosListProvider.future),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorView(
            message: '$e',
            onRetry: () => ref.invalidate(videosListProvider),
          ),
          data: (videos) {
            if (videos.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Icon(
                    Icons.video_library_outlined,
                    size: 64,
                    color: AppColors.textMuted,
                  ),
                  SizedBox(height: 12),
                  Center(
                    child: Text(
                      '還沒有影片',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              );
            }
            return GridView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.78,
              ),
              itemCount: videos.length,
              itemBuilder: (_, i) => _VideoCard(video: videos[i]),
            );
          },
        ),
      ),
    );
  }
}

class _VideoCard extends StatelessWidget {
  const _VideoCard({required this.video});
  final VideoItem video;

  Future<void> _open(BuildContext context) async {
    final uri = Uri.tryParse(video.url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('無法開啟此影片連結')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _open(context),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0x22C5A059)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (video.thumbnail != null)
                      CachedNetworkImage(
                        imageUrl: video.thumbnail!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) =>
                            Container(color: AppColors.surface2),
                        errorWidget: (_, _, _) =>
                            Container(color: AppColors.surface2),
                      )
                    else
                      Container(color: AppColors.surface2),
                    // 中央播放按鈕
                    Center(
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.55),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.play_arrow,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                    // 平台標籤
                    Positioned(
                      top: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          video.typeLabel,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ),
                    if (video.durationLabel != null)
                      Positioned(
                        bottom: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            video.durationLabel!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      video.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textMain,
                        height: 1.4,
                      ),
                    ),
                    if (video.description != null &&
                        video.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        video.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
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
