/**
 * @fileoverview 管理員後台路由
 * 處理使用者管理、白名單管理、訂單管理及統計數據
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { UpdateUserData, UpdateWhitelistData } from "../types/database.js";

const router: Router = express.Router();

// 所有管理員路由都需要驗證
router.use(authenticateToken);
router.use(requireAdmin);

// ===== 使用者管理 =====

/**
 * 取得所有使用者（分頁及搜尋）
 * @route GET /api/admin/users
 */
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from("users")
      .select(
        "user_id, username, email, display_name, avatar_url, avatar_base64, sex, phone_number, is_active, email_verified, last_login_at, created_at",
        { count: "exact" },
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,username.ilike.%${search}%,display_name.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 取得管理員白名單
    const { data: adminList } = await supabaseAdmin
      .from("admin_whitelist")
      .select("email")
      .eq("is_active", true);

    const adminEmails = new Set(
      adminList?.map((a: { email: string }) => a.email) || [],
    );

    const usersWithAdmin = data?.map(
      (user: { email: string; [key: string]: unknown }) => ({
        ...user,
        isAdmin: adminEmails.has(user.email),
      }),
    );

    res.json({
      users: usersWithAdmin,
      total: count,
      page: parseInt(page as string),
      totalPages: Math.ceil((count || 0) / Number(limit)),
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "取得使用者失敗" });
  }
});

/**
 * 更新使用者資訊
 * @route PUT /api/admin/users/:id
 */
router.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sex, isActive, displayName } = req.body;

    const updateData: UpdateUserData = {};
    if (sex !== undefined) updateData.sex = sex;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (displayName !== undefined) updateData.display_name = displayName;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("user_id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "更新使用者失敗" });
  }
});

/**
 * 刪除使用者（軟刪除）
 * @route DELETE /api/admin/users/:id
 */
router.delete(
  "/users/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("users")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("user_id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ error: "刪除使用者失敗" });
    }
  },
);

// ===== 管理員白名單 =====

/**
 * 取得白名單
 * @route GET /api/admin/whitelist
 */
router.get("/whitelist", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_whitelist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get whitelist error:", err);
    res.status(500).json({ error: "取得白名單失敗" });
  }
});

/**
 * 新增白名單
 * @route POST /api/admin/whitelist
 */
router.post(
  "/whitelist",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, phoneNumber, note } = req.body;

      if (!email && !phoneNumber) {
        res.status(400).json({ error: "請提供 Email 或手機號碼" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("admin_whitelist")
        .insert({
          email: email || null,
          phone_number: phoneNumber || null,
          note,
          added_by: req.user?.userId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          res.status(400).json({ error: "此 Email 或手機已在白名單中" });
          return;
        }
        throw error;
      }

      res.json(data);
    } catch (err) {
      console.error("Add whitelist error:", err);
      res.status(500).json({ error: "新增白名單失敗" });
    }
  },
);

/**
 * 更新白名單
 * @route PUT /api/admin/whitelist/:id
 */
router.put(
  "/whitelist/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email, phoneNumber, note, isActive } = req.body;

      const updateData: UpdateWhitelistData = {};
      if (email !== undefined) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
      if (note !== undefined) updateData.note = note;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabaseAdmin
        .from("admin_whitelist")
        .update(updateData)
        .eq("whitelist_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update whitelist error:", err);
      res.status(500).json({ error: "更新白名單失敗" });
    }
  },
);

/**
 * 切換白名單啟用狀態
 * @route POST /api/admin/whitelist/:id/toggle
 */
router.post(
  "/whitelist/:id/toggle",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 取得當前狀態
      const { data: current, error: fetchError } = await supabaseAdmin
        .from("admin_whitelist")
        .select("is_active")
        .eq("whitelist_id", id)
        .single();

      if (fetchError || !current) {
        res.status(404).json({ error: "白名單項目不存在" });
        return;
      }

      // 如果要停用，檢查是否為最後一個啟用的管理員
      if (current.is_active) {
        const { count } = await supabaseAdmin
          .from("admin_whitelist")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        if ((count || 0) <= 1) {
          res.status(400).json({ error: "無法停用最後一個管理員" });
          return;
        }
      }

      // 切換狀態
      const { data, error } = await supabaseAdmin
        .from("admin_whitelist")
        .update({ is_active: !current.is_active })
        .eq("whitelist_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Toggle whitelist error:", err);
      res.status(500).json({ error: "切換狀態失敗" });
    }
  },
);

/**
 * 刪除白名單
 * @route DELETE /api/admin/whitelist/:id
 */
router.delete(
  "/whitelist/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 防止刪除最後一個管理員
      const { count } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if ((count || 0) <= 1) {
        res.status(400).json({ error: "無法刪除最後一個管理員" });
        return;
      }

      const { error } = await supabaseAdmin
        .from("admin_whitelist")
        .delete()
        .eq("whitelist_id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete whitelist error:", err);
      res.status(500).json({ error: "刪除白名單失敗" });
    }
  },
);

