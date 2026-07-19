# SEO 稽核與框架選型評估報告

**站點**：https://coach-aaron-test.vercel.app/
**稽核日期**：2026-07-19
**稽核範圍**：SSR 覆蓋率、SEO 基礎建設、內容深度、框架選型
**性質**：純評估報告，未修改任何程式碼

---

## 0. 執行摘要（先讀這段）

稽核過程中發現一件必須先講清楚的事：**「SSR 正常、SEO 100 分」這個結論只在首頁成立**，而首頁恰好是全站唯一不需要抓資料的頁面。

實測結果：

| 頁面 | X-Rendered-By | SSR 內文字數 | title | description / OG | 結論 |
|---|---|---|---|---|---|
| `/` | ssr | 1,119 字元 | 正確 | 完整 | **唯一健康的頁面** |
| `/contact` | ssr | 有內容 | 正確 | 完整 | 健康 |
| `/about` | ssr | — | **空** | **無** | 有問題 |
| `/articles` | ssr | — | **空** | **無** | 有問題 |
| `/courses` | ssr | — | **空** | **無** | 有問題 |
| `/articles/sales-04` | ssr | **126 字元（只有「載入中...」）** | **空** | **無** | **嚴重** |
| `/courses/monetization-coaching-3m` | ssr | **126 字元（只有「載入中...」）** | **空** | **無** | **嚴重** |
| `/page/:slug` | ssr | 空 | 無（連 SEOHead 都沒有） | **無** | **嚴重** |

也就是說：**SSR 函式確實有跑（標頭是 ssr），但除首頁與聯絡頁外，所有頁面都渲染出一個「載入中」骨架、標題是空的**。這比純 CSR 更糟——爬蟲拿到的是 HTTP 200 + 空標題 + 重複的通用站名，Google 會把它當成「成功抓到的薄內容頁」而不是錯誤。

Lighthouse SEO 100 分沒有抓到這件事，是因為 Lighthouse 預設只跑首頁，而且它評分時是在 **JS 執行完之後**看 DOM。它衡量不到「伺服器端輸出」與「JS 執行後」的落差，而這個落差正是本站真正的問題所在。

**核心結論**：問題不在框架選錯，而在 **SSR 沒有做資料預抓（data prefetching）**。這個缺陷在 Astro 或 Next.js 上不會自動消失——除非在遷移時順便把資料流重寫，而那才是真正的成本所在。因此**不建議改用 Astro**，理由詳見第 5 章。

---

## 1. H1 問題

### 1.1 實測：H1 不是「空的」，而是「關鍵字被程式吃掉了」

原始回報是「H1 伺服器端沒有文字」。實際抓取伺服器回應後，發現情況不同，而且更值得修：

伺服器實際輸出（`https://coach-aaron-test.vercel.app/` 原始 HTML）：

```html
<h1 class="silver-heading font-display ... will-change-transform">
  <span class="relative inline-block">
    <span class="inline-block text-luxe-gold"
          style="opacity:0;filter:blur(4px);transform:translateY(24px)">體態</span>
  </span>
  <br/>用銷售心理學 月入八萬↑
</h1>
```

去標籤後的 H1 文字是：

```
體態
用銷售心理學 月入八萬↑
```

**「私教變現」四個字完全不在 H1 裡。**

這與規劃文件的意圖不符。`SEO_CONTENT_PLAN.md` 明訂首頁 H1 應為「阿倫教官｜私人教練變現專家・銷售心理學導師」，而資料庫中 `hero_title` 的預設值是 `"私教變現\n用銷售心理學 月入八萬↑"`——第一行本來就是主關鍵字。

### 1.2 根因：Flip Words 的字串切割邏輯

`frontend/src/components/sections/HeroSection.tsx`（約 222–258 行）：

```jsx
const parts = line.trim().split(/\s+/);
const staticPart = parts.slice(0, -1).join(' ');
```

這段的設計意圖是「保留前面的字，把最後一個詞換成輪播動畫詞」。但第一行 `"私教變現"` 是**中文、沒有空白**，所以 `split(/\s+/)` 切出來只有一個元素 `["私教變現"]`；`slice(0, -1)` 把它整個丟掉，`staticPart` 變成空字串，接著用 `flipWords[0]`（預設 `"體態"`）取代它。

**結果：主關鍵字「私教變現」被輪播詞「體態」整個取代掉。** 這不是動畫造成的渲染時序問題，而是一個字串處理 bug——中文沒有詞間空白，這套以空白分詞的邏輯在中文標題上必然失效。

### 1.3 疊加的三層可見性風險

即使關鍵字修好了，H1 還有三個獨立的「文字在 DOM 但看不見」的疊加因素：

1. **framer-motion 的 `initial` 被 SSR 出來了**：輪播詞的 span 帶著 `style="opacity:0;filter:blur(4px)"` 直接寫進 HTML。伺服器端該詞的算繪不透明度就是 0。
2. **GSAP 在掛載時把整個 H1 設為 opacity 0**（同檔 153–185 行），再花 1.2 秒淡入（delay 0.2s）。若 JS 出錯或 GSAP 未執行，H1 永久停在 `opacity: 0`。
3. **`.silver-heading` 使用 `-webkit-text-fill-color: transparent` + `background-clip: text`**（`frontend/src/index.css` 約 195–198 行）。漸層若未正常繪製，文字完全透明。

另有一個潛在 bug（同檔 46–52 行）：輪播計時器的 `useEffect` 依賴陣列為空，卻在內部用 `flipWords.length` 取模。若後台改成長度不同的陣列，`wordIndex` 會越界，`flipWords[wordIndex]` 回傳 `undefined`，H1 裡就真的出現空白。

### 1.4 對 SEO 的實際影響

需要客觀說明，避免過度恐慌也避免低估：

