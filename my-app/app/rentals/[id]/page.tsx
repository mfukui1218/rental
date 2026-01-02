"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "./rentalDetail.module.css";

type RentalDoc = {
  name?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
};

export default function RentalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const rawId = params?.id;
  const id = useMemo(() => (Array.isArray(rawId) ? rawId[0] : rawId), [rawId]);

  const [item, setItem] = useState<(RentalDoc & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "rentals", id));
        if (snap.exists()) {
          setItem({ id: snap.id, ...(snap.data() as RentalDoc) });
        } else {
          setItem(null);
        }
      } catch (e) {
        console.error(e);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (!id || loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>読み込み中...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>商品詳細</h1>
          <p className={styles.text}>この商品は登録されていません。</p>
          <button
            onClick={() => router.push("/rentals")}
            className={styles.button}
          >
            一覧に戻る
          </button>
        </div>
      </main>
    );
  }

  const name = item.name ?? "名称未登録";
  const category = item.category ?? "";
  const desc = item.description ?? "説明未登録";
  const img = item.imageUrl || "/images/placeholder.png";

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h2 className={styles.partTitle}>
          {name}
        </h2>

        <div className={styles.imageWrapper}>
          <img
            src={img}
            alt={`${category} ${name}`.trim()}
            className={styles.image}
          />
        </div>

        <p className={styles.description}>{desc}</p>

        <div className={styles.infoBox}>
          <p className={styles.text}>
            <strong>料金：</strong>
            {category || "未登録"}
          </p>
		  <div className={styles.actionRow}>
  		    <button
  		      onClick={() => router.push(`/request?rentalId=${item.id}`)}
  		      className={styles.button}
  		    >
  		      この商品を申し込む
  		    </button>
  		  </div>

          <div className={styles.actionRow}>
            <button
              onClick={() => router.push("/rentals")}
              className={styles.button}
            >
              一覧に戻る
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
