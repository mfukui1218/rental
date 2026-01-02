"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";

const REGION = "us-central1"; // ← Functions のデプロイ先に合わせて統一

export async function requestApproval(requestEmail: string) {
  const email = requestEmail.trim().toLowerCase();
  if (!email) throw new Error("許可申請するメールアドレスを入力してください。");

  const functions = getFunctions(app, REGION);
  const requestAllowEmail = httpsCallable(functions, "requestAllowEmail");
  await requestAllowEmail({ email });
}
