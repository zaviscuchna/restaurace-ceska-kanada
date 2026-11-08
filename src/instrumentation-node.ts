// Kontrola konfigurace adminu při startu serveru (jen Node.js runtime, volá src/instrumentation.ts).
import { assertAdminConfig } from "./lib/admin-session";

if (process.env.NEXT_PHASE !== "phase-production-build") {
  try {
    assertAdminConfig();
  } catch (e) {
    // V produkci bez ADMIN_SESSION_SECRET: srozumitelná hláška do logu a konec procesu.
    // Bez exit by Next.js běžel dál a na každý požadavek vracel 500.
    console.error(`[admin] ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}
