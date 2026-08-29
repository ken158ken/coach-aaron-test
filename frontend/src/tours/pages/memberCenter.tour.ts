/**
 * 會員中心（/member）導覽
 * @module tours/pages/memberCenter.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "member-center",
  title: "會員中心導覽",

  groups: {
    /** 頭像選擇彈窗——導覽會自動點頭像上的「更換頭貼」把它打開 */
    avatarPicker: {
      open: '[data-tour="member-avatar-edit"]',
      wait: '[data-tour-modal="member-avatar-picker"]',
      // 這個彈窗沒有 × 鈕，引擎會用 Escape 關掉
    },
  },

  steps: [
    {
      title: "歡迎來到會員中心",
      desc: "這裡是<b>你自己的地盤</b>：改名字、換頭貼、看課程、下載跟教練聊過的內容，都在這一頁。<br>花一分鐘帶你認識它，隨時可以按右上角 × 離開。",
    },
    {
      el: '[data-tour="member-stats"]',
      title: "你的學習紀錄",
      desc: "已購課程、完成課堂、累積學習天數一眼看完。<br>這三個數字會跟著你上課自動累加，<b>不用手動記錄</b>。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="member-tabs"]',
      title: "四個分頁",
      desc: "<b>個人資料</b>改名字頭貼、<b>我的課程</b>看買過什麼、<b>帳號設定</b>換密碼、<b>匯出資料</b>把對話存下來。<br>點一下就切換，資料不會不見。",
      side: "bottom",
      align: "start",
      only: "desktop",
    },
    {
      el: '[data-tour="member-tabs"]',
      title: "四個分頁",
      desc: "分頁列可以<b>左右滑動</b>，往右滑還有「帳號設定」與「匯出資料」。<br>切換分頁不會清掉你正在填的東西。",
      side: "bottom",
      align: "start",
      only: "mobile",
    },
    {
      el: '[data-tour="member-avatar"]',
      title: "換一張頭貼",
      desc: "把滑鼠移到頭像上（手機直接點），會出現<em>更換頭貼</em>。<br>右上角的小 ✕ 則是把現在的頭貼移除、換回預設圖案。<br>下一步直接幫你打開挑選畫面。",
      side: "right",
      align: "start",
    },
    {
      group: "avatarPicker",
      el: '[data-tour="avatar-picker-tabs"]',
      title: "三種頭貼來源",
      desc: "<b>上傳裁切</b>用自己的照片、<b>風格頭像</b>幫你畫一個卡通人物、<b>幾何頭像</b>是簡單的色塊圖案。<br>不想露臉就選後面兩種，選好按確認就換好了。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="member-display-name"]',
      title: "顯示名稱",
      desc: "教練和其他學員看到的就是這個名字，<b>最多 30 個字</b>，中英文和 emoji 都可以。<br>你的 Email 是登入帳號，這裡不能改。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="member-profile-save"]',
      title: "改完記得儲存",
      desc: "沒有動到名字時這顆是<b>灰的</b>——代表沒東西要存，這是正常的。<br>改完按下去，右下角會跳出成功提示。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="member-panel"]',
      title: "其他分頁在這裡顯示",
      desc: "切到<b>我的課程</b>可以直接跳去逛課程；<b>帳號設定</b>換密碼；<b>匯出資料</b>能把你和教練的對話下載成 <code>txt</code>、<code>Word</code>、<code>Excel</code> 留存。",
      side: "top",
      align: "start",
    },
    {
      el: '[data-tour="member-logout"]',
      title: "登出",
      desc: "共用電腦或手機借人用之前，記得從這裡登出。<br>下次回來用同一個帳號登入，資料都還在。",
      side: "bottom",
      align: "end",
    },
    {
      title: "就這樣，很簡單吧",
      desc: "有東西忘了怎麼用，<b>右下角那顆「?」</b>隨時可以再看一次這份導覽。<br>每一頁都有自己的說明，需要時按一下就好。",
    },
  ],
};

export default tour;
