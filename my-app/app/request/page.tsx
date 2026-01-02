import { Suspense } from "react";
import RequestClient from "./RequestClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>読み込み中...</div>}>
      <RequestClient />
    </Suspense>
  );
}
