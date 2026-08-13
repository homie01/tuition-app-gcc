export const dynamic = "force-dynamic";

/** Frontend-only demo — no database is used. */
export async function GET() {
  return Response.json({ ok: true, mode: "frontend-demo" });
}
