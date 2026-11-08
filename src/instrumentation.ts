// Běží jednou při startu serveru (next start / next dev), ne při `next build`.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { assertAdminConfig } = await import("./lib/admin-session");
  // V produkci bez ADMIN_SESSION_SECRET vyhodí chybu se srozumitelnou hláškou a server nenaběhne.
  assertAdminConfig();
}
