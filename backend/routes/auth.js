const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 註冊
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName, phoneNumber } = req.body;

    // 驗證必填欄位
    if (!username || !email || !password) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // 檢查 email 是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: '此 Email 已被註冊' });
    }

    // 檢查 username 是否已存在
    const { data: existingUsername } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return res.status(400).json({ error: '此使用者名稱已被使用' });
    }

    // 密碼加密
    const passwordHash = await bcrypt.hash(password, 10);

    // 建立使用者
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        display_name: displayName || username,
        phone_number: phoneNumber || null,
        sex: false
      })
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: '註冊失敗' });
    }

    // 檢查是否為管理員
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_whitelist')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    // 產生 JWT
    const token = jwt.sign(
      {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.display_name,
        sex: newUser.sex,
        isAdmin: !!adminCheck
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.display_name,
        sex: newUser.sex,
        isAdmin: !!adminCheck
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 登入
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '請填寫 Email 和密碼' });
    }

    // 查詢使用者
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email 或密碼錯誤' });
    }

    // 驗證密碼
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email 或密碼錯誤' });
    }

    // 更新最後登入時間
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', user.user_id);

    // 檢查是否為管理員
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_whitelist')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    // 產生 JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        sex: user.sex,
        isAdmin: !!adminCheck
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        sex: user.sex,
        isAdmin: !!adminCheck
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 登出
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// 取得當前使用者資訊
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, username, email, display_name, avatar_url, sex, phone_number, created_at')
      .eq('user_id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    // 檢查是否為管理員
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_whitelist')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();

    res.json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        phoneNumber: user.phone_number,
        sex: user.sex,
        isAdmin: !!adminCheck,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 更新個人資料
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, avatarUrl, phoneNumber } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        phone_number: phoneNumber
      })
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '更新失敗' });
    }

    res.json({ success: true, user: data });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

module.exports = router;
