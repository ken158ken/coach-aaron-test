// 基本煙霧測試
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:aaron_app/app/app.dart';

void main() {
  testWidgets('App boots without crash', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: AaronApp()));
    // 啟動後 router 會把使用者導去 /login（沒登入），檢查 MaterialApp 存在即可
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
