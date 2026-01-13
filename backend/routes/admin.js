const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 所有管理員路由都需要驗證
router.use(authenticateToken);
router.use(requireAdmin);

// ===== 使用者管理 =====

// 取得所有使用者
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('user_id, username, email, display_name, avatar_url, sex, phone_number, is_active, email_verified, last_login_at, created_at', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 取得管理員白名單
    const { data: adminList } = await supabaseAdmin
      .from('admin_whitelist')
      .select('email')
      .eq('is_active', true);

    const adminEmails = new Set(adminList?.map(a => a.email) || []);

    const usersWithAdmin = data.map(user => ({
      ...user,
      isAdmin: adminEmails.has(user.email)
    }));

    res.json({
      users: usersWithAdmin,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: '取得使用者失敗' });
  }
});

// 更新使用者
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sex, isActive, displayName } = req.body;

    const updateData = {};
    if (sex !== undefined) updateData.sex = sex;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (displayName !== undefined) updateData.display_name = displayName;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('user_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: '更新使用者失敗' });
  }
});

// 刪除使用者（軟刪除）
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('user_id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: '刪除使用者失敗' });
  }
});

// ===== 管理員白名單 =====

// 取得白名單
router.get('/whitelist', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get whitelist error:', err);
    res.status(500).json({ error: '取得白名單失敗' });
  }
});

// 新增白名單
router.post('/whitelist', async (req, res) => {
  try {
    const { email, phoneNumber, note } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: '請提供 Email 或手機號碼' });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_whitelist')
      .insert({
        email: email || null,
        phone_number: phoneNumber || null,
        note,
        added_by: req.user.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: '此 Email 或手機已在白名單中' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('Add whitelist error:', err);
    res.status(500).json({ error: '新增白名單失敗' });
  }
});

// 更新白名單
router.put('/whitelist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phoneNumber, note, isActive } = req.body;

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
    if (note !== undefined) updateData.note = note;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('admin_whitelist')
      .update(updateData)
      .eq('whitelist_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update whitelist error:', err);
    res.status(500).json({ error: '更新白名單失敗' });
  }
});

// 刪除白名單
router.delete('/whitelist/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 防止刪除最後一個管理員
    const { data: count } = await supabaseAdmin
      .from('admin_whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (count <= 1) {
      return res.status(400).json({ error: '無法刪除最後一個管理員' });
    }

    const { error } = await supabaseAdmin
      .from('admin_whitelist')
      .delete()
      .eq('whitelist_id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete whitelist error:', err);
    res.status(500).json({ error: '刪除白名單失敗' });
  }
});

// ===== 訂單管理 =====

// 取得所有訂單
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        users:user_id (display_name, email),
        order_items (
          *,
          courses:course_id (course_title)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      orders: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: '取得訂單失敗' });
  }
});

// 更新訂單狀態
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'paid') updateData.paid_at = new Date().toISOString();
      if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();
    }
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('order_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: '更新訂單失敗' });
  }
});

// ===== 統計數據 =====

router.get('/stats', async (req, res) => {
  try {
    // 使用者總數
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // 課程總數
    const { count: courseCount } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // 訂單總數
    const { count: orderCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // 本月營收
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('paid_at', startOfMonth.toISOString());

    const monthlyRevenue = monthlyOrders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0;

    res.json({
      userCount,
      courseCount,
      orderCount,
      monthlyRevenue
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: '取得統計失敗' });
  }
});

module.exports = router;
