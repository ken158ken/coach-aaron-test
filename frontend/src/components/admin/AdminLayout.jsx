import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUsers, FaBook, FaVideo, FaShieldAlt, FaChartBar, FaCog, FaBars, FaTimes, FaArrowLeft } from 'react-icons/fa';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
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

  if (!user?.isAdmin) {
    return null;
  }

  const navItems = [
    { path: '/admin', icon: <FaChartBar />, label: '總覽', end: true },
    { path: '/admin/users', icon: <FaUsers />, label: '會員管理' },
    { path: '/admin/courses', icon: <FaBook />, label: '課程管理' },
    { path: '/admin/videos', icon: <FaVideo />, label: '影片管理' },
    { path: '/admin/whitelist', icon: <FaShieldAlt />, label: '管理員白名單' },
  ];

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-base-100 border-r border-base-300">
        <div className="p-4 border-b border-base-300">
          <h1 className="text-xl font-bold">
            <span className="text-primary">阿倫教官</span> 後台
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content'
                        : 'hover:bg-base-200 text-base-content'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-base-300">
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost btn-sm w-full justify-start gap-2"
          >
            <FaArrowLeft /> 返回前台
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black transition-opacity ${sidebarOpen ? 'opacity-50' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-base-100 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-base-300 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              <span className="text-primary">阿倫教官</span> 後台
            </h1>
            <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(false)}>
              <FaTimes />
            </button>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-content'
                          : 'hover:bg-base-200 text-base-content'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-base-300">
            <button
              onClick={() => navigate('/')}
              className="btn btn-ghost btn-sm w-full justify-start gap-2"
            >
              <FaArrowLeft /> 返回前台
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-base-100 border-b border-base-300 px-4 py-3 flex items-center justify-between lg:justify-end">
          <button
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars className="text-xl" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-base-content/70">{user?.displayName || user?.email}</span>
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-8">
                <span className="text-sm">{(user?.displayName || user?.email)?.[0]?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
