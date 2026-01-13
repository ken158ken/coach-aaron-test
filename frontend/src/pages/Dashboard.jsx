import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-base-200 p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">後台管理 <span className="text-primary">Dashboard</span></h1>
          <div className="text-lg">Welcome, {user.name}</div>
        </div>

        <div className="tabs tabs-boxed mb-8 bg-base-100 p-2">
          <a className={`tab tab-lg ${activeTab === 'courses' ? 'tab-active' : ''}`} onClick={() => setActiveTab('courses')}>課程管理</a> 
          <a className={`tab tab-lg ${activeTab === 'videos' ? 'tab-active' : ''}`} onClick={() => setActiveTab('videos')}>短影音管理</a> 
        </div>

        {activeTab === 'courses' ? <CoursesManager /> : <VideosManager />}
      </div>
    </div>
  );
};

const CoursesManager = () => {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '', image: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('/api/courses');
        setCourses(res.data);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      }
    };
    fetchCourses();
  }, [refreshTrigger]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await axios.post('/api/courses', newCourse);
    setNewCourse({ title: '', description: '', price: '', image: '' });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('確定刪除?')) return;
    await axios.delete(`/api/courses/${id}`);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List */}
      <div className="lg:col-span-2 space-y-4">
        {courses.map(course => (
          <div key={course.id} className="card card-side bg-base-100 shadow-xl compact">
            <figure className="w-32"><img src={course.image} alt={course.title} className="h-full object-cover"/></figure>
            <div className="card-body">
              <h2 className="card-title">{course.title}</h2>
              <p className="text-sm truncate">{course.description}</p>
              <div className="card-actions justify-end items-center">
                 <div className="font-bold text-primary mr-4">${course.price}</div>
                 <button onClick={() => handleDelete(course.id)} className="btn btn-error btn-xs">刪除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Form */}
      <div className="card bg-base-100 shadow-xl h-fit">
        <div className="card-body">
          <h2 className="card-title mb-4">新增課程</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" placeholder="課程名稱" className="input input-bordered w-full" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} required />
            <textarea placeholder="描述" className="textarea textarea-bordered w-full" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} required></textarea>
            <input type="number" placeholder="價格" className="input input-bordered w-full" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} required />
            <input type="text" placeholder="圖片網址" className="input input-bordered w-full" value={newCourse.image} onChange={e => setNewCourse({...newCourse, image: e.target.value})} required />
            <button className="btn btn-primary w-full mt-2">新增</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const VideosManager = () => {
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ title: '', url: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get('/api/videos');
        setVideos(res.data);
      } catch (error) {
        console.error("Failed to fetch videos", error);
      }
    };
    fetchVideos();
  }, [refreshTrigger]);

  const handleAdd = async (e) => {
    e.preventDefault();
    // Convert YouTube watch URL to embed if necessary
    let url = newVideo.url;
    if (url.includes('watch?v=')) {
      url = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1];
        url = `https://www.youtube.com/embed/${id}`;
    }

    await axios.post('/api/videos', { ...newVideo, url });
    setNewVideo({ title: '', url: '' });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('確定刪除?')) return;
    await axios.delete(`/api/videos/${id}`);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map(video => (
          <div key={video.id} className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <h3 className="font-bold truncate">{video.title}</h3>
              <p className="text-xs text-base-content/50 truncate">{video.url}</p>
              <div className="card-actions justify-end mt-2">
                 <button onClick={() => handleDelete(video.id)} className="btn btn-error btn-xs">刪除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Form */}
      <div className="card bg-base-100 shadow-xl h-fit">
        <div className="card-body">
          <h2 className="card-title mb-4">新增影片</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" placeholder="影片標題" className="input input-bordered w-full" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} required />
            <input type="text" placeholder="YouTube URL" className="input input-bordered w-full" value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} required />
            <button className="btn btn-primary w-full mt-2">新增</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