- **Google 能執行 JS**，Googlebot 用的是常青版 Chromium，`opacity: 0` 的文字仍會被讀取與索引，CSS 隱藏文字在現代已不會被當作作弊（除非有濫用意圖）。所以第 1.3 節那三層「看不見」問題，**對 Google 的實際傷害有限**。
- **真正的傷害是第 1.2 節**：主關鍵字「私教變現」根本不存在於 H1。這與 CSS 無關，任何爬蟲、任何渲染階段都讀不到。H1 是頁面主題最強的單一內容訊號，目前它傳達的主題是「體態」——與品牌定位（私教變現／銷售心理學）不一致，稀釋了主題相關性。
- **次要傷害**：Bing、社群平台爬蟲、部分 AI 檢索爬蟲不執行 JS 或執行能力較弱，會直接受第 1.3 節影響。
- **`<h2>` 也有同類問題**：`PodcastSection.tsx`、`ReviewSection.tsx` 用 GSAP ScrollTrigger 做 opacity 動畫，`CoachIntroSection.tsx` 用 AOS `data-aos="fade-up"`。這些同樣是「動畫控制不透明度」，風險等級低於 H1，但屬同一類。

### 1.5 修法建議（不改變任何視覺效果）

**修法 A — 修正分詞邏輯，讓 H1 含主關鍵字（最高優先，改動最小）**

不要用空白分詞。改成在後台內容中明確標記要輪播的詞，例如用一個獨立欄位存靜態前綴，或在 `hero_title` 中用分隔符標記：

```
私教變現|用銷售心理學 月入八萬↑
```

靜態部分永遠原樣輸出，輪播詞作為**額外附加**的視覺元素，而不是取代靜態文字。視覺上輪播效果完全保留，但 H1 一定含有「私教變現」。

**修法 B — 讓輪播詞的 SSR 輸出為「可見態」**

目前 SSR 出 `opacity:0` 是因為 framer-motion 把 `initial` 直接算繪出來。可讓伺服器端輸出第一個詞的**最終狀態**（opacity 1），只在客戶端水合後才啟動後續輪播。做法是判斷是否為首次渲染，首次不套用 `initial`。使用者看到的第一幀反而更好（沒有閃動），視覺無損。

**修法 C — GSAP 淡入改用 CSS 動畫，而非 JS 設定 opacity**

把入場動畫改成純 CSS `@keyframes`（`animation: fadeInUp 1.2s 0.2s both`）。`both` 會保留起始態，視覺效果與 GSAP 幾乎一致，但**不依賴 JS 執行成功**——JS 掛掉時文字仍會正常顯示，且不再有「永久 opacity 0」的風險。

**修法 D — `.silver-heading` 加 fallback 顏色**

在 `background-clip: text` 之前先設一個實色 `color`，讓漸層失敗時仍有可見文字。純防禦性，不影響正常狀況的視覺。

**修法 E — 修正 flipWords 越界**

把計時器的取模改為讀取當前 `flipWords.length`（用 ref 或把 `flipWords` 放進依賴陣列），避免 `undefined`。

> 優先序：**A > C > B > E > D**。A 是唯一影響 Google 排名的，其餘是強健性與非 JS 爬蟲的補強。

---

## 2. 各路由 SSR 覆蓋率稽核

### 2.1 SSR 管線現況

`vercel.json`：

```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "/api/server" },
  { "source": "/(.*)",     "destination": "/api/ssr" }
]
```

**沒有任何路由白名單或過濾**。所有非 `/api`、非實體檔案的路徑都進 SSR 函式，包含 `/admin/*`、`/chat`、`/member`——這些頁面被 SSR 是純粹浪費運算，且它們沒有 `noindex`。

`frontend/src/entry-server.tsx` 使用**同步的 `renderToString`**，且：

- 沒有任何資料預抓機制
- 沒有 `__INITIAL_DATA__` / `__PRELOADED_STATE__` 之類的狀態序列化（全 repo grep 無此類實作）
- 沒有 route loader、沒有 React Query dehydrate

`api/ssr.js` 只做 `<!--ssr-outlet-->` / `<!--ssr-head-->` 的字串替換，從不呼叫 API。

### 2.2 致命模式：`if (loading) return` 擋在 `<SEOHead>` 前面

每個詳情頁都是同一個結構（以 `ArticleDetail.tsx` 為例）：

```tsx
const [loading, setLoading] = useState(true);              // :28
useEffect(() => { fetchArticle(); }, [fetchArticle]);      // :99 ← 伺服器端不執行
...
if (loading) return <Loading text={t.common.loading} />;   // :227 ← 伺服器端在此就 return 了
...
return (<> <SEOHead title={loc(articleObj, "article_title")} ... />   // :246 ← 永遠到不了
```

在伺服器端，`useEffect` 不會執行 → `loading` 恆為 `true` → 第 227 行直接 return → **`<SEOHead>` 從未掛載 → Helmet 收集到的是空的**。

這解釋了實測看到的一切：`X-Rendered-By: ssr` 存在（SSR 確實跑了），但 `<title data-rh="true">` 是空的、沒有 description、沒有 OG、沒有 JSON-LD、`<div id="root">` 裡只有一個「載入中...」。

### 2.3 路由稽核總表

