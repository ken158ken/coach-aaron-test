// 基本煙霧測試：app 能跑起來、不 crash
// 真實的 WebView 行為需要 integration test 或實機驗證。

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:aaron_webview/main.dart';

void main() {
  testWidgets('App boots without crash', (tester) async {
    await tester.pumpWidget(const AaronWebViewApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
