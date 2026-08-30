/**
 * 意見反饋後台（/admin/feedback）導覽 — 教練視角
 * @module tours/pages/adminFeedback.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-feedback",
  title: "意見反饋後台導覽",
  titleEn: "Feedback admin tour",

  steps: [
    {
      title: "意見反饋後台",
      desc: "學員送出的每一則反饋都收在這裡。你可以<b>回覆、切換狀態、編輯標題，或整串刪除</b>。側邊欄「意見反饋」旁的<b>紅圈數字</b>＝目前<em>等待教練回應</em>的則數，看到就知道有幾件待處理。",
      titleEn: "Feedback admin",
      descEn: "Every piece of feedback a member sends lands here. You can <b>reply, switch status, edit the title, or delete the whole thread</b>. The <b>red badge</b> next to \"Feedback\" in the sidebar is how many are <em>waiting on the coach</em> right now.",
    },
    {
      el: '[data-tour="adminfeedback-stats"]',
      title: "狀態統計 + 篩選",
      desc: "每個籤同時是<b>計數</b>與<b>篩選鈕</b>：點<em>等待教練回應</em>就只看待你處理的；點<em>全部</em>回到完整清單。",
      titleEn: "Status counts + filter",
      descEn: "Each chip is both a <b>count</b> and a <b>filter</b>: tap <em>Waiting on coach</em> to see only what needs you; tap <em>All</em> to go back to the full list.",
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
      desc: "依<b>最後更新時間</b>排序，最新的在前。每張卡片顯示狀態、學員名、內容摘要與附圖縮圖。",
      titleEn: "The feedback wall",
      descEn: "Ordered by <b>last update</b>, newest first. Each card shows the status, the member's name, a preview, and an image thumbnail.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="adminfeedback-card"]',
      title: "點開一張卡片",
      desc: "點卡片進入詳情，就能看到完整對話並回覆。",
      titleEn: "Open a card",
      descEn: "Tap a card to open the thread, read the full conversation, and reply.",
      side: "top",
      align: "start",
    },
    {
      title: "詳情裡能做的事",
      desc: "進到一則反饋後：<b>標題旁的鉛筆</b>可改標題；一排<b>狀態 chip</b> 一鍵切換進度（回覆後會自動轉為<em>等待學員回應</em>）；右上角<b>刪除整串</b>會連同圖片一起清除。底部<b>回覆輸入列</b>能打字、附圖、貼截圖——你的回覆會以<em>教練</em>身分靠右顯示。",
      titleEn: "What you can do inside",
      descEn: "Open a thread and: the <b>pencil</b> by the title edits it; a row of <b>status chips</b> switches progress in one tap (replying auto-sets it to <em>Waiting on member</em>); <b>Delete thread</b> top-right removes it and its images. The <b>reply box</b> takes text, attachments, and pasted screenshots — your reply shows on the right as the <em>coach</em>.",
    },
    {
      title: "就這樣！",
      desc: "把<em>等待教練回應</em>清成 0，學員就都收到回覆了 👍<br>需要再看一次教學，按右下角的「<b>?</b>」。",
      titleEn: "That's it",
      descEn: "Clear <em>Waiting on coach</em> down to zero and every member has heard back 👍<br>Need this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