| 路由 | 元件 | Helmet | Meta 正確性 | SSR 內容 | 狀態 |
|---|---|---|---|---|---|
| `/` | Home | 有 | 完整、手工調校過 | **真實內容** | 健康 |
| `/contact` | Contact | 有 | 完整 | 真實內容 | 健康 |
| `/videos` | Videos | 有 | 通用（非動態） | 骨架，但 meta 有出 | 尚可 |
| `/courses` | Courses | 有 | 通用 | **空**（早退出 :85） | 有問題 |
| `/articles` | Articles | 有 | 通用 | **空**（早退出 :86） | 有問題 |
| `/lessons` | Lessons | 有 | 通用 | **空**（早退出 :59） | 有問題 |
| `/articles/:slug` | ArticleDetail | 有（到不了） | **無任何 meta** | **空** | **嚴重** |
| `/courses/:id` | CourseDetail | 有（到不了） | **無任何 meta** | **空** | **嚴重** |
| `/lessons/:id` | LessonDetail | 有（到不了） | **無任何 meta** | **空** | **嚴重** |
| `/page/:slug` | LandingPageViewer | **完全沒有** | **無**（連元件都沒引入 SEOHead） | **空** | **嚴重** |
| `/pages` | PublishedPages | **無** | **無** | 空 | 有問題 |
| `/login`, `/register` | — | 有 | `noIndex` 正確 | — | 正確 |
| `/chat`, `/booking`, `/coach`, `/notifications` | — | 部分 | **缺 `noIndex`** | 空殼 | 應修 |
| `/admin` + 17 個子路由 | — | **無** | **完全沒有 `noIndex`** | 空殼 | 應修 |

### 2.4 其他結構性問題

**（a）沒有 404 路由**
`App.tsx` 沒有定義 `*` catch-all。實測 `/this-does-not-exist-xyz` 回傳 **HTTP 200**、空白內文。這是典型的 soft 404，Google 會把無限多的不存在 URL 當成有效薄頁面索引，嚴重浪費抓取預算。

**（b）SSR 失敗時靜默回傳 200**
`api/ssr.js`（72–75 行、109–131 行）與 `entry-server.tsx`（52–56 行）三處 catch，全部在失敗時回傳 `html: ""` 加 **HTTP 200**。頁面掛了，爬蟲看到的是「成功的空頁」。應至少回傳 5xx，讓 Google 稍後重試而非索引空內容。

**（c）重複的 `<title>` 標籤**
`api/_ssr_template.html` 第 7 行有寫死的 `<title>阿倫教官 | Coach Aaron</title>`，而 Helmet 注入點 `<!--ssr-head-->` 在第 17 行。實測首頁確實同時出現兩個 title：

```html
<title>阿倫教官 | Coach Aaron</title>
<title data-rh="true">私教變現專家 | 銷售心理學助健身教練月入8萬 | 阿倫教官 | Coach Aaron</title>
```

**依 HTML 規範，第一個 `<title>` 生效**。這代表即使在 Helmet 正常運作的首頁，Google 讀到的標題也可能是通用的「阿倫教官 | Coach Aaron」，而非精心撰寫的關鍵字標題。所有 meta 標籤都有同樣的重複風險。**這是一個高投報、低風險的修正點。**

**（d）Cache-Control 過弱**
SSR 回應標頭是 `Cache-Control: public`，**沒有 `max-age` 或 `s-maxage`**，實測 `X-Vercel-Cache: MISS`。每次請求都重跑 SSR，TTFB 無法受惠於邊緣快取。建議加上 `s-maxage=300, stale-while-revalidate=86400`。

### 2.5 修法方向（不需換框架）

核心是讓 SSR 能拿到資料。兩條路：

**路線 1（推薦，改動最小）：在 `api/ssr.js` 做路由對應的資料預抓**

在 `api/ssr.js` 中依 URL pattern 判斷需要哪份資料，`await` 呼叫既有 API，把結果注入 `window.__INITIAL_DATA__`，同時傳給 `render()`；頁面元件的 `useState` 初值改為讀取該資料（存在則 `loading` 初值為 `false`）。

好處：只需改 `api/ssr.js` + `entry-server.tsx` + 4 個詳情頁的初始 state，**不動任何樣式、不動後台、不動路由結構**。

**路線 2：把 `if (loading) return` 移到 `<SEOHead>` 之後**

只讓 meta 先渲染出來、內文仍是骨架。這是 30 分鐘的止血法，能立刻解決「標題空白」，但解決不了「內文空白」。可作為路線 1 的前置快速修補。

> 建議：**先做路線 2 止血（當天可上線），再做路線 1 根治。**

---

## 3. SEO 基礎建設檢查

### 3.1 sitemap.xml — 不存在（但 robots.txt 對外宣告它存在）

全 repo 沒有任何 sitemap 檔案或產生器（`frontend/public/`、`scripts/`、`api/` 皆無）。

更糟的是，因為 `vercel.json` 的 catch-all rewrite，`/sitemap.xml` **不會 404，而是回傳 HTTP 200 + React 應用的 HTML**。實測確認：

```
$ curl https://coach-aaron-test.vercel.app/sitemap.xml
<!doctype html><html lang="zh-TW">...
```

而 `robots.txt` 明確宣告 `Sitemap: https://coach-aaron-test.vercel.app/sitemap.xml`。Google 會去抓、拿到 HTML、判定為 sitemap 格式錯誤。**這比完全沒有 sitemap 更糟**，因為它是一個明確的錯誤訊號。

**建議**：新增 `api/sitemap.js` 動態產生，從資料庫撈 articles / courses / lessons / landing pages 的 slug 與 `updated_at`，輸出標準 XML；並在 `vercel.json` 加一條 rewrite 讓 `/sitemap.xml` 指向它（必須放在 catch-all 之前）。

### 3.2 robots.txt — 存在且可用，但有兩個問題

`frontend/public/robots.txt`：

```
User-agent: *
Allow: /

Sitemap: https://coach-aaron-test.vercel.app/sitemap.xml
```

- 沒有錯誤封鎖任何東西（正確）
- **缺 `Disallow: /admin`**：後台的 18 個路由全部可被抓取。雖有 `RequireAdmin` 保護（不會外洩資料），但會產生大量空殼薄頁面，浪費抓取預算
- 網域是 `*-test.vercel.app` 測試站；上正式站時必須更新

### 3.3 canonical — 有實作，但有網域風險

全站唯一實作在 `frontend/src/components/seo/SEOHead.tsx:208`。實測首頁正確輸出：

