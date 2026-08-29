/**
 * 新手教學引導 — 執行引擎（**僅在 client 端載入**）
 * @module tours/engine/tourEngine
 *
 * @description
 * 這個模組直接 `import` driver.js 與它的 CSS，因此**絕對不可以**被 SSR 期間執行到。
 * 唯一的進入方式是 `useTour.ts` 裡的 `await import("./engine/tourEngine")`——
 * Vite 會把 driver.js + driver.css + tour.css 打成一個 async chunk，
 * 只有使用者真的按下「?」時才下載，SSR bundle 也不會去執行它。
 *
 * 引擎在 driver.js 之上補了三件事：
 *  1. **RWD**：依 `isMobile` 挑 `elMobile` / 過濾 `only` 步驟。
 *  2. **modal 導覽**：走到 `group` 步驟時自動點開對應彈窗、等它出現；
 *     離開群組或導覽結束時自動關閉。
 *  3. **容錯**：任何找不到的元素／開不起來的彈窗都往下一步跳，永不 throw。
 */

import { driver, type Config, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "../tour.css";
import type { ResolvedStep, TourDefinition, TourSide } from "../types";

/** popover 額外掛的 class，用來提高 CSS 覆寫的優先權 */
const POPOVER_CLASS = "aaron-tour";

/**
 * 聚焦元素的標記屬性。
 *
 * driver.js 自己會在被聚焦的元素上加 `.driver-active-element` class，但那個 class
 * 撐不過 React 的重繪：`className` 是 React 管理的 prop，元件一旦重新渲染就會被
 * 覆寫回去，金色外框因此會時有時無（在 modal 裡特別明顯，表單每打一個字就重繪）。
 * 改用自訂 data 屬性就穩了 —— React 不會去動它沒設定過的屬性。
 * 挖洞的遮罩是 driver 依元素座標畫的，不受影響；這裡補的只是外框。
 */
const ACTIVE_ATTR = "data-tour-active";

/** driver.js 給「置中說明卡」用的假元素，不該被畫外框 */
const DUMMY_ID = "driver-dummy-element";

function clearActiveMark(): void {
  document
    .querySelectorAll(`[${ACTIVE_ATTR}]`)
    .forEach((n) => n.removeAttribute(ACTIVE_ATTR));
}

/** 等待元素出現的上限（ms）——涵蓋 modal 的進場動畫與資料載入 */
const WAIT_APPEAR_MS = 3000;
/** 等待元素消失的上限（ms） */
const WAIT_GONE_MS = 1200;
/** 彈窗出現後額外的緩衝，讓 framer-motion 的位移動畫落定再量測位置 */
const SETTLE_MS = 260;
/** 開場前等「資料還在載入」的錨點出現的上限（ms），逾時就當它不存在 */
const SETTLE_APPEAR_MS = 1600;
/** 導覽途中，非 modal 步驟的錨點還沒出現時再等一下的上限（ms） */
const STEP_APPEAR_MS = 700;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 找元素——**優先回傳「看得見的那一個」**。
 *
 * 站上的響應式元件（例如 `DataTable`）會把桌機表格與手機卡片<b>兩套都渲染進 DOM</b>，
 * 靠 `hidden md:block` / `md:hidden` 決定顯示哪一套。這時 `querySelector` 只會拿到
 * 文件順序上的第一個，也就是桌機那份——在手機上它 `display:none`、量不到尺寸，
 * 整個步驟就會被當成「元素不存在」而跳掉。
 * 所以這裡掃過所有符合的節點，挑第一個真的有面積的；都看不見才退回第一個。
 */
const q = (sel?: string): HTMLElement | null => {
  if (!sel) return null;
  try {
    const nodes = document.querySelectorAll<HTMLElement>(sel);
    if (nodes.length === 0) return null;
    for (const node of nodes) {
      if (isVisible(node)) return node;
    }
    return nodes[0];
  } catch {
    // 選擇器寫錯不該炸掉整個導覽
    return null;
  }
};

/** 元素存在且真的看得到（有佔位面積） */
const isVisible = (el: HTMLElement | null): el is HTMLElement => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

/** 輪詢等待選擇器出現且可見 */
async function waitForEl(sel: string, timeout = WAIT_APPEAR_MS): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = q(sel);
    if (isVisible(el)) return el;
    if (Date.now() > deadline) return null;
    await sleep(60);
  }
}

