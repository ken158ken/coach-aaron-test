# Google 行事曆整合 — 功能研究報告

> 日期：2026-07-22　情境：Aaron 教練一對一預約平台（純 B2B、自建預約系統、會員未來用 Google 登入）
> 來源：Google 官方文件為主，第三方數字皆標註。政策/配額會變動，導入前以官方頁最新值為準。

---

## 0. 結論先講 + 最值得做的前三名

**現況**：教練連自己的 Google 日曆 → 預約核准時在教練日曆建事件（會員為 attendee）→ freebusy 查教練忙碌。剛加上 `sendUpdates:'all'` + 自訂提醒（路線 A，已上線）→ 會員自動收到邀請、事件進他自己的日曆、有提醒，**無需會員 OAuth token**。

**投報率前三名（建議依序）**：
1. **✅ 路線 A（已做）** — attendee + sendUpdates + 提醒。零 token 成本，立即讓會員端有預約+提醒。
2. **🟢 自動 Google Meet 連結**（`conferenceData`）— 線上諮詢自動附視訊連結，改動小、體感高，免費 Gmail 也能用（只要用 Calendar API 建，不是 Meet REST API）。
3. **🟢 用 `extendedProperties` 存 `booking_id`** — 把事件與你 DB 的 booking 綁定，之後同步/對帳/去重都靠它，成本極低。

**先不急**：會員端 OAuth（讀會員自己行程）、即時同步 webhook —— 有明確需求再做（見下）。

---

## 1. 事件層級進階功能

### Google Meet 自動連結
- `events.insert` 帶 URL 參數 `conferenceDataVersion=1` + body `conferenceData.createRequest`（`requestId` 每事件唯一、`conferenceSolutionKey.type='hangoutsMeet'`）。
- 會議非同步建立：回應 `status.statusCode` 可能先 `pending` 再 `success`，連結在 `conferenceData.entryPoints`。
- ⚠️ 不帶 `conferenceDataVersion=1` 則 conferenceData 不會被保存。
- 免費 Gmail 可用（用 Calendar API 建含 Meet 的事件）；**Meet REST API 直接建會議室才需付費 Workspace**。

### 提醒 reminders（路線 A 已用）
- `reminders.useDefault=false` + `overrides[]`（`method: email|popup`, `minutes`）。
- **上限：每事件最多 5 個 override；minutes 範圍 0–40320（最早 4 週前）**。

### 定期／重複事件 recurrence（固定週課）
- `recurrence` 為字串陣列（RFC5545：RRULE/EXDATE…），例 `RRULE:FREQ=WEEKLY;COUNT=10`；start/end 必帶 `timeZone`。
- 讀實例：`events.list` 預設不展開；`singleEvents=true` 回個別實例；`events.instances()` 列某重複事件全部實例。
- 改單次＝更新該 instance（成為例外）；改「此後全部」＝先用 UNTIL/COUNT 截短舊的、再建新的。

### Attendee 進階
- `responseStatus`：needsAction / accepted / declined / tentative（可讀會員是否接受）。
- 賓客權限（預設）：`guestsCanModify`=false、`guestsCanInviteOthers`=true、`guestsCanSeeOtherGuests`=true；`optional`、`additionalGuests`。
- 實務上單事件約 200 位 attendee 為操作上限（超過回覆狀態不傳播）；一對一用不到。

### 事件 Metadata
- `colorId`（約 11 種事件色，用 `colors.get` 動態讀）、`visibility`（default/public/private/confidential）、`transparency`（opaque=佔忙〔預設〕/ transparent=不佔忙）。
- **`extendedProperties`（存 booking_id 首選）**：`private`（僅自己可見，建議）/`shared`。上限：每事件 300 組、總 32kB、key≤44 字元、value≤1024 字元（超過靜默截斷）。

**速查表**

| 項目 | 限制 |
|---|---|
| Meet | 必帶 `conferenceDataVersion=1` |
| reminders overrides | ≤ 5 / 事件；minutes 0–40320；method email/popup |
| extendedProperties | ≤300 組、32kB、key≤44、value≤1024 |
| event colorId | ~11 種 |

---

## 2. 可用性／排程

### freebusy.query（已用於教練端）
- 回傳純忙碌區間、**不含事件細節**（隱私設計）。
- 上限：一次最多 50 個日曆（`calendarExpansionMax`）、群組展開 100（`groupExpansionMax`）—— 一對一情境用不到。

### Google 內建 Appointment Schedules（預約頁）
- **關鍵：沒有官方 API**，無法程式化建立/讀取，只能在 Google 日曆 UI 手動用。
- 免費帳號可建 1 個預約頁；多預約頁、Stripe 收款、自動提醒、email 驗證等 premium 功能需 Workspace Business/Enterprise。
- **對本專案**：要嵌自家網站 + 客製 + 金流 → 只能自建（freebusy + events.insert）。Appointment Schedules 只適合「教練手動分享一個連結」的低成本方案，無法整合進你的系統。

### 特殊事件類型 eventType
- `outOfOffice`（請假，佔忙）、`focusTime`（專注，佔忙）、`workingLocation`（工作地點，不佔忙，可全天單日）。
- 可透過 API 建/讀/列/watch，但**僅限 primary calendar、eventType 不可改、不可搬移**，可用性依帳號/Workspace 版本。
- 用途：教練標請假/專注時段，freebusy 自動反映為忙 → 預約自動避開。