```html
<link data-rh="true" rel="canonical" href="https://coach-aaron-test.vercel.app/"/>
```

**風險點**：`DEFAULT_URL`（66–74 行）在 `VITE_SITE_URL` 未設定時，fallback 為寫死的 `https://coach-aaron-test.vercel.app`。SSR build 環境下 `import.meta.env` 不存在，會走 catch 分支。**上正式網域時若沒在 Vercel 設定 `VITE_SITE_URL` 建置變數，全站每一個 canonical、`og:url`、JSON-LD 的 `url` 都會指向測試站**——這會讓 Google 把正式站的所有頁面視為測試站的複本，等同於自我封殺。

**這是上線前的必檢項目。**

另外，第 2 章列出的所有詳情頁因為 `SEOHead` 從未掛載，**canonical 在伺服器端也不存在**；`/page/:slug` 則是連 `SEOHead` 都沒引入。

### 3.4 hreflang — 無法實作（因為英文版沒有 URL）

`frontend/src/context/LanguageContext.tsx` 是一份約 1000 行的內嵌字典（`zhTW` / `en`），語言存在 React state + localStorage：

```tsx
const [language, setLanguageState] = useState<Language>("zh-TW");
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "zh-TW") setLanguageState(saved);
}, []);
```

**切換語言完全不改變 URL**——沒有 `/en/` 前綴、沒有 query param。後果：

- **整個英文版內容對搜尋引擎完全不存在**。那 1000 行英文翻譯，沒有任何一個字能被索引，因為沒有 URL 可以指向它們。
- **hreflang 現在無法加**，也不該加——沒有可指向的替代 URL。目前站上沒有 hreflang 標籤，這在現況下是正確的。
- `<html lang>` 在 `frontend/index.html:2` 與 `api/_ssr_template.html:2` **寫死 `zh-TW`**，只在水合後由 JS 修正。`og:locale` 同樣寫死 `zh_TW`。

**建議**：這是一個策略決策，不是純技術問題。先問一個問題：**英文版有商業價值嗎？** 目標客群是台灣的健身教練，英文版的搜尋需求可能接近零。

- 若**沒有**商業價值 → 不需處理。維持現狀（客戶端切換）完全可接受，不影響中文 SEO。**建議選這個。**
- 若**有**價值 → 需導入 `/en/*` 路由前綴、每頁輸出 `hreflang` 互指、`<html lang>` 依路由 SSR 輸出。這是中等規模工程，且會牽動所有路由定義。在中文版基礎都還沒修好之前，不建議動。

### 3.5 JSON-LD 結構化資料 — 只有 2 種，其中 1 種是死碼

全部集中在 `SEOHead.tsx:112–155`：

| Schema | 狀態 |
|---|---|
| `Article` | **有作用**。`ArticleDetail.tsx:253` 傳入 `isArticle={true}`，含 headline / author / publisher / 日期 / articleSection。但因第 2 章的早退出問題，**伺服器端從未輸出**，只在客戶端水合後才出現 |
| `Course` | **死碼**。條件是 `type === "product" && price !== undefined`，但 `CourseDetail.tsx:143–154` 只傳了 `type="product"`，**從未傳 `price`** → 條件永遠不成立 → **任何課程頁都沒有 Course schema** |

實測首頁 `application/ld+json` 出現次數：**0**。

**完全缺少且建議補上的**（依投報率排序）：

1. **`Person`（阿倫本人）** — 最高優先。品牌名「阿倫教官」是核心搜尋詞，Person schema 有助於建立實體識別與知識圖譜。含 `name`、`alternateName`（黃冠倫）、`jobTitle`、`sameAs`（IG / YouTube / Podcast 等所有社群連結）、`knowsAbout`。
2. **`Organization` + `WebSite`（含 `SearchAction`）** — 站點層級實體。放首頁，全站繼承。
3. **`Course`（修好現有的死碼）** — 課程頁能拿到課程類 rich result，對「健身教練培訓」這類查詢有直接幫助。補上 `price`、`offers`、`provider`、`hasCourseInstance`。
4. **`BreadcrumbList`** — 列表頁與詳情頁，SERP 顯示麵包屑，提升點閱率，實作成本低。
5. **`FAQPage`** — 若首頁補上 Q&A 段落（見第 4 章建議），可直接吃到 FAQ rich result。
6. **`VideoObject`** — 站上有 Reels / Videos / Lessons 三個影音區塊，目前完全沒有影片結構化資料，影片搜尋流量等於放棄。
7. **`PodcastEpisode`** — 有 Podcast 區塊則值得補。

**關於 `LocalBusiness`**：需要判斷。若阿倫在台東有**實體、可預約到訪的營業地點**（威豪健身），且想吃「台東健身教練」這類在地搜尋，則 `LocalBusiness`（或更精確的 `HealthAndBeautyBusiness` / `ExerciseGym`）**值得加**，並搭配 Google Business Profile。若主要業務是線上培訓、不接受到訪，**則不該加**——虛假的在地商家標記可能導致人工處罰。**建議先確認營業型態再決定。**

---

## 4. 內容深度評估

### 4.1 現況量測

| 指標 | 數值 |
|---|---|
| 首頁去標籤可見文字 | 約 2,911 字元（含 head 與導覽） |
| **`<div id="root">` 內實際內文** | **僅 1,119 字元** |
| 首頁 HTML 總大小 | 32 KB |
| H1 主關鍵字 | **缺失**（見第 1 章） |
| JSON-LD | 0 |

1,119 字元（約 400–500 個中文字）是**嚴重偏薄**。這個量級大約等同於一則社群貼文，遠不足以支撐商業關鍵字排名。

### 4.2 目標關鍵字競爭力評估