/** 輪詢等待選擇器消失 */
async function waitForGone(sel: string, timeout = WAIT_GONE_MS): Promise<void> {
  const deadline = Date.now() + timeout;
  while (isVisible(q(sel)) && Date.now() < deadline) {
    await sleep(50);
  }
}

/**
 * 有寫入副作用的按鈕字樣。
 *
 * 導覽只會「點開彈窗／關閉彈窗」，**永遠不該**按到會改資料庫的按鈕。
 * 但 `groups[x].open` 是純資料，寫錯一個選擇器就可能指到「儲存」或「刪除」——
 * 在正式站上那是不可逆的。所以真正按下去之前再攔一道，
 * 寧可整組步驟被跳過，也不能誤觸。
 */
const DESTRUCTIVE_TEXT =
  /儲存|存檔|保存|送出|提交|發佈|發布|上架|刪除|移除|清除|上傳|建立|新增並|確認送出|save|submit|delete|remove|publish|upload|create/i;

/**
 * 這顆按鈕點下去安不安全？
 *
 * 擋兩種：`type="submit"`（會送出表單）與字面上就在說「我要寫入」的按鈕。
 * 彈窗的關閉鈕（`data-tour-modal-close`）與背景遮罩是結構性的關閉手段，
 * 由元件本身提供、不帶業務邏輯，直接放行。
 */
function isSafeToClick(el: HTMLElement): boolean {
  if (el.hasAttribute("data-tour-modal-close") || el.hasAttribute("data-tour-modal-backdrop")) {
    return true;
  }
  // `<button>` 沒寫 type 時預設就是 submit，所以只有「真的在表單裡」才算會送出。
  // 否則會誤擋掉一堆只是忘了寫 type="button" 的正常開窗鈕。
  if (el instanceof HTMLButtonElement && el.type === "submit" && el.form) return false;
  const label = `${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""}`;
  return !DESTRUCTIVE_TEXT.test(label);
}

/** 安全地點一顆按鈕；被判定為危險就不點並回報 false */
function safeClick(el: HTMLElement | null): boolean {
  if (!el) return false;
  if (!isSafeToClick(el)) {
    if (import.meta.env.DEV) {
      console.warn("[tour] 拒絕點擊可能有寫入副作用的元素", el);
    }
    return false;
  }
  el.click();
  return true;
}

/**
 * 送一顆 Escape，給既沒有關閉鈕、也沒有背景遮罩可點的彈窗用。
 *
 * ⚠️ driver.js 自己也在監聽 Escape（`allowKeyboardControl`），一顆合成的 Escape
 * 會同時被彈窗和 driver 收到，結果是「關掉彈窗的同時把整段導覽也關了」。
 * 所以這裡先把 driver 的鍵盤控制暫時關掉——它是在事件發生的當下才讀這個設定，
 * 因此改完立刻生效、事後再還原即可。
 */
function pressEscape(instance: Driver): void {
  const config = instance.getConfig();
  instance.setConfig({ ...config, allowKeyboardControl: false });
  const init: KeyboardEventInit = { key: "Escape", code: "Escape", keyCode: 27, bubbles: true };
  document.dispatchEvent(new KeyboardEvent("keydown", init));
  document.dispatchEvent(new KeyboardEvent("keyup", init));
  instance.setConfig({ ...config, allowKeyboardControl: true });
}

export interface RunTourOptions {
  /** 是否為手機版版面（由 useTour 依 matchMedia 判定） */
  isMobile: boolean;
  /** 導覽結束（完成或中途關閉）時呼叫 */
  onFinish?: () => void;
}

/** `runTour` 的回傳值，讓呼叫端可以在 unmount 時強制收掉 */
export interface TourHandle {
  destroy: () => void;
  isActive: () => boolean;
}

