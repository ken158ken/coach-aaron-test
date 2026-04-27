// Aaron 教練 WebView shell
//
// 這個 app 只是個「容器」：把已經做好的網站塞進 WebView 顯示。
// 處理的事情有：
//   1. WebView 載入主站
//   2. 攔截外部 URL（mailto / tel / 第三方網域）改用系統瀏覽器開
//   3. 接 <input type="file"> → 開系統相簿/相機讓使用者選圖
//   4. 實體返回鍵：能上一頁就上一頁，否則離開 app

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

// Build 時可以用 --dart-define=APP_URL=https://xxx 覆蓋
const String _kAppUrl = String.fromEnvironment(
  'APP_URL',
  defaultValue: 'https://coach-aaron-redesign.vercel.app',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase（推播用）— 缺 google-services.json 時不會 crash，只是不能收推播
  try {
    await Firebase.initializeApp();
    // 申請通知權限（Android 13+ 需要）
    await FirebaseMessaging.instance.requestPermission();
    if (kDebugMode) {
      final token = await FirebaseMessaging.instance.getToken();
      debugPrint('[FCM] token = $token');
    }
    // TODO Phase 0：把 token POST 給後端 /api/notifications/push/subscribe
    //                 （要等後端加 provider='fcm' 分支）
  } catch (e) {
    if (kDebugMode) debugPrint('Firebase init 失敗（推播暫不可用）: $e');
  }
  runApp(const AaronWebViewApp());
}

class AaronWebViewApp extends StatelessWidget {
  const AaronWebViewApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aaron WebView',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFC9A961),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0E0E0E),
      ),
      home: const WebShellPage(),
    );
  }
}

class WebShellPage extends StatefulWidget {
  const WebShellPage({super.key});

  @override
  State<WebShellPage> createState() => _WebShellPageState();
}

class _WebShellPageState extends State<WebShellPage> {
  late final WebViewController _controller;
  bool _loading = true;
  int _progress = 0;

  @override
  void initState() {
    super.initState();
    _controller = _buildController();
  }

  WebViewController _buildController() {
    final params = AndroidWebViewControllerCreationParams();
    final controller = WebViewController.fromPlatformCreationParams(params);

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0E0E0E))
      ..setUserAgent(
        // 加自訂標記，網站端可以 navigator.userAgent.includes('AaronApp') 偵測
        'Mozilla/5.0 (Linux; Android) AaronApp/WebView',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (p) => setState(() => _progress = p),
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (e) {
            if (kDebugMode) {
              debugPrint('WebView 錯誤: ${e.description} (${e.errorCode})');
            }
          },
          onNavigationRequest: (req) async {
            final uri = Uri.tryParse(req.url);
            if (uri == null) return NavigationDecision.prevent;

            final isExternalScheme = uri.scheme == 'mailto' ||
                uri.scheme == 'tel' ||
                uri.scheme == 'sms' ||
                uri.scheme == 'whatsapp' ||
                uri.scheme == 'line';
            if (isExternalScheme) {
              await _openExternal(uri);
              return NavigationDecision.prevent;
            }

            // 第三方 https 網域用瀏覽器開（避免 OAuth 跳轉迴圈、X-Frame 擋）
            if (uri.scheme.startsWith('http') && !_isInsideMyApp(uri)) {
              await _openExternal(uri);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(_kAppUrl));

    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(kDebugMode);
      final android = controller.platform as AndroidWebViewController;
      android.setOnShowFileSelector(_onShowFileSelector);
      android.setMediaPlaybackRequiresUserGesture(false);
    }

    return controller;
  }

  bool _isInsideMyApp(Uri uri) {
    final host = uri.host;
    if (host.isEmpty) return true;
    final appHost = Uri.parse(_kAppUrl).host;
    return host == appHost ||
        host.endsWith('.vercel.app'); // 同站 + 任何 Vercel preview
  }

  Future<void> _openExternal(Uri uri) async {
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('無法開啟連結：$uri')),
      );
    }
  }

  Future<List<String>> _onShowFileSelector(FileSelectorParams params) async {
    try {
      final picker = ImagePicker();
      if (params.mode == FileSelectorMode.openMultiple) {
        final files = await picker.pickMultiImage(imageQuality: 85);
        return files.map((f) => Uri.file(f.path).toString()).toList();
      } else {
        final f = await picker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 85,
        );
        if (f == null) return const <String>[];
        return [Uri.file(f.path).toString()];
      }
    } catch (e) {
      debugPrint('檔案選擇器錯誤: $e');
      return const <String>[];
    }
  }

  Future<bool> _handleBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldExit = await _handleBack();
        if (shouldExit) {
          await SystemNavigator.pop();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_loading)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _progress > 0 ? _progress / 100 : null,
                    minHeight: 2,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFFC9A961),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