| 關鍵字 | 競爭強度 | 現況競爭力 | 說明 |
|---|---|---|---|
| **阿倫教官** | 極低（品牌詞） | **強** | 品牌詞幾乎必定第一，但搜尋量取決於個人知名度，非成長來源 |
| **私教變現** | 低—中 | **弱** | 詞本身冷門、競爭者少，是**最容易拿下的高價值詞**。但目前 H1 沒有它、內文提及次數極少 |
| **銷售心理學** | 高 | **極弱** | 這是通用商管詞，競爭者是出版社、商業媒體、大型內容站。用 1,119 字元的首頁去打，毫無勝算。**應放棄單打此詞**，改攻長尾組合 |
| **健身教練培訓** | 中—高 | **弱** | 競爭者為各大證照機構、健身房品牌。需要大量課程與內容頁支撐，首頁單打不足 |
| **台東健身教練** | **低** | **中**（潛力最高） | 在地詞競爭極低，是**最快看到成效的方向**。但目前全站幾乎沒有「台東」的在地內容，也沒有 LocalBusiness 標記 |

**策略性判斷**：目前的關鍵字清單（`SEO_CONTENT_PLAN.md` 列了 15 個）**過於發散且高估了頭部詞的可攻性**。建議聚焦：

- **主攻**：`私教變現`、`私人教練銷售`、`健身教練銷售`、`皮拉提斯銷售`（客戶特別指定的三個銷售詞，且競爭度低、商業意圖極強——這是正確的直覺）
- **在地攻**：`台東健身教練`、`台東私人教練`
- **長尾攻**：`健身教練 業績 提升`、`私人教練 續約 技巧`、`教練 不會銷售 怎麼辦`、`健身教練 月收入`
- **放棄單打**：`銷售心理學`、`NLP`（改為在長尾內容中自然帶到）

### 4.3 首頁應補多少內容

**目標：從 1,119 字元提升到 4,000–6,000 字元（約 1,500–2,500 中文字）。**

這不是「越多越好」——目標是達到「這一頁確實完整回答了搜尋者的問題」的深度。以此利基的競爭強度，1,500–2,500 中文字足以進入競爭；超過 3,000 字反而會傷害轉換率。

**建議補的段落**（依 SEO 價值排序，多數素材 `SEO_CONTENT_PLAN.md` 已備妥，只是沒放上頁面）：

1. **痛點共鳴段（約 300 字）** — 直接使用規劃文件已寫好的「你是否遇到這些困擾？」四點。這段自然含有大量長尾詞（不擅長銷售、續約率低、收入不穩定），是最高投報的一段。
2. **三大核心價值主張（約 400 字）** — 規劃文件已備妥（銷售心理學實戰系統／私教變現完整策略／自媒體獲客藍圖）。用 `<h2>`/`<h3>` 建立語意層級。
3. **成果數據與見證（約 300 字）** — 130+ 教練、月入 8 萬、續約率提升 60%。目前見證是輪播元件，**文字可能因動畫而延遲載入**；應確保 SSR 就有文字。
4. **課程總覽摘要（約 300 字）** — 首頁應有課程的文字描述與內部連結，目前課程資訊多半靠 JS 載入。強化首頁→課程頁的內部連結權重傳遞。
5. **FAQ 段落（約 500 字，6–8 題）** — **投報率最高的新增內容**。直接對應長尾搜尋（「教練不會銷售怎麼辦」「私教如何提高續約」「新手教練多久能月入八萬」），且可掛 `FAQPage` schema 吃 rich result。
6. **關於阿倫／在地連結段（約 250 字）** — 自然帶入「台東」「威豪健身」等在地訊號，支撐在地搜尋。
7. **文章精選區（約 200 字）** — 列出 3–5 篇最新文章的標題與摘要，SSR 輸出。同時提升首頁內容量與文章頁的內部連結。

**重要提醒**：補內容的前提是**第 2 章的 SSR 資料預抓要先修好**。否則從資料庫來的內容（見證、課程、文章）依然不會出現在伺服器端 HTML，補了也是白補。

### 4.4 更重要的一件事：內容應該長在文章頁，而不是首頁

站上已有文章系統，資料庫也有實際文章（實測看到 `sales-04`「月初績效達標法則」等）。**但這些文章頁對 Google 目前完全是空白頁**（126 字元的「載入中」）。

這代表：**現有的內容資產已經存在，卻因為技術缺陷而完全沒有被索引。** 修好詳情頁 SSR 的價值，遠高於在首頁堆字——這是把「已經寫好但看不見」的內容變成「可被搜尋到」，投報率遠高於生產新內容。

---

## 5. 框架選型評估（重點章節）

### 5.1 先釐清問題的本質

客戶詢問是否改用 Astro。在回答之前，必須先把「問題是什麼」定義清楚，否則會選錯工具。

本站目前的三個核心缺陷是：

| # | 缺陷 | 換框架能自動解決嗎？ |
|---|---|---|
| 1 | **SSR 沒有資料預抓**，詳情頁輸出空骨架與空 meta | **不能**。Astro/Next 提供了「可以做預抓」的機制，但資料流仍需重寫。這是工作量的所在，不是框架的功勞 |
| 2 | **3.4 MB 單一 bundle**，零路由分割，後台程式碼打包給所有訪客 | **不能**。Vite 本身就支援 `React.lazy` + `manualChunks`。目前沒做，是設定問題，不是框架限制 |
| 3 | **H1 關鍵字被字串處理 bug 吃掉** | **不能**。這是應用程式邏輯 bug，任何框架都會照樣帶過去 |

**三個缺陷，沒有一個是「Vite + React SSR 做不到」造成的。** 全部都是實作未完成。這是本章結論的基礎。

### 5.2 bundle 現況細節

`frontend/vite.config.ts` 客戶端建置分支（37–46 行）**沒有 `manualChunks`、沒有任何分割設定**，且 `sourcemap: true`（source map 上到正式站）。

實際產出：

