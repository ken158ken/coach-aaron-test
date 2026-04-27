# Aaron 教練 — 行動版

兩個獨立的 Flutter 專案，都只打 Android。後端共用網頁版那一套（Express + Supabase），不另外開後端。

```
mobile/
├── aaron_webview/   # 把網站包進 WebView 殼裡，最快上線
└── aaron_app/       # 真正用 Flutter 寫 UI，會員端體驗最好
```

---

## 共同前置作業

只要做一次：

1. 確認 Flutter 環境：
   ```powershell
   flutter doctor
   ```
   出現 `[√] Android toolchain` 即可。`Visual Studio` 那條可以忽略（那是做 Windows desktop app 才需要）。

2. **接電腦的 Android 手機**（USB 偵錯模式）或開 Android 模擬器：
   ```powershell
   flutter devices
   ```
   看到 `Android` 那行就 OK。

3. 沒有實機？在 Android Studio 開 **Tools → Device Manager → Create Virtual Device**，選 Pixel 系列 + API 34 即可。

---

## A. WebView 版（`aaron_webview`）

**用途**：網站的 Android 殼，所有功能都直接走網頁。最快、最完整。

```powershell
cd mobile/aaron_webview
flutter pub get
flutter run               # debug 模式跑在手機/模擬器
```

**自訂網址**（不指定就用預設 `https://coach-aaron-redesign.vercel.app`）：

```powershell
flutter run --dart-define=APP_URL=https://你的網址
```

**打 APK**（給朋友安裝測試）：

```powershell
flutter build apk --release
# 完成後 APK 在 build/app/outputs/flutter-apk/app-release.apk
```

把那個 `.apk` 傳給對方，對方手機開啟「允許安裝未知來源」就能裝。

### 已實作

- WebView 載入網站
- 攔 `mailto:` / `tel:` / 第三方 https 改用系統瀏覽器
- 聊天 `<input type=file>` 接 image_picker（傳圖、改頭像都吃這個）
- Android 返回鍵：能上一頁就上一頁，否則退出
- User-Agent 加 `AaronApp/WebView`，前端可以判斷

### 還沒做（之後 Phase 0 處理）

- FCM 推播：WebView 殼裡 service worker 不能像瀏覽器持續收推播，要在 Flutter 端整合 firebase_messaging，把 FCM token 丟給後端 `push_subscriptions`。

---

## B. Native 版（`aaron_app`）

**用途**：真寫 Flutter UI 的版本，會員體驗最佳。

```powershell
cd mobile/aaron_app
flutter pub get
flutter run
```

**完整的 dart-define 範例**（聊天 Realtime 用 SUPABASE_ANON_KEY；缺它聊天會 fallback polling）：

```powershell
flutter run `
  --dart-define=API_URL=https://coach-aaron-redesign.vercel.app `
  --dart-define=SUPABASE_URL=https://nalerberllvvbalfmadf.supabase.co `
  --dart-define=SUPABASE_ANON_KEY=你的_supabase_anon_key
