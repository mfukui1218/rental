"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type UserDoc = {
  id: string; // uid
  email?: string;
  name?: string;
  createdAt?: any;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { ready, isAdminClaim } = useRequireAuth();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isAdminClaim) return;

    setErr(null);

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: UserDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserDoc, "id">),
        }));
        setUsers(list);
      },
      (e) => {
        console.error("users snapshot error:", e);
        setUsers([]);
        setErr("ユーザー一覧の取得に失敗しました（権限/ルールを確認）");
      }
    );

    return () => unsub();
  }, [ready, isAdminClaim]);

  if (!ready) return <div className="p-6">読み込み中...</div>;
  if (!isAdminClaim) return <div className="p-6">権限がありません</div>;

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-semibold">ユーザー一覧</h1>
        <div className="text-sm text-gray-600">件数: {users.length}</div>
      </div>

      {err && <div className="rounded border p-3 text-sm text-red-600">{err}</div>}

      <div className="rounded border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">UID</th>
              <th className="px-3 py-2 text-left">email</th>
              <th className="px-3 py-2 text-left">名前</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{u.id}</td>
                <td className="px-3 py-2">{u.email ?? "-"}</td>
                <td className="px-3 py-2">{u.name ?? "-"}</td>
                <td className="px-3 py-2">
                  <button
                    className="rounded border px-3 py-1"
                    onClick={() => router.push(`/talk/${u.id}`)}
                  >
                    トーク
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-sm text-gray-600" colSpan={4}>
                  ユーザーがいません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