| 檔案 | 大小 |
|---|---|
| `main-*.js` | **3.4 MB** |
| `main-*.js.map` | 12 MB |
| `main-*.css` | 249 KB |
| `lenis-*.js` | 19 KB |

`App.tsx` **在檔案頂端靜態 import 全部 55 個模組**，包含整個後台（`AdminDashboard`、`ArticleEditor`、`CourseEditor`、`LandingPageEditor`、`AdminExport` 等，45–59 行）。全站 `React.lazy` 只用了一次，在 `components/three/index.tsx:41-42`。

也就是說：**每一位首頁訪客都要下載整個後台管理系統**——包含約 35 個 `@tiptap/*` 套件、`moveable` + `@scena/react-guides`、`three.js`——才能看到首頁。

疊加 `#app-loader`（`frontend/index.html` 內嵌，`position: fixed; inset: 0; z-index: 99999` 不透明遮罩），它只由 `App.tsx:99-106` 的客戶端 JS 移除。因此：**SSR 已經把畫面完整算繪出來了，卻被一層不透明遮罩蓋住，直到 3.4 MB 的 bundle 解析並執行完畢才掀開。** LCP 8.1s 的成因就在這裡——SSR 對「感知效能」的貢獻被完全抵銷，只對爬蟲有效。

另發現 `grapesjs`、`grapesjs-blocks-basic`、`grapesjs-preset-webpage` 三個套件已宣告但**從未被 import**（全 `frontend/src` grep 零命中，`LandingPageEditor` 用的是自製實作）。它們有被 tree-shake 掉，不影響 bundle，但可移除以縮短安裝時間。另有 `vite`、`typescript`、`postcss`、`tailwindcss`、`express` 誤放在 `dependencies`。

### 5.3 四個選項評估

---

#### 選項 (a)　維持 Vite + React SSR，修打包 + 修 H1 + 補資料預抓

**SEO 實際增益：極高**
- 修好資料預抓 → 文章／課程／課堂／landing page 從「空白頁」變成「完整內容 + 完整 meta + JSON-LD」。這是本次稽核中價值最大的單一改善。
- 修好 H1 → 主關鍵字回到最強訊號位置。
- 修好重複 title → 精心撰寫的標題真正生效。
- 路由分割 + 移除 loader 遮罩 → LCP 有望從 8.1s 降到 2.5s 以內，Core Web Vitals 由紅轉綠。

**遷移成本／風險：低**
- 資料預抓：`api/ssr.js` + `entry-server.tsx` + 4 個詳情頁的初始 state。約 2–3 天。
- 路由分割：`App.tsx` 改用 `React.lazy` + `Suspense`，`vite.config.ts` 加 `manualChunks`。**後台單獨分塊後，公開站 bundle 預期可降到 600–900 KB**。約 1 天。
- loader 遮罩：改為 SSR 有內容時就不插入遮罩，或以 CSS 動畫自動淡出。約 0.5 天。
- 風險：全部是增量修改，可逐項上線、逐項驗證，**任何一步都能獨立回滾**。

**對樣式的衝擊：零。** 不動任何 CSS、不動任何元件的 JSX 結構（除了 HeroSection 的分詞邏輯）。

**對後台的衝擊：零**（分割後反而更快，因為後台不再與公開站爭搶初始載入）。

**維護性：維持現狀。** 團隊已熟悉此架構，`README.md`、`VERCEL_SSR_DEPLOYMENT_GUIDE.md` 等文件皆已對應此架構。

---

#### 選項 (b)　遷移 Astro（含 React island）

**SEO 實際增益：低（相對於選項 a 的增量）**

這點必須說清楚：**Astro 的 SEO 優勢在於預設輸出零 JS 的靜態 HTML**。但本站的問題不是「輸出的 HTML 不好」——首頁的 SSR HTML 其實是正確的。問題是**資料沒被預抓**，而這在 Astro 裡一樣要自己寫（在 frontmatter 裡 `await fetch`）。Astro 幫你的是「語法比較順手」，不是「自動幫你抓資料」。

Astro 真正能帶來的增益是**效能**：islands 架構讓非互動區塊不出 JS。但選項 (a) 的路由分割已能拿下這個增益的大部分，成本卻低一個數量級。

**遷移成本／風險：高**

- 本站**不是內容型網站**。它有：登入／註冊、會員中心、預約系統、即時聊天（`/chat/:conversationId`）、購物車結帳、18 個路由的後台管理系統、拖拉式 landing page 編輯器。**這些全部是高度互動的 SPA，正是 Astro 最不擅長的場景。**
- 這些頁面在 Astro 裡只能包成一個大 `client:only` island——**等於在 Astro 裡塞一個完整的 React SPA**，Astro 的所有優勢（零 JS、島嶼化、部分水合）在這些頁面上完全失效，卻要付出整個建置系統的遷移成本。
- 跨頁共享的 React Context（`LanguageContext` 約 1000 行、`ThemeContext`、Auth）在 Astro 的 MPA 模型下**每次換頁都會重置**。要維持現有行為需大幅重構為 localStorage/cookie 驅動，或全站包成 SPA island（等於白遷移）。
- React Router 的整套路由定義需改寫為 Astro 檔案式路由。

**對樣式的衝擊：中—高（而客戶明確表示不想大改樣式）**

- Tailwind 設定可沿用，`index.css`（44,211 位元組）大致可搬。
- 但所有元件的**組合方式**要重組（哪些是 `.astro`、哪些是 island、`client:` 指令怎麼下）。
- GSAP / AOS / Lenis / framer-motion 這類依賴「全站生命週期」的動畫庫，在 Astro 的 MPA 換頁模型下行為會改變，**視覺效果幾乎確定會出現迴歸**，需逐頁重新驗證與調校。這與「不想大改樣式」的需求直接衝突。

**維護性：下降。** 團隊需同時掌握 Astro 與 React 兩套心智模型；現有文件全數作廢；且此專案的互動比重高，長期會不斷遇到「這個要不要做成 island」的決策摩擦。

