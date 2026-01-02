// app/login/lib/authGate.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "ttnetnzua@gmail.com";
const REGION = "us-central1";

export async function checkAllowedOrAdmin(email: string) {
  const lower = email.toLowerCase().trim();

  if (lower === ADMIN_EMAIL.toLowerCase()) return true;

  const functions = getFunctions(app, REGION);
  const checkAllowed = httpsCallable(functions, "checkAllowedEmail");
  const res = await checkAllowed({ email: lower });
  const data = res.data as any;

  return !!data.allowed;
}
