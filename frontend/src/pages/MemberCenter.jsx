import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatDate } from '../lib/ui';
import { FaUser, FaCog, FaShoppingBag, FaBook, FaShieldAlt } from 'react-icons/fa';

const MemberCenter = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 使用者資訊卡片 */}
        <div className="card bg-base-100 shadow-md border border-base-300 mb-6">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-20">
                  <span className="text-3xl">
                    {(user.displayName || user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
                <p className="text-base-content/60">{user.email}</p>
                {user.phoneNumber && (
                  <p className="text-sm text-base-content/50">{user.phoneNumber}</p>
                )}
                <p className="text-sm text-base-content/50 mt-1">
                  加入時間：{formatDate(user.createdAt)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {user.isAdmin && (
                  <span className="badge badge-primary gap-1">
                    <FaShieldAlt /> 管理員
                  </span>
                )}
                {user.sex && (
                  <span className="badge badge-secondary">私密相簿權限</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 快捷功能 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link to="/courses" className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
            <div className="card-body items-center text-center">
              <FaBook className="text-4xl text-primary mb-2" />
              <h3 className="font-semibold">瀏覽課程</h3>
              <p className="text-sm text-base-content/60">探索所有線上課程</p>
            </div>
          </Link>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body items-center text-center">
              <FaShoppingBag className="text-4xl text-secondary mb-2" />
              <h3 className="font-semibold">我的訂單</h3>
              <p className="text-sm text-base-content/60">查看購買記錄</p>
              <span className="badge badge-ghost">即將推出</span>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body items-center text-center">
              <FaCog className="text-4xl text-accent mb-2" />
              <h3 className="font-semibold">帳號設定</h3>
              <p className="text-sm text-base-content/60">修改個人資料</p>
              <span className="badge badge-ghost">即將推出</span>
            </div>
          </div>
        </div>

        {/* 管理員入口 */}
        {user.isAdmin && (
          <div className="card bg-neutral text-neutral-content shadow-md mb-6">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-3xl" />
                  <div>
                    <h3 className="font-bold text-lg">管理員後台</h3>
                    <p className="text-sm opacity-80">管理會員、課程、影片等</p>
                  </div>
                </div>
                <Link to="/admin" className="btn btn-primary">
                  進入後台
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 私密相簿提示 */}
        {user.sex && (
          <div className="card bg-secondary text-secondary-content shadow-md mb-6">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">🔓 私密相簿已解鎖</h3>
                  <p className="text-sm opacity-80">您已獲得「阿倫私密淫照」的檢視權限</p>
                </div>
                <Link to="/photos" className="btn btn-outline btn-sm">
                  前往相簿
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 登出 */}
        <div className="text-center">
          <button onClick={logout} className="btn btn-outline btn-error">
            登出
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberCenter;
