'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionToast from '@/app/components/ActionToast';

type UserRow = {
  id: string;
  email: string | null;
  display_name: string;
  auth_user_id: string | null;
  profile_slug: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export default function UserManagementClient({ viewerId }: { viewerId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load users');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      setToast(`User "${deleteTarget.display_name}" has been anonymized and their auth account deleted. Content preserved.`);
      setDeleteTarget(null);
      setConfirmInput('');
      loadUsers();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
      setConfirmInput('');
    }
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase())) ||
          (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
          (u.profile_slug && u.profile_slug.toLowerCase().includes(search.toLowerCase()))
      )
    : users;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-[#243126]">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage registered users. Deleting a user removes their personal data
          and auth account, but preserves their published content (stories).
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#2f5d3a] focus:ring-1 focus:ring-[#2f5d3a]/20"
        />
        <span className="text-sm text-gray-400">
          {filtered.length} / {users.length} users
        </span>
        <button
          type="button"
          onClick={loadUsers}
          className="ml-auto rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-black/8 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-black/8 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">
            {search.trim() ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-black/8 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4">Auth</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === viewerId;
                const isAnonymized = !u.email && u.display_name === '[Deleted User]';

                return (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-medium text-[#243126]">
                      <span className={isAnonymized ? 'text-gray-400' : ''}>
                        {u.display_name || '(no name)'}
                      </span>
                      {isSelf && (
                        <span className="ml-2 inline-flex rounded-full bg-[#eef5ee] px-2 py-0.5 text-[10px] font-semibold text-[#2f5d3a]">
                          You
                        </span>
                      )}
                      {isAnonymized && (
                        <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {u.email || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {u.profile_slug || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {u.auth_user_id ? (
                        <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('en-CA', {
                        timeZone: 'America/Vancouver',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isSelf && !isAnonymized && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal — requires typing the user's name */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#243126]">Delete User</h3>
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-6 text-gray-600">
                Are you sure you want to delete{' '}
                <strong>{deleteTarget.display_name}</strong>
                {deleteTarget.email && <> (<span className="font-mono text-gray-500">{deleteTarget.email}</span>)</>}?
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">
                  This cannot be undone
                </p>
                <ul className="mt-2 space-y-0.5 text-xs text-amber-700">
                  <li>✓ Email, name, and all personal data permanently removed</li>
                  <li>✓ Auth account deleted (user can re-register)</li>
                  <li>✓ Published stories and content will remain</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type <span className="font-mono font-bold text-red-600">{deleteTarget.display_name}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Type the user's name..."
                  autoFocus
                  className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-200"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmInput('');
                }}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={confirmInput !== deleteTarget.display_name || deleting}
                className="rounded-lg bg-[#9f2d2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#862626] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionToast message={toast} />
    </main>
  );
}
