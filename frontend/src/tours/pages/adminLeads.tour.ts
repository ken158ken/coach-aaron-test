/**
 * 表單報名後台（/admin/leads）導覽 — 教練視角
 * @module tours/pages/adminLeads.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-leads",
  title: "表單報名後台導覽",
  titleEn: "Sign-ups admin tour",

  steps: [
    {
      title: "表單報名後台",
      desc: "訪客在 Landing Page 填的<b>預約／報名表單</b>，現在全部收在這裡（以前只會寄 email，後台看不到）。你可以<b>追蹤處理進度、加備註、直接聯絡對方，或刪除</b>。側邊欄「表單報名」旁的<b>紅圈數字</b>＝目前<em>待聯繫</em>的筆數。",
      titleEn: "Sign-ups admin",
      descEn: "Every <b>booking / sign-up form</b> a visitor fills on a landing page now lands here (before, it only went out by email). You can <b>track progress, add notes, contact them directly, or delete</b>. The <b>red badge</b> next to \"Sign-ups\" in the sidebar counts how many are <em>still to contact</em>.",
    },
    {
      el: '[data-tour="adminleads-stats"]',
      title: "狀態統計 + 篩選",
      desc: "每個籤同時是<b>計數</b>與<b>篩選鈕</b>：<em>待聯繫／已聯繫／已預約／已結案／垃圾</em>。點<em>待聯繫</em>只看還沒處理的；點<em>全部</em>回到完整清單。",
      titleEn: "Status counts + filter",
      descEn: "Each chip is both a <b>count</b> and a <b>filter</b>: <em>To contact / Contacted / Booked / Closed / Spam</em>. Tap <em>To contact</em> to see only what's pending; tap <em>All</em> for the full list.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="adminleads-search"]',
      title: "搜尋",
      desc: "用<b>姓名、電話或 Email</b> 關鍵字快速找到某一筆報名。",
      titleEn: "Search",
      descEn: "Find a specific sign-up fast by <b>name, phone, or email</b>.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="adminleads-size"]',
      title: "顯示密度",
      desc: "卡片太大或太小？用<b>大／中／小</b>切換一次看更多或看更清楚，偏好會記在這台裝置。",
      titleEn: "Display density",
      descEn: "Cards too big or too small? Toggle <b>L / M / S</b> to fit more or read easier — remembered on this device.",
      side: "bottom",
      align: "end",
    },
    {
      el: '[data-tour="adminleads-list"]',
      title: "報名卡片牆",
      desc: "依<b>報名時間</b>排序，最新的在前。每張卡片顯示狀態、姓名、電話、來源頁面與摘要前幾行；若你加過備註，也會浮現在卡片底部。",
      titleEn: "The sign-up wall",
      descEn: "Ordered by <b>sign-up time</b>, newest first. Each card shows status, name, phone, source page, and the first lines of the summary; any note you added peeks at the bottom.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="adminleads-card"]',
      title: "點開一筆報名",
      desc: "點卡片進入詳情，就能看到完整逐題回答與所有聯絡方式。",
      titleEn: "Open a sign-up",
      descEn: "Tap a card to open it and see every answer and all contact methods.",
      side: "top",
      align: "start",
    },
    {
      title: "詳情裡能做的事",
      desc: "進到一筆報名後：一排<b>狀態 chip</b> 一鍵更新進度；<b>聯絡資訊</b>的電話、Email、LINE、Instagram 都可<em>直接點擊</em>撥號或開啟；下方是<b>逐題回答</b>與<b>報名摘要</b>；最底部的<b>教練備註</b>只有你看得到，記完按「儲存備註」；右上角可<b>刪除</b>整筆。",
      titleEn: "What you can do inside",
      descEn: "Open a sign-up and: a row of <b>status chips</b> updates progress in one tap; in <b>Contact details</b>, phone / email / LINE / Instagram are all <em>clickable</em> to call or open; below are the <b>answers</b> and the <b>summary</b>; the <b>coach note</b> at the bottom is private to you — hit \"Save note\" when done; <b>delete</b> is top-right.",
    },
    {
      title: "就這樣！",
      desc: "把<em>待聯繫</em>清成 0，每位報名的人都跟進到了 👍<br>需要再看一次教學，按右下角的「<b>?</b>」。",
      titleEn: "That's it",
      descEn: "Clear <em>To contact</em> down to zero and every lead has been followed up 👍<br>Need this tour again? The <b>?</b> in the bottom right.",
    },
  ],
};

export default tour;
