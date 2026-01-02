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
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "./rental.module.css";

type RentalItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  createdAt: number;
};

export default function RentalCreate() {
  const router = useRouter();
  const auth = getAuth();

  const [authReady, setAuthReady] = useState(false);

  // フォーム
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // 一覧
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  /* ===== 認証ガード ===== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/login");
      else setAuthReady(true);
    });
    return () => unsub();
  }, [auth, router]);

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

  useEffect(() => {
    if (authReady) loadRentals();
  }, [authReady]);

  /* ===== 登録 ===== */
  const submit = async () => {
    if (!authReady) return alert("ログイン確認中です");
    if (!file || !name) return alert("必須項目が未入力です");

    setSaving(true);
    try {
      const path = `rentals/${crypto.randomUUID()}_${file.name}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file, { contentType: file.type });
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "rentals"), {
        name,
        category,
        description,
        imageUrl,
        createdAt: Date.now(),
      });

      setFile(null);
      setName("");
      setCategory("");
      setDescription("");

      await loadRentals();
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
        const decoded = decodeURIComponent(item.imageUrl);
        const match = decoded.match(/\/o\/(.+)\?/);
        if (match?.[1]) {
          await deleteObject(ref(storage, match[1]));
        }
      }

      setRentals((prev) => prev.filter((r) => r.id !== item.id));
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
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="商品名" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="料金" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="説明" />
          <button onClick={submit} disabled={saving}>
            {saving ? "保存中..." : "登録"}
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
              
                  {/* 削除ボタン（被せない） */}
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => deleteRental(r)}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
