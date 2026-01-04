"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Message = {
  id: string;
  text: string;
  senderUid: string;
  senderRole: "user" | "admin";
  createdAt?: any;
};

export default function TalkPage() {
  // ✅ Hooksは必ず上から全部呼ぶ（returnを先にしない）
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

  const canAccess = useMemo(() => {
    return !!uid && !!roomId && (isAdminClaim || uid === roomId);
  }, [uid, roomId, isAdminClaim]);

  // ✅ room の用意（本人 or admin が roomId の room を触れる前提）
  useEffect(() => {
    // ready前は何もしない（Hookは呼ばれてる）
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
          userId: roomId, // ★所有者は roomId（＝ユーザーuid）
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

  // ✅ messages subscribe（roomReady の後）
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
        senderRole,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "送信に失敗しました");
    }
  };

  // ✅ ここから下で表示分岐（returnは最後）
  if (!ready) return <div style={{ padding: 24 }}>読み込み中...</div>;
  if (!uid) return <div style={{ padding: 24 }}>ログインしてください</div>;
  if (!roomId) return <div style={{ padding: 24 }}>roomId が不正です</div>;

  if (!canAccess) {
    return (
      <div style={{ padding: 24 }}>
        <div>このトークにはアクセスできません</div>
        <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12 }}>
          uid: {uid}
          <br />
          roomId: {roomId}
        </div>
      </div>
    );
  }

  if (!roomReady) return <div style={{ padding: 24 }}>読み込み中...</div>;

  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>
        トーク {isAdminClaim ? `（ユーザー: ${roomId}）` : ""}
      </h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          height: "60vh",
          overflowY: "auto",
          marginBottom: 12,
        }}
      >
        {messages.map((m) => {
          const mine = m.senderUid === uid;
          return (
            <div
              key={m.id}
              style={{
                marginBottom: 8,
                textAlign: mine ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: mine ? "#4f46e5" : "#e5e7eb",
                  color: mine ? "#fff" : "#000",
                  maxWidth: "80%",
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={send}>送信</button>
      </div>
    </main>
  );
}
