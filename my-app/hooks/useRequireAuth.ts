"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // ★ custom claims admin（Firestore rules と同じ判定）
  const [isAdminClaim, setIsAdminClaim] = useState(false);

  // （表示用）env の admin email 判定：UIでメニュー出すだけに使う
  const isAdminEmail =
    !!user?.email && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setIsAdminClaim(false);
        setReady(true);
        router.replace("/login");
        return;
      }

      setUser(u);

      // ✅ users/{uid} を必ず作る（無ければ作成、あれば維持）
      // - merge:true なので既存データは壊さない
      // - createdAt は初回だけ入れたいなら下のコメント版を使ってもOK
      try {
        await setDoc(
          doc(db, "users", u.uid),
          {
            email: u.email ?? null,
            name: u.displayName ?? null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.log("[ensure user doc error]", e);
        // ここで落としてもログイン自体は続行
      }

      try {
        const token = await u.getIdTokenResult(true);
        console.log("[claims]", token.claims);
        console.log("[projectId]", (auth.app.options as any).projectId);
        setIsAdminClaim(token.claims?.admin === true);
      } catch (e) {
        console.log("[claims error]", e);
        setIsAdminClaim(false);
      }

      setReady(true);
    });

    return () => unsub();
  }, [router]);

  return { user, ready, isAdminEmail, isAdminClaim };
}
