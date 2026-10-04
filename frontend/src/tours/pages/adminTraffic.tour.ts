/**
 * 流量來源（/admin/traffic）導覽
 * @module tours/pages/adminTraffic.tour
 *
 * 這頁是純讀取的報表，沒有任何寫入動作，所以不需要 modal 群組，
 * 也不必擔心 safeClick 的寫入防護。空資料時 `admintraffic-total` 等錨點
 * 不存在，找不到的步驟會安靜跳過（見 tours/types.ts 的設計原則）。
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-traffic",
  title: "流量來源導覽",
  titleEn: "Traffic sources tour",

  steps: [
    {
      el: '[data-tour="admintraffic-header"]',
      title: "訪客從哪裡來",
      desc: "這頁回答一件事：<b>人是怎麼找到你的</b>。右上角切換 <b>7／30／90 天</b>，整頁數字會跟著換區間。<br>剛上線時可能是空的——要有人瀏覽才會開始累積。",
      titleEn: "Where visitors come from",
      descEn: "This page answers one question: <b>how people found you</b>. The <b>7 / 30 / 90 day</b> switch in the top-right changes every number below it.<br>It may be empty right after launch — the numbers only start once people browse.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="admintraffic-total"]',
      title: "總瀏覽數",
      desc: "區間內的<b>頁面瀏覽次數</b>，同一個人看三頁就記三筆（不去重訪客）。下面那行是平均每天幾次，拿來看趨勢比看總數有感。",
      titleEn: "Total views",
      descEn: "<b>Page views</b> in the selected window — one person reading three pages counts three times (visitors are not de-duplicated). The line underneath is the daily average, which reads better as a trend than the raw total.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="admintraffic-sources"]',
      title: "五種來源分類",
      desc: "<b>AI 問答</b>＝ChatGPT、Perplexity 這類引擎引用你的文章帶來的人（這就是 AEO 在做的事）；<b>搜尋引擎</b>＝Google／Bing；<b>社群</b>＝FB／IG／LINE；<b>直接進入</b>＝書籤或手打網址；其餘歸<b>其他</b>。<br>橫條是佔比，一眼看出主力在哪。",
      titleEn: "Five source buckets",
      descEn: "<b>AI answers</b> = people sent by engines like ChatGPT and Perplexity quoting your articles (that is what the answer blocks are for); <b>search engines</b> = Google / Bing; <b>social</b> = FB / IG / LINE; <b>direct</b> = bookmarks or typed addresses; anything else lands in <b>other</b>.<br>The bar shows each share, so your main channel is obvious at a glance.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admintraffic-referrers"]',
      title: "來源網站與熱門頁面",
      desc: "左表是<b>把人送來的網域</b>，右表是<b>最被看的頁面路徑</b>。哪篇文章特別受歡迎，就往那個主題多寫幾篇、並把它的 AEO 答案區補滿。",
      titleEn: "Referrers and popular pages",
      descEn: "The left table lists the <b>hosts that sent people here</b>, the right one the <b>most-read paths</b>. Whichever article stands out, write more on that topic and fill in its answer block.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="admintraffic-daily"]',
      title: "每日長條",
      desc: "一根一天，滑過去會顯示當天次數。<b>發文或投廣告之後</b>來看這張圖最準——有沒有效果，隔天的長條會告訴你。<br>導覽結束，右上角的<b>「?」</b>隨時可以再看一次。",
      titleEn: "Views per day",
      descEn: "One bar per day; hover for that day's count. This chart is at its most useful <b>right after you publish or run an ad</b> — the next day's bar tells you whether it worked.<br>That is the tour; the <b>“?”</b> in the top-right replays it any time.",
      side: "top",
      align: "start",
    },
  ],
};

export default tour;