**評估：不適合。** Astro 是為內容型網站（部落格、文件、行銷站）設計的。本站有大量登入後的互動功能，是典型的應用型網站。**用 Astro 是拿內容站的工具去做應用站。**

---

#### 選項 (c)　遷移 Next.js（App Router）

**SEO 實際增益：高（但幾乎全部與選項 a 重疊）**
- Server Components + 內建 `generateMetadata` 讓「資料預抓 + meta」變成框架預設行為，能**從結構上根除**第 2 章的整類問題（不會再有人不小心把 `if (loading) return` 寫在 SEOHead 前面）。
- 自動路由分割、圖片最佳化、內建 ISR，效能基礎建設比手工 Vite SSR 完整。
- i18n routing 為內建，若未來要做英文版 hreflang，Next.js 是最省事的。

**遷移成本／風險：高**
- 全站路由改為檔案式路由（約 40+ 個路由）。
- 需決定每個元件是 Server 還是 Client Component；所有用到 hooks / Context / 動畫庫的元件都要標 `'use client'`——以本站的動畫密度，**大部分元件會變成 Client Component**，Server Components 的效益因此被大幅稀釋。
- `react-helmet-async` 全數改為 Metadata API。
- 後端 Express（`api/server.js`）與 Next 的整合需重新規劃。
- 實務估計 **3–6 週**，且期間功能凍結。

**對樣式的衝擊：低—中。** Tailwind 與 CSS 可幾乎原樣搬移，這點比 Astro 好很多。主要風險同樣在動畫庫與 `'use client'` 邊界。

**對後台的衝擊：中。** 後台是純客戶端 SPA，可整包標為 Client Component 搬過去，改動相對機械化。

**維護性：長期較佳。** Next.js 生態最大、招聘容易、SEO 最佳實踐是框架預設而非靠自律。

**評估：技術上是四個選項中最正確的終局架構，但現在不是做這件事的時機。** 理由：目前所有問題都能用選項 (a) 以 1/10 的成本解決。在「用 5 天能拿到 90% 的效益」時，沒有理由花 4 週去拿 100%。**建議列為 12 個月後、若站點規模顯著成長時的重新評估項目。**

---

#### 選項 (d)　vite-ssg / 靜態預渲染

**SEO 實際增益：中**
- 建置時預先產生靜態 HTML，爬蟲拿到完整內容，TTFB 極佳（純 CDN）。

**遷移成本／風險：中，且有結構性阻礙**
- 與現有 Vite 設定相容度高，遷移成本本身不高。
- **但本站內容由後台 CMS 動態管理**（`site_content` 資料表、文章、課程、landing page 皆可由客戶在後台編輯）。靜態預渲染意味著**每次客戶在後台改一個字都必須觸發重新建置與部署**，內容才會更新。
- 對一位非工程師的客戶而言，這是嚴重的體驗倒退——目前後台改完即時生效。
- 可用 webhook 觸發 Vercel 重建緩解，但仍有數分鐘延遲，且建置額度會快速消耗。
- 會員中心、聊天、後台等登入後頁面本來就無法預渲染，需維持 CSR，形成混合架構，複雜度上升。

**評估：與本站的 CMS 驅動特性衝突。不建議。**

### 5.4 明確建議

> ## **建議選擇 (a)：不要換 Astro，維持 Vite + React SSR，把既有實作補完。**

理由，按重要性排序：

**第一，Astro 解決不了本站真正的問題。**
本次稽核找到的三個核心缺陷——SSR 無資料預抓、bundle 未分割、H1 邏輯 bug——**沒有任何一個是現有框架造成的，也沒有任何一個會因為換到 Astro 而自動消失**。遷移到 Astro 之後，這三件事依然要一件一件手動修，只是換個地方修。等於**付了搬家的錢，還是要付裝修的錢**。

**第二，本站的性質與 Astro 的適用範圍不符。**
Astro 的核心價值主張是「內容型網站，預設零 JS」。本站有登入註冊、會員中心、預約系統、即時聊天、購物結帳、18 個路由的後台、拖拉式頁面編輯器。這些在 Astro 裡只能退化成一個大型 `client:only` island——**Astro 的優勢在這些頁面上全部歸零，缺點卻全部保留**。這是工具與問題的錯配。

**第三，這與「不想大改樣式」的需求直接衝突。**
客戶明確表示不想大改樣式。但 Astro 遷移必然要重組元件的組合方式，而站上重度依賴 GSAP、AOS、Lenis、framer-motion——這些庫在 Astro 的 MPA 換頁模型下行為會改變，**視覺迴歸幾乎必然發生**，且需逐頁重新調校。選項 (a) 對樣式的衝擊則是**零**。

**第四，投報率差距是一個數量級。**
選項 (a) 約需 **5 個工作天**，且可分項漸進上線、隨時回滾，能拿下本報告中**幾乎全部的 SEO 增益**（詳情頁從空白變完整、LCP 8.1s → 2.5s 以內、H1 關鍵字歸位）。Astro 遷移約需 **3–6 週**、功能凍結、視覺迴歸風險高，換來的**額外**增益接近於零。

**第五，現有架構其實是健康的。**
首頁的 SSR 輸出證明這套 Vite + React SSR 管線**完全能產出正確的伺服器端 HTML 與完整 meta**。它不是壞掉的架構，它是**一個做對了但只完成了一頁的架構**。把同樣的做法套用到其餘路由，就完成了。丟掉一個已驗證可行的架構去換另一個，理由並不成立。

**給客戶的一句話版本**：
> 網站現在的問題不是「用錯工具」，是「工具只裝到一半」。首頁已經證明這套做法完全可行，只是文章頁、課程頁還沒接上同樣的機制。換成 Astro 不會自動幫我們接上，該做的工還是要做一遍，而且動畫和樣式都得重新調。建議把這 5 天花在補完現有架構，而不是花 3–6 週搬家。

