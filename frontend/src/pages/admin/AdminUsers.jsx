import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatDate } from '../../lib/ui';
import { DataTable, StatusBadge, PageHeader, SearchInput, LoadingSpinner, ConfirmDialog, Toggle } from '../../components/ui';
import { FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/users', {
        params: { page, limit: 20, search }
      });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      await api.put(`/api/admin/users/${userId}`, data);
      fetchUsers();
      setEditUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      setDeleteUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleToggleSex = async (user) => {
    await handleUpdateUser(user.user_id, { sex: !user.sex });
  };

  const columns = [
    {
      header: '使用者',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-10">
              <span>{(row.display_name || row.email)?.[0]?.toUpperCase()}</span>
            </div>
          </div>
          <div>
            <div className="font-semibold">{row.display_name || row.username}</div>
            <div className="text-sm text-base-content/60">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: '狀態',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={row.is_active ? 'active' : 'inactive'} text={row.is_active ? '啟用' : '停用'} />
          {row.isAdmin && <span className="badge badge-primary badge-sm gap-1"><FaUserShield /> 管理員</span>}
        </div>
      )
    },
    {
      header: '私密相簿權限',
      render: (row) => (
        <Toggle
          checked={row.sex}
          onChange={() => handleToggleSex(row)}
          label={row.sex ? '可檢視' : '不可檢視'}
        />
      )
    },
    {
      header: '最後登入',
      render: (row) => <span className="text-sm">{formatDate(row.last_login_at)}</span>
    },
    {
      header: '註冊時間',
      render: (row) => <span className="text-sm">{formatDate(row.created_at)}</span>
    },
    {
      header: '操作',
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setEditUser(row)}
          >
            <FaEdit />
          </button>
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={() => setDeleteUser(row)}
            disabled={row.isAdmin}
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="會員管理"
        subtitle={`共 ${users.length} 位會員`}
      />

      <div className="mb-4 max-w-xs">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="搜尋 Email / 名稱..."
        />
      </div>

      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={columns}
              data={users}
              emptyText="找不到會員"
            />
          )}
        </div>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              «
            </button>
            <button className="join-item btn btn-sm">
              {page} / {totalPages}
            </button>
            <button
              className="join-item btn btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* 編輯對話框 */}
      {editUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">編輯會員</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">顯示名稱</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editUser.display_name || ''}
                  onChange={(e) => setEditUser({ ...editUser, display_name: e.target.value })}
                />
              </div>
              <div className="form-control">
                <Toggle
                  checked={editUser.is_active}
                  onChange={(v) => setEditUser({ ...editUser, is_active: v })}
                  label="帳號啟用"
                />
              </div>
              <div className="form-control">
                <Toggle
                  checked={editUser.sex}
                  onChange={(v) => setEditUser({ ...editUser, sex: v })}
                  label="私密相簿檢視權限"
                />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateUser(editUser.user_id, {
                  displayName: editUser.display_name,
                  isActive: editUser.is_active,
                  sex: editUser.sex
                })}
              >
                儲存
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setEditUser(null)}></div>
        </div>
      )}

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        title="確認刪除"
        message={`確定要刪除會員「${deleteUser?.display_name || deleteUser?.email}」嗎？此操作無法復原。`}
        onConfirm={() => handleDeleteUser(deleteUser.user_id)}
        onCancel={() => setDeleteUser(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminUsers;
