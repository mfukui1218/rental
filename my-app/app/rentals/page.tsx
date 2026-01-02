"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./rentals.module.css";

type RentalItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
};

export default function RentalsPage() {
  const router = useRouter();

  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRentals = async () => {
      setLoading(true);
      setError(null);

      try {
        const snap = await getDocs(collection(db, "rentals"));

        const next: RentalItem[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data?.name ?? "",
            category: data?.category ?? "",
            description: data?.description ?? "",
            imageUrl: data?.imageUrl ?? "",
          };
        });

        next.sort((a, b) =>
          `${a.category}${a.name}`.localeCompare(`${b.category}${b.name}`, "ja")
        );

        setRentals(next);
      } catch (e) {
        console.error("rentals load error", e);
        setError("データ取得に失敗しました。Firestoreの権限設定を確認してください。");
      } finally {
        setLoading(false);
      }
    };

    loadRentals();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header>
          <h1 className={styles.title}>レンタル商品一覧</h1>
          <p className={styles.subtitle}>公開一覧（ログイン不要）</p>
        </header>

        {loading ? (
          <p style={{ fontSize: 14 }}>商品を読み込み中...</p>
        ) : error ? (
          <p style={{ fontSize: 14 }}>{error}</p>
        ) : rentals.length === 0 ? (
          <p style={{ fontSize: 14 }}>登録されている商品がありません。</p>
        ) : (
		 /* ===== 一覧レイアウト ===== */
		<div className={styles.partsGrid}>
		  {rentals.map((rental) => (
		    <button
		      key={rental.id}
		      type="button"
		      className={styles.cardButton}
		      onClick={() => router.push(`/rentals/${rental.id}`)}
		    >
		      <div className={styles.thumb}>
		        <img
		          src={rental.imageUrl || "/images/placeholder.png"}
		          alt={`${rental.category} ${rental.name}`}
		          className={styles.thumbImg}
		        />
		      </div>
		
		      <div>
		        <div className={styles.animal}>{rental.category}</div>
		        <div className={styles.partName}>{rental.name}</div>
		        <div className={styles.desc}>{rental.description}</div>
		      </div>
		    </button>
		  ))}
		</div>
        )}

        <div className={styles.bottomNav}>
          <button
            type="button"
            className={styles.dashButton}
            onClick={() => router.push("/home")}
          >
            HOMEへ
          </button>
        </div>
      </div>
    </main>
  );
}
