/**
 * useCoachAccess — 判斷目前登入用戶是否能進教練儀表板
 *
 * 邏輯：
 *   - 未登入 → canAccess=false, loading=true 直到 authReady
 *   - 登入後取 /api/coach/profile 看教練 user_id
 *   - 若 user.user_id === coach.user_id → 是教練本人
 *   - 或 user.isAdmin === true → 開發期 admin 可預覽
 *
 * 回傳：{ canAccess, isCoach, isAdmin, authReady, loading }
 *
 * @module hooks/useCoachAccess
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { coachService, type CoachFullProfile } from "@/services/booking/coach.service";

export interface UseCoachAccessResult {
  canAccess: boolean;
  isCoach: boolean;
  isAdmin: boolean;
  authReady: boolean;
  loading: boolean;
  coachUserId: number | null;
}

export function useCoachAccess(): UseCoachAccessResult {
  const { user, isAdmin, authReady } = useAuth();
  const [coachUserId, setCoachUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setLoading(false);
      return;
    }
    // 先假設是 admin；admin 可以看，不一定要呼叫 /full
    // 但為了拿到 coach.user_id 判斷 isCoach，仍呼叫 /full（admin 可訪）
    coachService
      .getFullProfile()
      .then((p: CoachFullProfile) => setCoachUserId(p.user_id))
      .catch(() => setCoachUserId(null))
      .finally(() => setLoading(false));
  }, [authReady, user]);

  const isCoach =
    !!user && coachUserId !== null && Number(user.user_id) === Number(coachUserId);
  const canAccess = !!user && (isCoach || isAdmin);

  return {
    canAccess,
    isCoach,
    isAdmin,
    authReady,
    loading,
    coachUserId,
  };
}
