# 自架字型來源與授權

本目錄的 woff2 由 Google Fonts 的 CDN（fonts.gstatic.com）取得，
**只取 `latin` 子集**（中文交給系統字型 fallback，不自架 CJK）。
三個家族皆為 **SIL Open Font License 1.1**，明文允許自架與再散布。

取得日期：2026-10-02
取得方式：帶 Chrome UA 向
`https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@300;500&family=Playfair+Display:wght@400;700&display=swap`
取 CSS，取其中 `/* latin */` 區段（unicode-range `U+0000-00FF …`）的 woff2 URL。

| 本地檔名 | 家族 | 用到的字重 | 位元組 | 來源 URL |
| --- | --- | --- | --- | --- |
| `cinzel-latin.woff2` | Cinzel (v26) | 400 / 700 | 25,904 | https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7.woff2 |
| `montserrat-latin.woff2` | Montserrat (v31) | 300 / 500 | 37,956 | https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2 |
| `playfair-display-latin.woff2` | Playfair Display (v40) | 400 / 700 | 38,404 | https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2 |

## ⚠️ 一個家族只有一個檔案（可變字型）

三支都是**可變字型**（variable font，單一 `wght` 軸：Cinzel 400–900、
Montserrat 100–900、Playfair Display 400–900），所以 Google 對
「400」與「700」回的是**同一個 URL**。`src/index.css` 因此宣告 6 條
`@font-face`（每家族 2 個字重）但只指向 3 個檔案 —— 同 URL 瀏覽器只會
下載一次，並依各條宣告的 `font-weight` 把 wght 軸鎖在該值。
**不要**為了「一個字重一支檔」而複製檔案，那會讓同時用到兩個字重的
頁面重複下載。

## 授權全文

* Cinzel — OFL 1.1，作者 Natanael Gama。
  <https://scripts.sil.org/OFL> ／ <https://fonts.google.com/specimen/Cinzel/license>
* Montserrat — OFL 1.1，作者 Julieta Ulanovsky 等。
  <https://openfontlicense.org> ／ <https://fonts.google.com/specimen/Montserrat/license>
* Playfair Display — OFL 1.1，作者 Claus Eggers Sørensen。
  <http://scripts.sil.org/OFL> ／ <https://fonts.google.com/specimen/Playfair+Display/license>

（授權網址亦寫在各檔的 `name` 表 ID 14；OFL 要求保留版權聲明與授權，
不要求在網頁上顯示，但要求散布時附上授權 —— 本檔即為此用。）

## 快取

`vercel.json` 對 `/fonts/(.*)` 設 `Cache-Control: public, max-age=31536000, immutable`。
檔名不帶 hash，所以**更新字型檔時要同時改檔名**（例如加 `-v2`），
並同步 `src/index.css` 的 `src:` 與 `index.html` 的 preload href。