/**
 * 執行一份導覽定義。
 *
 * @param def - 頁面的導覽定義
 * @param options - 裝置資訊與結束 callback
 * @returns 控制把手；沒有任何可用步驟時回傳 null
 */
export async function runTour(
  def: TourDefinition,
  options: RunTourOptions,
): Promise<TourHandle | null> {
  const { isMobile, onFinish } = options;

  // ── 1. 依裝置解析步驟 ──────────────────────────────────
  const resolved: ResolvedStep[] = def.steps
    .filter((s) => !s.only || (s.only === "mobile") === isMobile)
    .map((s) => ({
      step: s,
      selector: isMobile && s.elMobile ? s.elMobile : s.el,
    }));

  /*
   * 開場前先等一下「還沒出現的錨點」。
   *
   * 步驟清單一旦定下來就不會再變，所以如果在這個瞬間某個區塊的資料還在載入
   * （正式站的清單頁很常見：清單比頁面骨架晚幾百毫秒才畫出來），
   * 那一步就會被永遠剔除 —— 同一頁時快時慢，導覽步數還會忽多忽少。
   * 這裡對所有「不在 modal 裡、目前又找不到」的錨點併發等一小段時間，
   * 真的不存在的（例如空收件匣的訊息卡）等滿就放棄，總延遲有上限。
   */
  const pending = resolved.filter(
    (r) => !r.step.group && r.selector && !isVisible(q(r.selector)),
  );
  if (pending.length > 0) {
    await Promise.all(pending.map((r) => waitForEl(r.selector!, SETTLE_APPEAR_MS)));
  }

  // modal 內的步驟現在當然找不到元素（彈窗還沒開），所以只預先剔除
  // 「不在群組內、又確實不存在」的步驟。沒有 selector 的是置中說明卡，保留。
  const steps = resolved.filter(
    (r) => r.step.group || !r.selector || isVisible(q(r.selector)),
  );

  if (steps.length === 0) return null;

  /**
   * 手機版把 `left` / `right` 一律改成垂直方位。
   *
   * popover 至少要 280px 左右才擺得下，390px 寬的手機扣掉目標元素根本沒有
   * 水平空間，driver.js 硬擺的結果就是<b>整張卡蓋在要你看的東西上面</b>。
   * 垂直方向才有餘裕，driver 也會在下方不夠時自動翻到上方。
   */
  const sideFor = (r: ResolvedStep): TourSide => {
    const side = r.step.side ?? "bottom";
    if (isMobile && (side === "left" || side === "right")) return "bottom";
    return side;
  };

  const driveSteps: DriveStep[] = steps.map((r) => ({
    // 傳「解析好的元素」而不是選擇器字串：driver.js 自己查會拿到文件順序的第一個，
    // 響應式雙版面下那可能是隱藏的桌機版。查不到就先留字串，等 goTo 再補。
    element: (r.selector ? (q(r.selector) ?? r.selector) : undefined) as DriveStep["element"],
    popover: {
      title: r.step.title,
      description: r.step.desc,
      ...(r.selector ? { side: sideFor(r), align: r.step.align ?? "start" } : {}),
    },
  }));

  // ── 2. modal 群組狀態機 ────────────────────────────────
  let openGroup: string | null = null;
  /** 開過但失敗的群組，記下來避免每一步都重試一次（拖慢導覽） */
  const failedGroups = new Set<string>();
  let destroyed = false;
  /** 防止 async 轉場期間使用者連點造成競態 */
  let busy = false;

  /**
   * 關閉目前開著的 modal 群組。由精準到不得已依序嘗試：
   *  1. 群組指定的關閉鈕（最精準）
   *  2. 該彈窗自己的 × 鈕（`overlay/Modal` 會掛 `data-tour-modal-close`）
   *  3. 彈窗的背景遮罩（`Dialog` 會掛 `data-tour-modal-backdrop`）
   *  4. 合成 Escape（會暫時關掉 driver 的鍵盤控制，避免連導覽一起關掉）
   *
   * 站上有兩套彈窗元件，提供的關閉手段不一樣（`Dialog` 只有遮罩、
   * `overlay/Modal` 只有 × 鈕），所以這裡不能只認其中一種。
   * 而「群組沒開著任何彈窗」代表它是分頁切換之類的非 modal 群組——
   * 這時什麼都不做，尤其不能亂發 Escape 到頁面上。
   */
  async function closeCurrentGroup(): Promise<void> {
    const name = openGroup;
    if (!name) return;
    openGroup = null;
    const g = def.groups?.[name];
    if (!g) return;

    const explicit = q(g.close);
    if (explicit) {
      safeClick(explicit);
      await waitForGone(g.wait);
      return;
    }

    // 沒有彈窗開著 → 這是分頁切換之類的非 modal 群組，沒東西要關，
    // 尤其不能亂發 Escape 到頁面上
    const openPanel = q(`${g.wait}[data-tour-modal]`) ?? q("[data-tour-modal]");
    if (!isVisible(openPanel)) return;

    // 只在「這個彈窗自己」的範圍內找關閉鈕，避免關到別的彈窗
    const ownClose = openPanel.querySelector<HTMLElement>("[data-tour-modal-close]");
    if (ownClose) ownClose.click();
    else {
      const backdrop = q("[data-tour-modal-backdrop]");
      if (backdrop) backdrop.click();
      else pressEscape(instance);
    }

    await waitForGone(g.wait);
  }

  async function ensureGroup(name: string): Promise<boolean> {
    if (openGroup === name) return true;
    if (failedGroups.has(name)) return false;

    const g = def.groups?.[name];
    if (!g) {
      failedGroups.add(name);
      return false;
    }

    await closeCurrentGroup();

    // 彈窗可能本來就開著（使用者自己開的）——那就直接沿用
    if (!isVisible(q(g.wait))) {
      const openSel = isMobile && g.openMobile ? g.openMobile : g.open;
      const btn = q(openSel);
      // 點不得（不存在，或是「儲存／刪除」這類有寫入副作用的鈕）→ 整組跳過
      if (!safeClick(btn)) {
        failedGroups.add(name);
        return false;
      }
      const appeared = await waitForEl(g.wait);
      if (!appeared) {
        failedGroups.add(name);
        return false;
      }
    }

    await sleep(SETTLE_MS);
    openGroup = name;
    return true;
  }

  // ── 3. 轉場：往 dir 方向找到第一個「真的能導」的步驟 ────
  let current = 0;

  /*
   * 晚到的版面位移補正。
   *
   * popover 的座標是「highlight 當下」算好的，之後就不會自己更新了。
   * 但編輯器這類頁面上方常有懶載入的圖片與自訂字體，它們載完會把內容往下推——
   * 等使用者看到時，原本在 popover 上方的目標已經<b>滑到 popover 底下被蓋住</b>。
   * 所以每次換步都排兩次 refresh()，讓 driver 依最新座標重擺一次。
   */
  let repositionTimers: number[] = [];
  /** refresh() 可能再觸發 onHighlighted，用這個旗標避免無限重排 */
  let repositioning = false;

  function clearReposition(): void {
    repositionTimers.forEach((t) => clearTimeout(t));
    repositionTimers = [];
  }

  function scheduleReposition(): void {
    clearReposition();
    for (const delay of [400, 1000]) {
      repositionTimers.push(
        window.setTimeout(() => {
          if (destroyed || !instance.isActive()) return;
          repositioning = true;
          try {
            instance.refresh();
          } finally {
            repositioning = false;
          }
        }, delay),
      );
    }
  }

  async function goTo(target: number, dir: 1 | -1): Promise<void> {
    if (busy || destroyed) return;
    busy = true;
    try {
      let i = target;
      while (i >= 0 && i < steps.length) {
        const r = steps[i];

        if (r.step.group) {
          const ok = await ensureGroup(r.step.group);
          if (!ok) {
            i += dir;
            continue;
          }
        } else if (openGroup) {
          await closeCurrentGroup();
        }

        if (destroyed) return;

        // 群組開了之後元素才會出現；再給它一點時間（表單分頁、懶載入）。
        // 非群組步驟也給一段較短的等待——彈窗關掉後列表重繪需要一兩幀。
        if (r.selector && !isVisible(q(r.selector))) {
          const found = await waitForEl(
            r.selector,
            r.step.group ? 1200 : STEP_APPEAR_MS,
          );
          if (!found) {
            i += dir;
            continue;
          }
        }

        // await 期間使用者可能已按 Escape 關掉導覽 —— 別在銷毀的實例上復活 highlight
        if (destroyed) return;

        // 元素可能在等待期間才出現、或 React 重繪換了節點；
        // 移動前重新解析一次，確保指到的是「現在畫面上看得見」的那一個。
        if (r.selector) {
          const el = q(r.selector);
          if (el) driveSteps[i].element = el;
        }

        current = i;
        instance.moveTo(i);
        return;
      }

      // 兩端都走完了 → 結束導覽
      instance.destroy();
    } finally {
      busy = false;
    }
  }

  // ── 4. driver 實例 ────────────────────────────────────
  const config: Config = {
    steps: driveSteps,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    allowKeyboardControl: true,
    overlayColor: "#050505",
    overlayOpacity: 0.74,
    stagePadding: isMobile ? 4 : 8,
    stageRadius: 10,
    popoverClass: POPOVER_CLASS,
    popoverOffset: 12,
    /**
     * 刻意保持 false（預設值）。driver.js 的 `hasNextStep()` 會拿
     * `skipMissingElement` 去掃後面的步驟，開成 true 的話——因為 modal 步驟的
     * 元素此刻本來就不存在——它會誤判「沒有下一步」而把按鈕寫成「完成」。
     * 跳步邏輯由下面的 `goTo()` 自己負責，比 driver 內建的更清楚。
     */
    skipMissingElement: false,
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    progressText: "{{current}} / {{total}}",
    nextBtnText: "下一步",
    prevBtnText: "上一步",
    doneBtnText: "完成",

    // 導覽節奏由我們接管（要先開／關 modal 再移動）
    onNextClick: () => {
      void goTo(current + 1, 1);
    },
    onPrevClick: () => {
      if (current === 0) return;
      void goTo(current - 1, -1);
    },

    onHighlighted: (el) => {
      clearActiveMark();
      if (el instanceof HTMLElement && el.id !== DUMMY_ID) {
        el.setAttribute(ACTIVE_ATTR, "");
      }
      // refresh() 造成的重新 highlight 不必再排一輪，否則會自己疊自己
      if (!repositioning) scheduleReposition();
    },

    onDeselected: () => {
      clearActiveMark();
    },

    onPopoverRender: (popover) => {
      // 讓關閉鈕有語意標籤；driver.js 預設只有一個 ×
      popover.closeButton.setAttribute("aria-label", "結束導覽");
      popover.wrapper.setAttribute("data-tour-popover", def.id);
    },

    onDestroyed: () => {
      if (destroyed) return;
      destroyed = true;
      clearReposition();
      clearActiveMark();
      // 導覽結束就把我們開過的彈窗收乾淨
      void closeCurrentGroup().finally(() => onFinish?.());
    },
  };

  const instance: Driver = driver(config);

  // `moveTo()` 不會做初始化（不掛遮罩、不綁鍵盤），所以一定要先 drive() 一次。
  instance.drive(0);
  // 第一步若是 modal 步驟或元素還沒出現，再交給 goTo 補開彈窗／往後找。
  // （慣例上每份導覽的第一步都是置中的歡迎卡，所以這裡通常不會觸發。）
  const first = steps[0];
  if (first.step.group || (first.selector && !isVisible(q(first.selector)))) {
    void goTo(0, 1);
  }

  return {
    destroy: () => {
      if (!destroyed && instance.isActive()) instance.destroy();
    },
    isActive: () => !destroyed && instance.isActive(),
  };
}
