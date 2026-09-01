/**
 * 拖曳落點的 sort_order 計算（看板卡片與後台筆記本共用同一套算法）
 * @module components/notes/sortOrder
 *
 * `note_pages.sort_order` 與 `notebooks.sort_order` 都是 DOUBLE PRECISION
 * （039 / 040 SQL），所以插入位置可以直接取前後鄰居的**中點**，一次 PATCH
 * 就搞定，不必把整串重新編號 —— 這是拖曳能「一次往返」的關鍵。
 */

/**
 * 插進 `orders[index]` 這個位置時該用的新 sort_order。
 *
 * @param orders 目標清單目前的 sort_order（升冪，**已排除被拖曳的那一筆**）
 * @param index  要插進 orders 的哪個位置（0 ~ orders.length）
 *
 * 邊界：
 *   - 清單空的 → `Date.now()`（與後端建立時的預設值同源，不會撞到既有值）
 *   - 插最前 → 首筆 −1；插最後 → 末筆 +1
 *   - double precision 用盡（前後值已相鄰到無法再切）→ 退回「放在 prev 之後」，
 *     順序會與鄰居相同但不會炸；下次拖曳仍可再分。
 */
export function sortOrderForIndex(
  orders: readonly number[],
  index: number,
): number {
  const prev = orders[index - 1];
  const next = orders[index];
  if (prev === undefined && next === undefined) return Date.now();
  if (prev === undefined) return next - 1;
  if (next === undefined) return prev + 1;
  const mid = (prev + next) / 2;
  return mid > prev && mid < next ? mid : prev + 1;
}

export default sortOrderForIndex;
