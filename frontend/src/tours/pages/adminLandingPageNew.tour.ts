/**
 * 新增 Landing Page — 模板挑選（/admin/landing-pages/new）導覽
 *
 * 獨立全頁路由，不在 AdminLayout 之下，所以結語不引用側邊欄錨點。
 * @module tours/pages/adminLandingPageNew.tour
 */

import type { TourDefinition } from "../types";

const tour: TourDefinition = {
  id: "admin-landing-page-new",
  title: "選擇 Landing Page 模板導覽",

  steps: [
    {
      title: "先挑一份模板",
      desc: "新的 Landing Page 都是<b>從模板複製</b>出來的：版型、動畫、區塊順序先決定好，之後你只要換文字和圖片。<br>模板本身不會被改動，同一份可以重複拿來開好幾個檔期。",
    },
    {
      el: '[data-tour="lpnew-search"]',
      title: "搜尋模板",
      desc: "打字就會即時過濾（約半秒後生效），比對模板名稱、品牌名與標題。<b>只會找目前這一頁</b>的模板，找不到記得翻下一頁。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="lpnew-kind-filter"]',
      title: "依用途分類",
      desc: "與其一張張看縮圖，不如先想「這頁要做什麼」——招生、活動報名、還是形象介紹？用這個下拉選單縮小範圍，剩下的都是版型合適的。",
      side: "bottom",
      align: "start",
    },
    {
      el: '[data-tour="lpnew-grid"]',
      title: "模板卡片",
      desc: "點一下就選取，卡片會亮起金框並打勾。<em>可以隨時改點別張</em>，在按下建立之前都還沒有任何東西被寫進資料庫。",
      side: "right",
      align: "start",
    },
    {
      el: '[data-tour="lpnew-panel"]',
      title: "右側確認區",
      desc: "選好之後這裡會帶出模板資訊與大張預覽圖，順便讓你確認「是不是真的想要這一版」。<br>還沒選任何模板時它會提示你先點左邊。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="lpnew-name"]',
      title: "專案名稱",
      desc: "這是<b>給你自己看的</b>後台名稱，不會出現在公開頁上。建議寫得能認出檔期，例如「2026 春季特訓班」，日後列表一多才好找。<br>建立後隨時可以改。",
      side: "left",
      align: "start",
    },
    {
      el: '[data-tour="lpnew-confirm"]',
      title: "建立並開始編輯",
      desc: "按下去會建好專案並<b>直接跳進編輯器</b>。新專案預設是<em>草稿</em>，還不會對外公開，可以慢慢改完再發布。",
      side: "left",
      align: "end",
    },
    {
      el: '[data-tour="lpnew-back"]',
      title: "導覽完成",
      desc: "不想建了就從這裡返回列表，按 <code>Esc</code> 也可以。<br><b>右下角的「?」隨時可以再看一次</b>這份導覽。",
      side: "bottom",
      align: "start",
    },
  ],
};

export default tour;
