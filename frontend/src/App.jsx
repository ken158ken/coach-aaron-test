import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Videos from './pages/Videos';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoachPhotos from './pages/CoachPhotos';
import MemberCenter from './pages/MemberCenter';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminVideos from './pages/admin/AdminVideos';
import AdminWhitelist from './pages/admin/AdminWhitelist';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 前台路由 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="videos" element={<Videos />} />
          <Route path="photos" element={<CoachPhotos />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="member" element={<MemberCenter />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* 後台路由 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="whitelist" element={<AdminWhitelist />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;