const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ===== 公開 API =====

// 取得所有可見影片
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get videos error:', err);
    res.status(500).json({ error: '取得影片失敗' });
  }
});

// ===== 管理員 API =====

// 取得所有影片
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get all videos error:', err);
    res.status(500).json({ error: '取得影片失敗' });
  }
});

// 新增影片
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, url, type, sortOrder } = req.body;

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({
        title,
        url,
        type: type || 'instagram',
        sort_order: sortOrder || 0,
        is_visible: true
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Create video error:', err);
    res.status(500).json({ error: '新增影片失敗' });
  }
});

// 更新影片
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, type, sortOrder, isVisible } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (type !== undefined) updateData.type = type;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (isVisible !== undefined) updateData.is_visible = isVisible;

    const { data, error } = await supabaseAdmin
      .from('videos')
      .update(updateData)
      .eq('video_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update video error:', err);
    res.status(500).json({ error: '更新影片失敗' });
  }
});

// 刪除影片
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('videos')
      .delete()
      .eq('video_id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ error: '刪除影片失敗' });
  }
});

// 批量更新排序
router.put('/admin/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orders } = req.body; // [{ id: 1, sortOrder: 0 }, ...]

    for (const item of orders) {
      await supabaseAdmin
        .from('videos')
        .update({ sort_order: item.sortOrder })
        .eq('video_id', item.id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Reorder videos error:', err);
    res.status(500).json({ error: '更新排序失敗' });
  }
});

module.exports = router;
