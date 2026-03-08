import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import cors from "cors";

initializeApp();

const corsHandler = cors({ origin: true });

/**
 * setAdminByEmail:
 * - 呼び出したユーザーのIDトークンを検証
 * - そのユーザーの email が ADMIN_EMAIL と一致したら admin claim 付与
 */
export const setAdminByEmail = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
      if (!ADMIN_EMAIL) {
        res.status(400).json({ error: "ADMIN_EMAIL is not set" });
        return;
      }

      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing Authorization header" });
        return;
      }

      const idToken = authHeader.replace("Bearer ", "");
      const decoded = await getAuth().verifyIdToken(idToken);

      // ここで「呼んだ本人のメール」をチェック
      const callerEmail = String(decoded.email ?? "");
      if (callerEmail !== ADMIN_EMAIL) {
        res.status(403).json({ error: "forbidden" });
        return;
      }

      // 呼んだ本人を admin にする
      await getAuth().setCustomUserClaims(decoded.uid, { admin: true });

      res.json({ ok: true, uid: decoded.uid, email: callerEmail, admin: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e?.message ?? String(e) });
    }
  });
});

/**
 * deleteUserByUid:
 * - admin claim の人だけ削除できる
 */
export const deleteUserByUid = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing Authorization header" });
        return;
      }

      const idToken = authHeader.replace("Bearer ", "");
      const decoded = await getAuth().verifyIdToken(idToken);

      if (decoded.admin !== true) {
        res.status(403).json({ error: "admin only" });
        return;
      }

      const uid = String(req.body?.uid ?? "");
      if (!uid) {
        res.status(400).json({ error: "uid required" });
        return;
      }

      await getAuth().deleteUser(uid);
      res.json({ ok: true, uid });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e?.message ?? String(e) });
    }
  });
});