**唯一應該重新評估的時機**：若未來 12 個月內內容頁數成長到數百頁、或決定認真經營英文版（需要 i18n routing 與 hreflang），屆時值得重新評估 **Next.js**（不是 Astro）。

---

## 6. 改善優先順序（依投報率排序）

### 第一梯隊 — 立即執行（投報率極高，成本極低）

| # | 項目 | 預估工時 | 影響 |
|---|---|---|---|
| 1 | **移除範本中重複的 `<title>`** — `api/_ssr_template.html:7` 與 `frontend/index.html:7` | 15 分鐘 | 讓精心撰寫的關鍵字標題真正生效。目前規範上是通用標題勝出 |
| 2 | **修正 H1 分詞邏輯**，讓「私教變現」回到 H1 | 1 小時 | 主關鍵字回到最強訊號位置。視覺無變化 |
| 3 | **把 `if (loading) return` 移到 `<SEOHead>` 之後**（4 個詳情頁） | 2 小時 | 詳情頁立即擁有正確 title / description / OG / canonical |
| 4 | **確認 Vercel 已設定 `VITE_SITE_URL`** | 15 分鐘 | 防止上正式站時全站 canonical 指向測試站（會自我封殺） |
| 5 | **修正 `CourseDetail` 缺少的 `price` prop** | 30 分鐘 | 讓已寫好但從未生效的 Course JSON-LD 啟用 |
| 6 | **robots.txt 加 `Disallow: /admin`** | 10 分鐘 | 停止浪費抓取預算在後台空殼頁 |

### 第二梯隊 — 本週執行（投報率高）

| # | 項目 | 預估工時 | 影響 |
|---|---|---|---|
| 7 | **SSR 資料預抓**（`api/ssr.js` 注入 `__INITIAL_DATA__`） | 2–3 天 | **本報告價值最高的單項**。文章／課程／課堂／landing page 從空白頁變成完整可索引內容。等於一次讓數十頁既有內容重見天日 |
| 8 | **路由分割**（`React.lazy` + `manualChunks`，後台獨立分塊） | 1 天 | bundle 3.4 MB → 預估 600–900 KB。LCP 大幅改善 |
| 9 | **移除／改良 `#app-loader` 遮罩** | 0.5 天 | 讓 SSR 已算繪的內容立即可見，LCP 不再等待整包 JS |
| 10 | **新增動態 `sitemap.xml`**（`api/sitemap.js` + rewrite） | 0.5 天 | 修正目前「robots 宣告了 sitemap，抓到的卻是 HTML」的錯誤訊號 |
| 11 | **加入 404 catch-all 路由並回傳正確狀態碼** | 2 小時 | 消除 soft 404，停止無限薄頁面被索引 |
| 12 | **SSR 失敗改回 5xx，不再靜默回傳 200** | 1 小時 | 避免空白頁被當成有效內容索引 |

### 第三梯隊 — 本月執行（中等投報率）

| # | 項目 | 預估工時 | 影響 |
|---|---|---|---|
| 13 | **補首頁內容至 4,000–6,000 字元**（痛點段、三大價值、FAQ、成果數據等；素材多已存在於 `SEO_CONTENT_PLAN.md`） | 1–2 天 | 首頁從「薄」進入可競爭區間。**須在 #7 完成後才有意義** |
| 14 | **補 `Person` + `Organization` + `WebSite` JSON-LD** | 0.5 天 | 建立品牌實體識別，強化「阿倫教官」品牌詞 |
| 15 | **補 `FAQPage` JSON-LD**（搭配 #13 的 FAQ 段落） | 0.5 天 | 爭取 FAQ rich result，直接提升 SERP 曝光 |
| 16 | **補 `BreadcrumbList`** | 0.5 天 | SERP 顯示麵包屑，提升點閱率 |
| 17 | **SSR 回應加 `s-maxage` 邊緣快取** | 1 小時 | 改善 TTFB 與伺服器成本 |
| 18 | **登入後路由補 `noIndex`**（chat / booking / coach / notifications） | 1 小時 | 避免空殼頁進入索引 |
| 19 | **關閉正式站 sourcemap；清掉未使用的 grapesjs 套件；整理 devDependencies** | 1 小時 | 減少部署體積與安裝時間 |

### 第四梯隊 — 需先做商業決策

| # | 項目 | 前置決策 |
|---|---|---|
| 20 | **`LocalBusiness` / `ExerciseGym` JSON-LD + Google Business Profile** | 先確認：台東是否有實體、可到訪的營業地點？若否則不應加 |
| 21 | **`VideoObject` / `PodcastEpisode` JSON-LD** | 先確認影音內容是否為長期經營重點 |
| 22 | **英文版 `/en/*` 路由 + hreflang** | 先確認：英文版有商業價值嗎？目標客群是台灣教練，**建議暫不投入** |
| 23 | **重新評估 Next.js 遷移** | 12 個月後，視內容頁數成長與 i18n 需求再議 |

---

## 附錄：關鍵檔案路徑

**SSR 管線**
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\vercel.json`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\api\ssr.js`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\api\_ssr_template.html`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\scripts\vercel-build.sh`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\server.js`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\index.html`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\entry-server.tsx`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\vite.config.ts`

**路由與 SEO**
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\App.tsx`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\components\seo\SEOHead.tsx`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\public\robots.txt`

**問題頁面**
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\components\sections\HeroSection.tsx`（H1 分詞 bug）
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\pages\ArticleDetail.tsx`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\pages\CourseDetail.tsx`（缺 `price`）
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\pages\LessonDetail.tsx`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\pages\LandingPageViewer.tsx`（完全無 SEO）
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\context\LanguageContext.tsx`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\utils\contentTemplates.ts`
- `X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\frontend\src\index.css`（`.silver-heading` 約 195–198 行）
