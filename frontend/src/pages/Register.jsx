import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 驗證
    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    setLoading(true);
    const res = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName || formData.username,
      phoneNumber: formData.phoneNumber
    });
    setLoading(false);

    if (res?.success) {
      navigate('/member');
    } else {
      setError(res?.message || '註冊失敗');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">會員 <span className="text-primary">註冊</span></h2>
          
          {error && <div className="alert alert-error text-sm py-2 mb-4"><span>{error}</span></div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">帳號 *</span></label>
                <input 
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username" 
                  className="input input-bordered" 
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">顯示名稱</span></label>
                <input 
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="您的名稱" 
                  className="input input-bordered" 
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Email *</span></label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com" 
                className="input input-bordered" 
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">手機號碼</span></label>
              <input 
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0912345678" 
                className="input input-bordered" 
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">密碼 *</span></label>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="至少 6 個字元" 
                className="input input-bordered" 
                required
                minLength={6}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">確認密碼 *</span></label>
              <input 
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="再次輸入密碼" 
                className="input input-bordered" 
                required
              />
            </div>

            <div className="form-control mt-6">
              <button 
                type="submit" 
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? '註冊中...' : '註冊'}
              </button>
            </div>
          </form>

          <div className="divider">或</div>

          <p className="text-center text-sm">
            已有帳號？{' '}
            <Link to="/login" className="link link-primary">立即登入</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
