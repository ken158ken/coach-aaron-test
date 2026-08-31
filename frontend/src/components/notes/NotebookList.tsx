/**
 * 筆記本列表（含 owner 的「建立筆記本」彈窗）
 * @module components/notes/NotebookList
 *
 * 角色由 `GET /api/notes/notebooks` 回傳的 `role` 決定，不看路由：
 *   - owner（教練／admin）→ 看得到全部，可建立／刪除筆記本
 *   - client（買課客戶）→ 只有自己那本（後端已依 user_courses 授權過濾）
 *
 * 建立彈窗要選「會員 × 課程」。會員清單走既有的 `/api/admin/users`
 * （與 /admin/users 同一支端點，支援 `search`），課程走公開的 `/api/courses`。
 * 「順便開通課程授權」＝ `POST /api/notes/admin/grant-course`，
 * 金流未接前用來 fake 購買；沒開通的話客戶端會看不到這本筆記本。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import { get } from "@/services/api";
import { courseService } from "@/services/content/course.service";
import type { Course } from "@/types";
import {
  notesService,
  isNotesUnavailable,
  serverMessageOf,
  type NotebookSummary,
  type NoteRole,
} from "@/services/notes/notes.service";

export interface NotebookListProps {
  notebooks: NotebookSummary[];
  role: NoteRole;
  onOpen: (notebookId: number) => void;
  /** 建立／刪除後請呼叫端重抓列表 */
  onChanged: () => void | Promise<void>;
}

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

/** 建立筆記本彈窗（只有 owner 看得到） */
const CreateNotebookModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}> = ({ isOpen, onClose, onCreated }) => {
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

const NotebookList: React.FC<NotebookListProps> = ({
  notebooks,
  role,
  onOpen,
  onChanged,
}) => {
  const { t, language } = useLanguage();
  const dialog = useDialog();
  const [showCreate, setShowCreate] = useState(false);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [language],
  );

  const remove = useCallback(
    async (nb: NotebookSummary) => {
      const ok = await dialog.confirm({
        title: t.notes.del.confirmTitle,
        message: t.notes.del.confirmMessage.replace("{name}", nb.title),
        confirmText: t.notes.del.confirmText,
        variant: "danger",
      });
      if (!ok) return;
      try {
        await notesService.deleteNotebook(nb.id);
        await onChanged();
      } catch (err) {
        await dialog.alert({
          title: isNotesUnavailable(err)
            ? t.notes.unavailableTitle
            : t.notes.del.failed,
          message: serverMessageOf(err) || "",
        });
      }
    },
    [dialog, t, onChanged],
  );

  return (
    <div data-tour="notes-notebook-list">
      {role === "owner" && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            data-tour="notes-create-button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {t.notes.create.button}
          </button>
        </div>
      )}

      {notebooks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {role === "owner" ? t.notes.listEmptyOwner : t.notes.listEmptyClient}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notebooks.map((nb) => (
            <li
              key={nb.id}
              data-tour="notes-notebook-card"
              className="flex flex-col rounded-lg border border-gold/15 bg-surface p-4 transition-colors hover:border-gold/40"
            >
              <button
                type="button"
                onClick={() => onOpen(nb.id)}
                className="flex-1 text-left"
              >
                <h3 className="mb-1 truncate font-display text-base font-light tracking-wide">
                  {nb.title}
                </h3>
                <p className="truncate text-xs text-muted">
                  {t.notes.cardCourse}：{nb.courseTitle || "—"}
                </p>
                {role === "owner" && (
                  <p className="truncate text-xs text-muted">
                    {t.notes.cardClient}：{nb.clientName || "—"}
                  </p>
                )}
              </button>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-gold/10 pt-2">
                <span className="text-[11px] text-muted">
                  {t.notes.cardUpdated}
                  {nb.updatedAt ? dateFmt.format(new Date(nb.updatedAt)) : "—"}
                </span>
                {role === "owner" && (
                  <button
                    type="button"
                    onClick={() => void remove(nb)}
                    className="text-xs text-muted transition-colors hover:text-red-400"
                  >
                    {t.notes.del.button}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {role === "owner" && (
        <CreateNotebookModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={onChanged}
        />
      )}
    </div>
  );
};

export default NotebookList;