// ===== 訂單管理 =====

/**
 * 取得所有訂單（分頁及狀態篩選）
 * @route GET /api/admin/orders
 */
router.get("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        users:user_id (display_name, email),
        order_items (
          *,
          courses:course_id (course_title)
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      orders: data,
      total: count,
      page: parseInt(page as string),
      totalPages: Math.ceil((count || 0) / Number(limit)),
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "取得訂單失敗" });
  }
});

/**
 * 更新訂單狀態
 * @route PUT /api/admin/orders/:id
 */
router.put(
  "/orders/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updateData: Partial<{
        status: string;
        paid_at: string;
        cancelled_at: string;
        notes: string;
      }> = {};
      if (status) {
        updateData.status = status;
        if (status === "paid") updateData.paid_at = new Date().toISOString();
        if (status === "cancelled")
          updateData.cancelled_at = new Date().toISOString();
      }
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("order_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update order error:", err);
      res.status(500).json({ error: "更新訂單失敗" });
    }
  },
);

// ===== 統計數據 =====

// ===== 課程售價顯示管理 =====

/**
 * 取得指定使用者的所有課程售價可見性設定
 * @route GET /api/admin/price-visibility/:userId
 */
router.get(
  "/price-visibility/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      if (!userId || isNaN(userId)) {
        res.status(400).json({ error: "無效的使用者 ID" });
        return;
      }

      // 取得所有未刪除課程及該使用者的可見性設定
      const { data: courses, error: courseErr } = await supabaseAdmin
        .from("courses")
        .select("course_id, course_title, price, status")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (courseErr) throw courseErr;

      const { data: visibility, error: visErr } = await supabaseAdmin
        .from("user_course_price_visibility")
        .select("course_id, show_price")
        .eq("user_id", userId);

      if (visErr) throw visErr;

      const visMap = new Map(
        (visibility || []).map(
          (v: { course_id: number; show_price: boolean }) => [
            v.course_id,
            v.show_price,
          ],
        ),
      );

      const result = (courses || []).map(
        (c: {
          course_id: number;
          course_title: string;
          price: number;
          status: string;
        }) => ({
          course_id: c.course_id,
          course_title: c.course_title,
          price: c.price,
          status: c.status,
          show_price: visMap.get(c.course_id) ?? false,
        }),
      );

      res.json(result);
    } catch (err) {
      console.error("Get price visibility error:", err);
      res.status(500).json({ error: "取得售價可見性失敗" });
    }
  },
);

/**
 * 切換指定使用者對指定課程的售價顯示
 * @route PUT /api/admin/price-visibility
 */
router.put(
  "/price-visibility",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, courseId, showPrice } = req.body;

      if (!userId || !courseId || typeof showPrice !== "boolean") {
        res
          .status(400)
          .json({ error: "缺少必要參數 (userId, courseId, showPrice)" });
        return;
      }

      const { error } = await supabaseAdmin
        .from("user_course_price_visibility")
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            show_price: showPrice,
          },
          { onConflict: "user_id,course_id" },
        );

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Update price visibility error:", err);
      res.status(500).json({ error: "更新售價可見性失敗" });
    }
  },
);

/**
 * 批次切換指定使用者的所有課程售價顯示
 * @route PUT /api/admin/price-visibility/batch
 */
router.put(
  "/price-visibility/batch",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, showAll } = req.body;

      if (!userId || typeof showAll !== "boolean") {
        res.status(400).json({ error: "缺少必要參數 (userId, showAll)" });
        return;
      }

      const { error } = await supabaseAdmin
        .from("user_course_price_visibility")
        .update({ show_price: showAll })
        .eq("user_id", userId);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Batch update price visibility error:", err);
      res.status(500).json({ error: "批次更新售價可見性失敗" });
    }
  },
);

// ===== 統計數據 =====

/**
 * 取得統計數據
 * @route GET /api/admin/stats
 */
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    // 使用者總數
    const { count: userCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // 課程總數
    const { count: courseCount } = await supabaseAdmin
      .from("courses")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // 訂單總數
    const { count: orderCount } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true });

    // 本月營收
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyOrders } = await supabaseAdmin
      .from("orders")
      .select("total_amount")
      .eq("status", "paid")
      .gte("paid_at", startOfMonth.toISOString());

    const monthlyRevenue =
      monthlyOrders?.reduce(
        (sum: number, o: { total_amount: string | null }) =>
          sum + parseFloat(o.total_amount || "0"),
        0,
      ) || 0;

    res.json({
      userCount,
      courseCount,
      orderCount,
      monthlyRevenue,
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "取得統計失敗" });
  }
});

export default router;
