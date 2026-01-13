import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await login(email, password);
    setLoading(false);
    
    if (res?.success) {
      navigate('/member');
    } else {
      setError(res?.message || '登入失敗');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">會員 <span className="text-primary">登入</span></h2>
          
          {error && <div className="alert alert-error text-sm py-2 mb-4"><span>{error}</span></div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" 
                className="input input-bordered" 
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">密碼</span></label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
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
                {loading ? '登入中...' : '登入'}
              </button>
            </div>
          </form>

          <div className="divider">或</div>

          <p className="text-center text-sm">
            還沒有帳號？{' '}
            <Link to="/register" className="link link-primary">立即註冊</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