---

## 3. 即時同步（教練手動改動 → 系統同步）

- **events.watch + webhook**：對日曆的 events 建 notification channel（`type:web_hook`、HTTPS + 有效 SSL 的 `address`）。通知 **body 為空、只給 headers**（`X-Goog-Resource-State`：`sync` 忽略／`exists` 有變更）→ 收到後再拉資料。
- **channel 無自動續期**，`ttl` 預設 7 天，需自排 cron 用**新 id** 重建、再 `channels.stop` 舊的。（第三方稱最大約 30 天，官方未明文，以 7 天為安全值。）
- **syncToken 增量同步**：full sync 存 `nextSyncToken` → 之後帶 `syncToken` 只取變更（含被刪的 cancelled 事件）。`singleEvents` 等 query 要**全程固定**（不一致回 400）；token 失效回 **410 GONE** → 清空重跑 full sync。
- 建議：watch 觸發 + syncToken 拉增量 + 一個低頻 polling（5–15 分）當保底。
- **投報率**：教練不常手動改日曆的話，這套可延後；先靠「你的系統是唯一寫入來源」即可。

---

## 4. OAuth 驗證政策（重要，且修正我先前的說法）

**修正**：我先前說 calendar 是「敏感 scope 要驗證」正確，但要澄清一個常見誤解——

> **Calendar 的所有 scope 都是 sensitive 或 non-sensitive，「不是 restricted」。** restricted 只涵蓋 Gmail/Drive/Fit/Chat/Photos/Health 等。**所以 Calendar 不需要 CASA 第三方安全評估、沒有那筆數千～數萬美元費用、也沒有每年重評。** 網路上把 calendar.events 說成「restricted、要安全評估」是錯的。

- **分級**：
  - Non-sensitive（免驗證）：`calendar.freebusy`、`calendar.events.public.readonly`、**`calendar.app.created`**（只能存取「app 自己建立的日曆/活動」，2024 新增，專為避開 sensitive 設計）。
  - Sensitive（需一次性驗證）：`calendar`、`calendar.readonly`、`calendar.events`、`calendar.events.owned` 等（碰使用者既有活動）。
- **Sensitive 驗證要求**：品牌/App 驗證、公開首頁、隱私政策（同網域）、Search Console 網域驗證、Demo 影片。**官方約 10 天、免費、無年費、無 CASA**。
- **未驗證的限制**：Testing 上限 100 test users（token 7 天失效 + 未驗證警告）；Production 未驗證含 sensitive scope → 整個 app 生命週期「新增 100 位使用者」上限，不可重置。
- **對「向大量會員要 Calendar 權限」的結論**：可行，但需走一次 sensitive 驗證（約 10 天、免費）。**若只要「app 建立/管理自己建的事件」，用 `calendar.app.created`（non-sensitive）可完全免驗證** —— 這是大量會員上線最省事的路。只有要「讀會員既有行程」才需升級 sensitive。

---

## 5. 配額與限制
- API quota（2026/5 後新專案）：每專案 10,000 req/分、每使用者 600 req/分、計費門檻 1,000,000 req/日（門檻內免費）。
- 反濫用（產品層級）：對外部網域邀請 >10,000 封、建立事件 >100,000、Email guests 外部 ~2,000 封 會被限流數小時～數月。
- 超額回 403/429 → 用 truncated exponential backoff 重試（max backoff 32/64 秒 + 隨機）。

---

## 6. 替代／互補方案（若不想自扛整合）

| 方案 | 定位 | 適合 | 對 Google 驗證負擔 |
|---|---|---|---|
| **自建（現況）** | freebusy + events API | 完全客製、嵌自家站、金流 | 自己承擔（但只教練端可免驗證） |
| **Google Appointment Schedule** | Google 內建預約頁、無 API | 教練手動分享連結、零開發 | 無（但無法嵌系統） |
| **Calendly** | SaaS embed | 最快上線、少寫程式 | Calendly 代扛、幾乎免除 |
| **Cal.com** | 開源可 self-host | 想掌控資料、可客製 | self-host 仍需處理，或用其 Platform 代管 |
| **Nylas** | 多 provider API 聚合 | 同時支援 Google+Outlook、外包 OAuth/合規 | Nylas 代扛（每帳號月費） |

---

## 7. 對本專案的最終建議（投報率排序）

1. **✅ 路線 A（已完成）**：會員端預約+提醒。
2. **加 Google Meet 自動連結**（線上諮詢）— 小改動、高體感。
3. **用 extendedProperties 存 booking_id** — 綁定事件與 DB，未來同步/對帳基礎。
4. **教練請假用 outOfOffice 事件** — freebusy 自動避開，教練體驗好。
5.（有需求再做）**固定週課用 recurrence**。
6.（有需求再做）**即時同步 watch+syncToken** — 教練常手動改日曆才值得。
7.（要服務大量會員讀其行程才做）**會員 OAuth**：優先評估 `calendar.app.created`（免驗證）；需讀既有行程才走 sensitive 一次性驗證（約 10 天、免費、無 CASA）。
