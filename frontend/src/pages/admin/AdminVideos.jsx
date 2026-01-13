import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { PageHeader, LoadingSpinner, ConfirmDialog, Toggle } from '../../components/ui';
import { FaPlus, FaEdit, FaTrash, FaGripVertical, FaInstagram, FaYoutube } from 'react-icons/fa';

const AdminVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVideo, setEditVideo] = useState(null);
  const [deleteVideo, setDeleteVideo] = useState(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/videos/admin/all');
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        title: editVideo.title,
        url: editVideo.url,
        type: editVideo.type,
        sortOrder: editVideo.sort_order,
        isVisible: editVideo.is_visible
      };

      if (isNew) {
        await api.post('/api/videos', data);
      } else {
        await api.put(`/api/videos/${editVideo.video_id}`, data);
      }
      fetchVideos();
      setEditVideo(null);
      setIsNew(false);
    } catch (err) {
      console.error('Failed to save video:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/videos/${deleteVideo.video_id}`);
      fetchVideos();
      setDeleteVideo(null);
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleToggleVisible = async (video) => {
    try {
      await api.put(`/api/videos/${video.video_id}`, {
        isVisible: !video.is_visible
      });
      fetchVideos();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  const handleNew = () => {
    setEditVideo({
      title: '',
      url: '',
      type: 'instagram',
      sort_order: videos.length,
      is_visible: true
    });
    setIsNew(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'instagram':
        return <FaInstagram className="text-pink-500" />;
      case 'youtube':
        return <FaYoutube className="text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner text="載入影片中..." />;
  }

  return (
    <div>
      <PageHeader
        title="影片管理"
        subtitle={`共 ${videos.length} 部影片`}
        actions={
          <button className="btn btn-primary btn-sm gap-2" onClick={handleNew}>
            <FaPlus /> 新增影片
          </button>
        }
      />

      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-12">排序</th>
                  <th>標題</th>
                  <th>類型</th>
                  <th>網址</th>
                  <th>顯示</th>
                  <th className="w-24">操作</th>
                </tr>
              </thead>
              <tbody>
                {videos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-base-content/50">
                      尚無影片
                    </td>
                  </tr>
                ) : (
                  videos.map((video, index) => (
                    <tr key={video.video_id}>
                      <td>
                        <span className="text-base-content/50">{index + 1}</span>
                      </td>
                      <td className="font-medium">{video.title}</td>
                      <td>
                        <span className="flex items-center gap-2">
                          {getTypeIcon(video.type)}
                          {video.type}
                        </span>
                      </td>
                      <td>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary text-sm truncate block max-w-xs"
                        >
                          {video.url}
                        </a>
                      </td>
                      <td>
                        <Toggle
                          checked={video.is_visible}
                          onChange={() => handleToggleVisible(video)}
                        />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => { setEditVideo(video); setIsNew(false); }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => setDeleteVideo(video)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 編輯/新增對話框 */}
      {editVideo && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{isNew ? '新增影片' : '編輯影片'}</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">標題 *</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editVideo.title}
                  onChange={(e) => setEditVideo({ ...editVideo, title: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">影片網址 *</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="https://www.instagram.com/reel/..."
                  value={editVideo.url}
                  onChange={(e) => setEditVideo({ ...editVideo, url: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">類型</span></label>
                <select
                  className="select select-bordered"
                  value={editVideo.type}
                  onChange={(e) => setEditVideo({ ...editVideo, type: e.target.value })}
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">排序</span></label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={editVideo.sort_order}
                  onChange={(e) => setEditVideo({ ...editVideo, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-control">
                <Toggle
                  checked={editVideo.is_visible}
                  onChange={(v) => setEditVideo({ ...editVideo, is_visible: v })}
                  label="顯示在前台"
                />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setEditVideo(null); setIsNew(false); }}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {isNew ? '建立' : '儲存'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setEditVideo(null); setIsNew(false); }}></div>
        </div>
      )}

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deleteVideo}
        title="確認刪除"
        message={`確定要刪除影片「${deleteVideo?.title}」嗎？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVideo(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminVideos;
