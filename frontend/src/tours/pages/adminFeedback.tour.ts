/**
 * 意見反饋後台（/admin/feedback）導覽 — 開發者 ↔ 教練
 * @module tours/pages/adminFeedback.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-feedback",
  title: "意見反饋後台導覽",
  titleEn: "Feedback admin tour",

  steps: [
    {
      title: "意見反饋 = 開發者 ↔ 教練",
      desc: "這裡是<b>開發者（我）與教練</b>之間的溝通平台，一般學員看不到。兩人共用這一個面板，用右上角的<b>「以 __ 身分」</b>切換<em>開發者</em>或<em>教練</em>，發問與回覆都會以該身分送出。側邊欄「意見反饋」旁的<b>紅圈數字</b>＝目前<em>等待教練回應</em>的則數。",
      titleEn: "Feedback = developer ↔ coach",
      descEn: "This is the channel between the <b>developer (me) and the coach</b> — members never see it. You both share this one panel; use the <b>\"Acting as\"</b> switch top-right to post as the <em>developer</em> or the <em>coach</em>. The <b>red badge</b> next to \"Feedback\" in the sidebar is how many are <em>waiting on the coach</em> right now.",
    },
    {
      el: '[data-tour="adminfeedback-role"]',
      title: "先選你的身分",
      desc: "送出前先確認<b>「以 __ 身分」</b>選的是<em>開發者</em>還是<em>教練</em> — 這決定訊息掛在哪一方、氣泡靠哪邊，以及通知送給誰。你的選擇會記在這台裝置。",
      titleEn: "Pick who you are first",
      descEn: "Before you send, check whether <b>\"Acting as\"</b> is set to <em>Developer</em> or <em>Coach</em> — it decides which side the message belongs to, which side the bubble sits, and who gets notified. Your choice is remembered on this device.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="adminfeedback-new"]',
      title: "發起一則反饋",
      desc: "開發者或教練<b>都能主動發起</b>：按「新增反饋」填標題、內容、附圖即可。送出後會自動轉為<em>等待對方回應</em>。",
      titleEn: "Start a thread",
      descEn: "Either side can <b>start a thread</b>: tap \"New feedback\", add a title, message, and images. Once sent it flips to <em>waiting on the other side</em>.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="adminfeedback-stats"]',
      title: "狀態統計 + 篩選",
      desc: "每個籤同時是<b>計數</b>與<b>篩選鈕</b>：<em>等待開發者回應</em>／<em>等待教練回應</em>讓你只看該你處理的；點<em>全部</em>回到完整清單。",
      titleEn: "Status counts + filter",
      descEn: "Each chip is both a <b>count</b> and a <b>filter</b>: <em>Waiting on developer</em> / <em>Waiting on coach</em> show only what needs each side; tap <em>All</em> to go back to the full list.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="adminfeedback-search"]',
      title: "搜尋",
      desc: "用標題關鍵字快速定位某一則反饋。",
      titleEn: "Search",
      descEn: "Jump to a specific thread by title keyword.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="adminfeedback-size"]',
      title: "顯示密度",
      desc: "卡片太大或太小？用<b>大／中／小</b>切換一次看更多或看更清楚，偏好會記在這台裝置。",
      titleEn: "Display density",
      descEn: "Cards too big or too small? Toggle <b>L / M / S</b> to fit more or read easier — your choice is remembered on this device.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="adminfeedback-list"]',
      title: "反饋卡片牆",
      desc: "依<b>最後更新時間</b>排序，最新的在前。每張卡片顯示狀態、發起者、內容摘要與附圖縮圖。",
      titleEn: "The feedback wall",
      descEn: "Ordered by <b>last update</b>, newest first. Each card shows the status, who started it, a preview, and an image thumbnail.",
      side: "top",
      align: "center",
    },
    {
      title: "詳情裡能做的事",
      desc: "進到一則反饋後：<b>標題旁的鉛筆</b>可改標題；一排<b>狀態 chip</b> 一鍵切換進度；右上角<b>刪除整串</b>會連同圖片一起清除。底部<b>回覆輸入列</b>能打字、附圖、貼截圖——回覆會以你目前的<em>身分</em>靠右顯示，送出後自動轉為<em>等待對方回應</em>。",
      titleEn: "What you can do inside",
      descEn: "Open a thread and: the <b>pencil</b> by the title edits it; a row of <b>status chips</b> switches progress in one tap; <b>Delete thread</b> top-right removes it and its images. The <b>reply box</b> takes text, attachments, and pasted screenshots — your reply shows on the right as your current <em>role</em>, and sending flips it to <em>waiting on the other side</em>.",
    },
    {
      title: "就這樣！",
      desc: "把<em>等待自己回應</em>清成 0，對方就都收到回覆了 👍<br>需要再看一次教學，按右下角的「<b>?</b>」。",
      titleEn: "That's it",
      descEn: "Clear <em>waiting on you</em> down to zero and the other side has heard back 👍<br>Need this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
