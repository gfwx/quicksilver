import type { Payload } from "@/lib/types";

export function checkPayload(payload: Payload) {
  if (!payload) {
    console.error("Payload is null");
    return false;
  }

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    console.error("Payload expired");
    return false;
  }

  return true;
}
