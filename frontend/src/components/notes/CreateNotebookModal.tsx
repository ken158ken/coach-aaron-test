/**
 * 建立筆記本彈窗（只有 owner 用得到）
 * @module components/notes/CreateNotebookModal
 *
 * 從 `NotebookList` 原地抽出來的 —— 會員端的卡片牆（NotebookList）與後台的
 * 統一樹（AdminNotesTree）都要「建立筆記本」，抽出來兩邊共用同一份表單、
 * 同一組 `data-tour` 錨點，導覽不必寫兩套。**行為與抽出前完全相同。**
 *
 * 會員清單走既有的 `/api/admin/users`（與 /admin/users 同一支端點，支援
 * `search`），課程走公開的 `/api/courses`。「順便開通課程授權」＝
 * `POST /api/notes/admin/grant-course`，金流未接前用來 fake 購買；
 * 沒開通的話客戶端會看不到這本筆記本。
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import { get } from "@/services/api";
import { courseService } from "@/services/content/course.service";
import type { Course } from "@/types";
import { notesService, serverMessageOf } from "@/services/notes/notes.service";

/** /api/admin/users 回傳的最小形狀（只取這頁需要的欄位） */
interface PickableUser {
  user_id: number;
  email: string;
  display_name?: string | null;
  username?: string | null;
}

interface AdminUsersResponse {
  users: PickableUser[];
}

const USER_SEARCH_DEBOUNCE_MS = 350;

export interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

const CreateNotebookModal: React.FC<CreateNotebookModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { t } = useLanguage();
  const { loc } = useLocalize();

  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<PickableUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PickableUser | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [grantAccess, setGrantAccess] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 開啟時把表單清乾淨（同一個 modal 實例會被重複開關） */
  useEffect(() => {
    if (!isOpen) return;
    setUserQuery("");
    setSelectedUser(null);
    setCourseId("");
    setTitle("");
    setGrantAccess(true);
    setFormError(null);
  }, [isOpen]);

  /* 課程清單只抓一次 */
  useEffect(() => {
    if (!isOpen || courses.length > 0) return;
    let cancelled = false;
    courseService
      .getAll()
      .then((list) => {
        if (!cancelled) setCourses(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, courses.length]);

  /* 會員搜尋（debounce；空字串就抓最近註冊的前 10 位） */
  useEffect(() => {
    if (!isOpen) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setUserLoading(true);
    searchTimer.current = setTimeout(() => {
      const q = encodeURIComponent(userQuery.trim());
      get<AdminUsersResponse>(`/api/admin/users?page=1&limit=10&search=${q}`)
        .then((res) => setUsers(Array.isArray(res?.users) ? res.users : []))
        .catch(() => setUsers([]))
        .finally(() => setUserLoading(false));
    }, USER_SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [isOpen, userQuery]);

  const userLabel = (u: PickableUser) =>
    u.display_name?.trim() || u.username?.trim() || u.email;

  const submit = useCallback(async () => {
    if (!selectedUser || !courseId || !title.trim()) {
      setFormError(t.notes.create.errRequired);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      /*
       * 先開通授權再建筆記本：反過來的話，建好但開通失敗，客戶會拿到
       * 一本「教練看得到、自己看不到」的筆記本，比整個失敗還難查。
       */
      if (grantAccess) {
        await notesService.grantCourse(selectedUser.user_id, Number(courseId));
      }
      await notesService.createNotebook({
        clientUserId: selectedUser.user_id,
        courseId: Number(courseId),
        title: title.trim(),
      });
      await onCreated();
      onClose();
    } catch (err) {
      setFormError(serverMessageOf(err) || t.notes.create.errFailed);
    } finally {
      setSubmitting(false);
    }
  }, [selectedUser, courseId, title, grantAccess, onCreated, onClose, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.notes.create.title}
      size="lg"
      tourId="notes-create"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gold/25 px-4 py-2 text-sm text-muted transition-colors hover:text-gold disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            data-tour="notes-create-submit"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t.notes.create.submitting : t.notes.create.submit}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 會員選擇 */}
        <div data-tour="notes-create-client">
          <label
            htmlFor="notes-client-search"
            className="mb-1 block text-xs uppercase tracking-widest text-muted"
          >
            {t.notes.create.clientLabel}
          </label>
          <input
            id="notes-client-search"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={t.notes.create.clientSearch}
            className="w-full rounded-lg border border-gold/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-gold/50"
          />
          <ul className="mt-2 max-h-40 overflow-y-auto modal-scroll rounded-lg border border-gold/10">
            {userLoading && (
              <li className="px-3 py-2 text-sm text-muted">{t.common.loading}</li>
            )}
            {!userLoading && users.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted">
                {t.notes.create.clientEmpty}
              </li>
            )}
            {!userLoading &&
              users.map((u) => (
                <li key={u.user_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      selectedUser?.user_id === u.user_id
                        ? "bg-gold/15 text-gold"
                        : "hover:bg-gold/5"
                    }`}
                  >
                    <span className="truncate">{userLabel(u)}</span>
                    <span className="shrink-0 text-xs text-muted">{u.email}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>

        {/* 課程選擇 */}
        <div data-tour="notes-create-course">
          <label
            htmlFor="notes-course"
            className="mb-1 block text-xs uppercase tracking-widest text-muted"
          >
            {t.notes.create.courseLabel}
          </label>
          <select
            id="notes-course"
            value={courseId}
            onChange={(e) =>
              setCourseId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full rounded-lg border border-gold/20 bg-surface-2 px-3 py-2 text-sm outline-none focus:border-gold/50"
          >
            <option value="">{t.notes.create.coursePlaceholder}</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {loc(c as unknown as Record<string, unknown>, "course_title")}
              </option>
            ))}
          </select>
        </div>

        {/* 標題 */}
        <div>
          <label
            htmlFor="notes-title"
            className="mb-1 block text-xs uppercase tracking-widest text-muted"
          >
            {t.notes.create.titleLabel}
          </label>
          <input
            id="notes-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.notes.create.titlePlaceholder}
            className="w-full rounded-lg border border-gold/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-gold/50"
          />
        </div>

        {/* 順便開通課程授權 */}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={grantAccess}
            onChange={(e) => setGrantAccess(e.target.checked)}
            className="mt-0.5 accent-[color:var(--color-gold)]"
          />
          <span>
            <span className="block">{t.notes.create.grantLabel}</span>
            <span className="block text-xs text-muted">
              {t.notes.create.grantHint}
            </span>
          </span>
        </label>

        {formError && (
          <p role="alert" className="text-sm text-red-400">
            {formError}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default CreateNotebookModal;
