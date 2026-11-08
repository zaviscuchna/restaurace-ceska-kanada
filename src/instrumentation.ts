// Běží jednou při startu serveru (next start / next dev), ne při `next build`.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
