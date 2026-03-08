"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./talk.module.css";

type Message = {
  id: string;
  text: string;
  senderUid: string;
  senderName?: string;
  senderRole: "user" | "admin";
  createdAt?: any;
};

export default function TalkPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = useMemo(() => {
    const raw = (params as any)?.roomId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { user, ready, isAdminClaim } = useRequireAuth();
  const uid = user?.uid ?? null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [roomReady, setRoomReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 名前
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(true);

  // 管理者用：相手ユーザーの名前
  const [roomUserName, setRoomUserName] = useState<string | null>(null);

  const canAccess = useMemo(() => {
    return !!uid && !!roomId && (isAdminClaim || uid === roomId);
  }, [uid, roomId, isAdminClaim]);

  // Firestoreからユーザー名を取得
  useEffect(() => {
    if (!ready || !uid) return;
    setNameLoading(true);

    (async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const name = userDoc.data()?.displayName;
        if (name) {
          setDisplayName(name);
        }
      } catch (e) {
        console.error("name fetch error:", e);
      } finally {
        setNameLoading(false);
      }
    })();
  }, [ready, uid]);

  // 管理者の場合、roomId（相手ユーザー）の名前を取得
  useEffect(() => {
    if (!ready || !isAdminClaim || !roomId) return;

    (async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", roomId));
        const name = userDoc.data()?.displayName;
        setRoomUserName(name ?? null);
      } catch (e) {
        console.error("room user name fetch error:", e);
      }
    })();
  }, [ready, isAdminClaim, roomId]);

  // room の用意
  useEffect(() => {
    if (!ready) return;
    if (!uid || !roomId) {
      setRoomReady(false);
      return;
    }
    if (!canAccess) {
      setRoomReady(false);
      return;
    }

    (async () => {
      const roomRef = doc(db, "rooms", roomId);

      await setDoc(
        roomRef,
        {
          type: "support",
          userId: roomId,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setRoomReady(true);
    })().catch((e) => {
      console.error("room ensure failed:", e);
      setRoomReady(false);
    });
  }, [ready, uid, roomId, canAccess]);

  // messages subscribe
  useEffect(() => {
    if (!ready) return;
    if (!uid || !roomId || !roomReady) return;

    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Message[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Message, "id">),
        }));
        setMessages(list);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          30
        );
      },
      (err) => {
        console.error("snapshot error:", err);
        setMessages([]);
      }
    );

    return () => unsub();
  }, [ready, uid, roomId, roomReady]);

  const deleteMessage = async (messageId: string) => {
    if (!roomId) return;
    if (!confirm("このメッセージを削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "rooms", roomId, "messages", messageId));
    } catch (e: any) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  const send = async () => {
    if (!ready) return;
    if (!uid) return alert("ログインしてください");
    if (!roomId) return;
    if (!canAccess) return alert("このトークにはアクセスできません");
    if (!roomReady) return alert("準備中です。少し待ってください");
    if (!text.trim()) return;

    const senderRole: "user" | "admin" = isAdminClaim ? "admin" : "user";

    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: text.trim(),
        senderUid: uid,
        senderName: isAdminClaim ? "管理者" : (displayName ?? "名無し"),
        senderRole,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "送信に失敗しました");
    }
  };

  // 表示分岐
  if (!ready || nameLoading)
    return <div className={styles.loading}>読み込み中...</div>;
  if (!uid) return <div className={styles.loading}>ログインしてください</div>;
  if (!roomId) return <div className={styles.loading}>roomId が不正です</div>;

  if (!canAccess) {
    return <div className={styles.loading}>このトークにはアクセスできません</div>;
  }

  if (!roomReady) return <div className={styles.loading}>読み込み中...</div>;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          戻る
        </button>
        <div>
          <div className={styles.headerTitle}>
            {isAdminClaim
              ? (roomUserName ?? "名前未設定")
              : "管理者とのトーク"}
          </div>
          {!isAdminClaim && (
            <div className={styles.headerSub}>{displayName}</div>
          )}
        </div>
      </div>

      <div className={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", opacity: 0.4, marginTop: 40, fontSize: 14 }}>
            メッセージはまだありません
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderUid === uid;
          return (
            <div
              key={m.id}
              className={`${styles.msgRow} ${mine ? styles.msgRowMine : styles.msgRowOther}`}
            >
              <div className={styles.senderName}>
                {m.senderName ?? (m.senderRole === "admin" ? "管理者" : "名無し")}
              </div>
              <div className={styles.bubbleWrap}>
                {isAdminClaim && !mine && (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className={styles.deleteMsg}
                  >
                    削除
                  </button>
                )}
                <div
                  className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleOther}`}
                >
                  {m.text}
                </div>
                {isAdminClaim && mine && (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className={styles.deleteMsg}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="メッセージを入力"
          className={styles.textInput}
        />
        <button onClick={send} className={styles.sendButton}>
          送信
        </button>
      </div>
    </main>
  );
}
