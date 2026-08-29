/**
 * 悄悄話（/admin/whispers）導覽
 * @module tours/pages/adminWhispers.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-whispers",
  title: "悄悄話導覽",
  titleEn: "Whispers tour",

  steps: [
    {
      title: "悄悄話",
      desc: "訪客不想公開留言時，會從前台的悄悄話把話丟進來。<br>這頁是<b>唯讀</b>的收件匣：只能看，不能改也不能刪。",
      titleEn: "Whispers",
      descEn: "When visitors would rather not comment in public, they send a whisper from your public site instead.<br>This inbox is <b>read-only</b>: you can read messages, but not edit or delete them.",
    },
    {
      el: '[data-tour="whispers-header"]',
      title: "先看這行小字",
      desc: "會告訴你目前<b>累積幾則</b>。訊息有保存期限、到期自動清掉，所以數字變少是正常的，不是你弄丟了。",
      titleEn: "Read the small print first",
      descEn: "It tells you <b>how many messages you have</b>. Whispers expire and are cleared automatically, so a shrinking count is normal — nothing went missing.",
      side: "bottom",
      align: "start",
    },
    {
      /*
       * 收件匣常常是空的（訊息會過期自動清掉），所以這一步錨在「整個列表區」，
       * 空的時候指到空狀態、有訊息時指到第一張卡，兩種情況都有東西可講。
       * 下面幾步才是有訊息時才出現的細節，沒訊息就自動跳過。
       */
      el: '[data-tour="whispers-list"]',
      title: "收件匣在這裡",
      desc: "所有悄悄話都會列在這一區，<b>由新到舊</b>排列。<br>看到「目前沒有悄悄話」不是壞掉——代表<b>還沒有人留言，或舊訊息已過期自動清掉</b>了。",
      titleEn: "The inbox",
      descEn: "Every whisper lands in this area, <b>newest first</b>.<br>An empty list is not a fault — it means <b>nobody has written in yet, or older messages have already expired</b>.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="whispers-card"]',
      title: "一則一張卡",
      desc: "由新到舊排列，最上面的就是<b>最新一則</b>。沒有已讀／未讀狀態，建議養成固定時間掃一遍的習慣。",
      titleEn: "One card per message",
      descEn: "Newest at the top, so the first card is the <b>latest whisper</b>. There is no read/unread state, so make a habit of scanning the list at a set time.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="whispers-contact"]',
      title: "他是誰、怎麼回",
      desc: "上面是稱呼、下面是<b>他留的聯絡方式</b>（Email、電話或 IG 都可能）。<br>系統不會自動通知對方，要回覆得<em>自己主動聯絡</em>。",
      titleEn: "Who wrote in, and how to reach them",
      descEn: "The name sits on top, their <b>contact details</b> below — email, phone or Instagram.<br>Nothing is sent back automatically, so to reply you have to <em>get in touch yourself</em>.",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="whispers-message"]',
      title: "訊息內容",
      desc: "訪客原文照登。因為到期就會消失，<b>談成的合作或重要資訊請自行另存</b>一份，別把這裡當長期紀錄。",
      titleEn: "The message itself",
      descEn: "The visitor's own words, unedited. Because whispers disappear when they expire, <b>save anything that matters somewhere else</b> — a deal, a phone number. This is not a long-term record.",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="whispers-expiry"]',
      title: "倒數提醒",
      desc: "右上角是留言時間與剩餘天數。標籤<b>轉黃代表剩一週內</b>、<b>轉紅代表剩三天內</b>——看到紅的就優先處理。",
      titleEn: "The countdown",
      descEn: "Top right shows when it arrived and how many days are left. The tag <b>turns amber under a week</b> and <b>red under three days</b> — handle the red ones first.",
      side: "left",
      align: "start",
    },
    {
      /* 側邊欄的入口——沒有未讀紅點，所以要靠自己定期回來看 */
      el: '[data-tour="admin-nav-whispers"]',
      title: "養成定期查看的習慣",
      desc: "這個入口<b>不會跳未讀紅點</b>，訊息也不會寄信通知你。<br>因為留言有期限，建議<b>每週固定進來掃一次</b>，才不會錯過潛在客戶。",
      titleEn: "Check in on a schedule",
      descEn: "This link <b>never shows an unread badge</b>, and no email goes out when a whisper arrives.<br>Since messages expire, <b>scan this page once a week</b> so you don't lose a potential client.",
      side: "right",
      align: "center",
      only: "desktop",
    },
    {
      el: '[data-tour="whispers-note"]',
      title: "為什麼不能刪",
      desc: "刻意設計成唯讀，避免有人不小心把客戶留言清掉；清理交給排程自動處理，你只要負責看與回。",
      titleEn: "Why nothing can be deleted",
      descEn: "Read-only is deliberate, so nobody wipes a client's message by accident. Cleanup runs on a schedule — your job is only to read and reply.",
      side: "top",
      align: "center",
    },
    {
      el: '[data-tour="admin-sidebar"]',
      title: "導覽完成",
      desc: "只有<b>白名單裡的管理員</b>看得到這一頁，訪客的隱私是安全的。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "Only <b>admins on the whitelist</b> can open this page, so your visitors' privacy is safe.<br><b>Every page has a “?” in the bottom-right corner</b> — press it whenever you want the tour again.",
      side: "right",
      align: "start",
      only: "desktop",
    },
    {
      title: "導覽完成",
      desc: "要換到其他管理頁，按<b>左上角這顆選單鈕</b>就會滑出完整清單。<br>只有<b>白名單裡的管理員</b>看得到這一頁，訪客的隱私是安全的。<br><b>每一頁右下角都有這顆「?」</b>，需要時再按一次就好。",
      titleEn: "That's the tour",
      descEn: "To move to another admin page, tap the <b>menu button in the top-left</b> for the full list.<br>Only <b>admins on the whitelist</b> can open this page, so your visitors' privacy is safe.<br><b>Every page has a “?” in the bottom-right corner</b> — tap it whenever you want the tour again.",
      el: '[data-tour="admin-sidebar-toggle"]',
      side: "bottom",
      align: "start",
      only: "mobile",
    },
  ],
};

export default tour;
