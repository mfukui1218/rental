import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp();

export const setAdminByEmail = onRequest(async (req, res) => {
  try {
    const email = String(req.query.email ?? req.body?.email ?? "");
    if (!email) {
      res.status(400).json({ error: "email required" });
      return;
    }

    const auth = getAuth();
    const user = await auth.getUserByEmail(email);

    await auth.setCustomUserClaims(user.uid, { admin: true });

    res.json({
      ok: true,
      uid: user.uid,
      email,
      admin: true,
    });
    return; // ★ void を返す
  } catch (e: any) {
    res.status(500).json({ error: e.message });
    return; // ★ ここも必須
  }
});
