"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "./rental.module.css";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type RentalItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  createdAt: number;
};

function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/o\/(.+)\?/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export default function RentalCreate() {
  const router = useRouter();
  const auth = getAuth();

  // フォーム
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // 編集モード
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string>(""); // 現在の画像URL保持

  // 一覧
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const { user, ready ,isAdminEmail} = useRequireAuth();

  if (!ready || !isAdminEmail) {
    return <div>読み込み中...</div>;
  }

  /* ===== 一覧ロード ===== */
  const loadRentals = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const q = query(
        collection(db, "rentals"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);

      const next: RentalItem[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data?.name ?? "",
          category: data?.category ?? "",
          description: data?.description ?? "",
          imageUrl: data?.imageUrl ?? "",
          createdAt: data?.createdAt ?? 0,
        };
      });

      setRentals(next);
    } catch (e) {
      console.error(e);
      setListError("一覧の取得に失敗しました");
    } finally {
      setListLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setName("");
    setCategory("");
    setDescription("");
    setEditingId(null);
    setEditingImageUrl("");
  };

  /* ===== 編集開始 ===== */
  const startEdit = (item: RentalItem) => {
    setEditingId(item.id);
    setEditingImageUrl(item.imageUrl || "");
    setFile(null); // 新規ファイルは未選択に戻す
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ===== 登録/更新 ===== */
  const submit = async () => {
    if (!name.trim()) return alert("商品名は必須です");

    // 新規作成のときだけ画像必須にする
    if (!editingId && !file) return alert("画像を選択してください");

    setSaving(true);
    try {
      let imageUrl = editingImageUrl;

      // 画像を選び直した場合のみ差し替え
      if (file) {
        const path = `rentals/${crypto.randomUUID()}_${file.name}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, file, { contentType: file.type });
        imageUrl = await getDownloadURL(storageRef);

        // 編集中で、古い画像があるなら消す（任意）
        if (editingId && editingImageUrl) {
          const oldPath = storagePathFromDownloadUrl(editingImageUrl);
          if (oldPath) {
            try {
              await deleteObject(ref(storage, oldPath));
            } catch (e) {
              // 失敗しても更新自体は続行
              console.warn("old image delete failed", e);
            }
          }
        }
      }

      if (editingId) {
        // 更新
        await updateDoc(doc(db, "rentals", editingId), {
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          imageUrl: imageUrl || "",
          // createdAt は更新しない
        });
      } else {
        // 新規
        await addDoc(collection(db, "rentals"), {
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          imageUrl: imageUrl || "",
          createdAt: Date.now(),
        });
      }

      resetForm();
      await loadRentals();
    } catch (e) {
      console.error(e);
      alert(editingId ? "更新に失敗しました" : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  /* ===== 削除 ===== */
  const deleteRental = async (item: RentalItem) => {
    if (!confirm(`「${item.name}」を削除しますか？`)) return;

    try {
      await deleteDoc(doc(db, "rentals", item.id));

      if (item.imageUrl) {
        const p = storagePathFromDownloadUrl(item.imageUrl);
        if (p) await deleteObject(ref(storage, p));
      }

      // 編集中のやつを消したらフォームも戻す
      setRentals((prev) => prev.filter((r) => r.id !== item.id));
      if (editingId === item.id) resetForm();
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  /* ===== UI ===== */
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>レンタル商品登録</h1>

        {/* 登録フォーム */}
        <div className={styles.form}>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <div style={{ fontWeight: 700 }}>
              {editingId ? "編集モード" : "新規登録"}
            </div>
            {editingId ? (
              <button
                type="button"
                className={styles.editButton}
                onClick={resetForm}
                disabled={saving}
              >
                編集をやめる
              </button>
            ) : null}
          </div>

          {/* 編集時は画像必須にしない（差し替えたい時だけ選ぶ） */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {editingId && editingImageUrl ? (
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              画像：未選択なら現状維持
            </div>
          ) : null}

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="商品名" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="料金" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="説明" />

          <button onClick={submit} disabled={saving}>
            {saving ? (editingId ? "更新中..." : "保存中...") : (editingId ? "更新" : "登録")}
          </button>
        </div>

        {/* 一覧 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>登録済み一覧</h2>

          {listError ? (
            <p>{listError}</p>
          ) : listLoading ? (
            <p>読み込み中...</p>
          ) : (
            <div className={styles.partsGrid}>
              {rentals.map((r) => (
                <div key={r.id} className={styles.cardUnit}>
                  {/* カード本体 */}
                  <button
                    type="button"
                    className={styles.cardButton}
                    onClick={() => router.push(`/rentals/${r.id}`)}
                  >
                    <div className={styles.thumb}>
                      <img
                        src={r.imageUrl || "/images/placeholder.png"}
                        alt=""
                        className={styles.thumbImg}
                      />
                    </div>

                    <div>
                      <div className={styles.animal}>{r.category}</div>
                      <div className={styles.partName}>{r.name}</div>
                      <div className={styles.desc}>{r.description}</div>
                    </div>
                  </button>

                  {/* 操作ボタン */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEdit(r)}
                      disabled={saving}
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => deleteRental(r)}
                      disabled={saving}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
