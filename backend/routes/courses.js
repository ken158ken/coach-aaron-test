const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ===== 公開 API =====

// 取得所有已發布課程
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: '取得課程失敗' });
  }
});

// 取得單一課程
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('course_id', id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: '課程不存在' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: '取得課程失敗' });
  }
});

// 取得課程評論
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('course_reviews')
      .select(`
        *,
        users:user_id (display_name, avatar_url)
      `)
      .eq('course_id', id)
      .eq('is_visible', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: '取得評論失敗' });
  }
});

// ===== 管理員 API =====

// 取得所有課程（含草稿、封存）
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get all courses error:', err);
    res.status(500).json({ error: '取得課程失敗' });
  }
});

// 新增課程
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      courseTitle,
      courseSlug,
      courseDescription,
      courseContent,
      courseVideoUrl,
      courseThumbnailUrl,
      courseKeywords,
      courseCategory,
      price,
      currency,
      accessDurationDays,
      status
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        course_title: courseTitle,
        course_slug: courseSlug,
        course_description: courseDescription,
        course_content: courseContent,
        course_video_url: courseVideoUrl,
        course_thumbnail_url: courseThumbnailUrl,
        course_keywords: courseKeywords,
        course_category: courseCategory,
        price: price || 0,
        currency: currency || 'TWD',
        access_duration_days: accessDurationDays,
        status: status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: '新增課程失敗' });
  }
});

// 更新課程
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    const fields = [
      'courseTitle', 'courseSlug', 'courseDescription', 'courseContent',
      'courseVideoUrl', 'courseThumbnailUrl', 'courseKeywords',
      'courseCategory', 'price', 'currency', 'accessDurationDays', 'status'
    ];

    const dbFields = [
      'course_title', 'course_slug', 'course_description', 'course_content',
      'course_video_url', 'course_thumbnail_url', 'course_keywords',
      'course_category', 'price', 'currency', 'access_duration_days', 'status'
    ];

    fields.forEach((field, index) => {
      if (req.body[field] !== undefined) {
        updateData[dbFields[index]] = req.body[field];
      }
    });

    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('course_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: '更新課程失敗' });
  }
});

// 刪除課程（軟刪除）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('courses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('course_id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: '刪除課程失敗' });
  }
});

module.exports = router;
