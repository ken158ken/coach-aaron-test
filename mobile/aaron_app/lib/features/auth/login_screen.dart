import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../theme/colors.dart';
import 'auth_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authStateProvider.notifier)
          .login(_email.text.trim(), _password.text);
      if (mounted) context.go('/');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeApiError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 380),
              child: Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 24),
                    Text(
                      'Aaron',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: AppColors.gold,
                        letterSpacing: 6,
                        fontWeight: FontWeight.w300,
                      ),
                    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1),
                    const SizedBox(height: 8),
                    Text(
                      'COACH · LOGIN',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textMuted,
                        letterSpacing: 4,
                      ),
                    ),
                    const SizedBox(height: 48),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return '請輸入 email';
                        if (!v.contains('@')) return 'email 格式錯誤';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _password,
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      decoration: const InputDecoration(
                        labelText: '密碼',
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      validator: (v) =>
                          (v == null || v.isEmpty) ? '請輸入密碼' : null,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 8),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          _error!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.studioBg,
                              ),
                            )
                          : const Text('登入'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () {
                        // TODO: 註冊頁先佔位
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('註冊功能尚未實作')),
                        );
                      },
                      child: const Text('還沒帳號？註冊'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
