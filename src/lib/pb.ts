import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? "http://127.0.0.1:8090";

// Server-side: nová instance pro každý request (důležité u server components)
export function createPb() {
  return new PocketBase(PB_URL);
}

// Klientský singleton pro admin stránku
let _clientPb: PocketBase | null = null;
export function getClientPb() {
  if (!_clientPb) _clientPb = new PocketBase(PB_URL);
  return _clientPb;
}