```

> 想偷懶可以建一個 `run.bat` 包起來。Supabase anon key 在 Supabase dashboard → Project Settings → API。

### 已實作的模組

| 模組 | 路由 | 對應後端 API |
|---|---|---|
| 登入 | `/login` | POST `/api/auth/login` |
| 首頁（按角色顯示卡片）| `/` | GET `/api/auth/me` |
| 課程列表 + 詳情 | `/courses`、`/courses/:id` | `/api/courses` |
| 文章列表 + 詳情（HTML 渲染） | `/articles`、`/articles/:idOrSlug` | `/api/articles` |
| 影片（grid + 開外部 app） | `/videos` | `/api/videos` |
| 預約諮詢（日曆 + slot 選擇） | `/booking` | `/api/bookings/slots` + POST `/api/bookings` |
| 我的預約（含取消） | `/my-bookings` | `/api/bookings/mine` |
| 通知中心（含鈴鐺 + 30 秒輪詢未讀） | `/notifications` | `/api/notifications` |
| 聊天（DM + 群組 + 圖片 + Realtime） | `/chat`、`/chat/:id` | `/api/chat/*` + Supabase channel `conv-{id}` |
| Admin Dashboard | `/admin` | `/api/admin/stats` |
| Admin 會員管理 | `/admin/users` | `/api/admin/users` |
| Admin 白名單管理 | `/admin/whitelist` | `/api/admin/whitelist` |

### 不會做的後台頁

`/admin/content`、`/admin/articles` 編輯器、`/admin/courses` 編輯器、`/admin/landing-pages/*`、`LandingPageViewer`（純內容編輯，手機改太刁）。

### 架構速覽

```
lib/
├── main.dart              # ProviderScope + Firebase + Supabase init
├── app/{app,router}.dart  # MaterialApp.router + go_router 守衛
├── core/
│   ├── env.dart           # API_URL / SUPABASE_* （dart-define 覆蓋）
│   ├── api_client.dart    # Dio + JWT 攔截器
│   └── auth_storage.dart  # SharedPreferences 存 token
├── theme/                 # 對齊 frontend 的 luxe 主題
└── features/
    ├── auth/              # 登入 + AppUser 含 isAdmin
    ├── courses/           # 列表 + 詳情（flutter_html）
    ├── articles/          # 列表 + 詳情（flutter_html）
    ├── videos/            # grid + 點擊用 url_launcher 開外部
    ├── booking/           # 日曆條 / slot grid / 表單 sheet / 我的預約
    ├── notifications/     # 列表 / 鈴鐺 / 30s 輪詢未讀
    ├── chat/              # 對話列表 / thread / 傳圖 / Supabase realtime
    └── admin/             # dashboard / users / whitelist
```

---

## FCM 推播：你還要做的三件事

程式碼層全部接好了：
- ✅ 後端 `notifications.ts` 同時支援 web-push 與 FCM，撈 subscriptions 後依 `provider` 分流送
- ✅ 後端 `/api/notifications/push/subscribe` 接受 `{provider: 'fcm', token}` 變體
- ✅ Native app 啟動 + 登入後自動 POST FCM token 給後端，token 輪換時也會重註冊
- ✅ 兩個 app 的 gradle / pubspec 都加好 firebase_core + firebase_messaging
- ✅ `database/migrations/020_push_provider_fcm.sql` 已寫好

**剩下你手動做的：**

### 1. 在 Supabase 跑 migration 020

打開 Supabase dashboard → SQL Editor，把 `database/migrations/020_push_provider_fcm.sql` 整個檔案貼進去執行。會做這幾件事：
- `push_subscriptions` 加 `provider` 欄位（'web' / 'fcm'）
- `p256dh` / `auth` 改可空（FCM 不需要這兩個 key）
- 加個 provider 上的 index

### 2. 把 service account JSON 設進 Vercel 環境變數

```
變數名：FCM_SERVICE_ACCOUNT_JSON
值：    <把 coach-aaron-app-firebase-adminsdk-*.json 整個檔案內容貼進去（含大括號）>
```

操作步驟：
1. 開 [Vercel dashboard](https://vercel.com/) → 找你的 backend project（不是 frontend，是 API 那個）
2. Settings → Environment Variables
3. 新增 `FCM_SERVICE_ACCOUNT_JSON`，把那份 JSON 整個貼進「Value」欄
4. 環境選 **Production + Preview + Development** 全勾
5. 儲存

> JSON 是私鑰，**不能 push 到 git**。`.gitignore` 已經幫你加保護了。

### 3. 重新部署後端

Vercel 會自動偵測 push，但設環境變數不會自動重 deploy。手動：
1. Vercel dashboard → Deployments → 找最新一筆 → 三點選單 → Redeploy
2. 或者 push 任何 commit 觸發

部署後，Vercel function 啟動時會看到 log：`FCM 初始化失敗` 還是沒訊息（沒訊息代表成功）。

### 4. 驗證

1. 把 native app 跑起來、登入
2. log 應該看到 `[FCM] token 已註冊到後端 (...)`
3. 從另一台裝置（或網頁版）傳一則訊息給自己
4. 手機應該跳系統通知

如果跳不出來：
- Supabase `push_subscriptions` 表查 `provider='fcm'` 那筆，確認 endpoint 是個 ~150 char 的字串（FCM token 長相）
- Vercel function logs 看 createNotification 那邊有沒有 FCM 錯誤
- 確認 Android 有給通知權限（設定 → app → 通知）

### WebView 版的限制

WebView 殼子的 main.dart 會呼叫 `getToken()` 但**不會自動 POST 給後端**，因為 WebView shell 不知道用戶登入身份（用戶是在網頁裡登入的）。

要讓 WebView 版也能收 FCM 推播，需要做個 JS bridge：
1. WebView 載入完成後 inject `window.__AARON_APP = { fcmToken: '...' }`
2. 前端 `frontend/src/services/pushSubscription.service.ts` 偵測到這個變數時，用網頁的 auth 把 token POST 給 `/api/notifications/push/subscribe` with `provider: 'fcm'`

這個小改動之後再做，目前 WebView 版用戶就用網頁的 web-push（在 PWA 裝到主畫面後可以收）。

---

## 常見問題

**Q：`flutter run` 找不到 device？**
插實機要打開「USB 偵錯」（設定 → 關於本機 → 連按版本號 7 次解開開發人員模式）。模擬器要先在 Android Studio 啟動。

**Q：跑起來白屏 / 連不到後端？**
看 `flutter run` 的 console，會印 `[API ...]` 之類的錯誤；通常是後端沒部署、API URL 寫錯，或 Vercel 那邊環境變數還沒修（特別是 `VITE_SUPABASE_ANON_KEY` 那個 typo 一定要先解掉）。

**Q：APK 多大？**
WebView 版約 25–30 MB，Native 版打完之後預計 35–45 MB。release build 比 debug 小一半。
