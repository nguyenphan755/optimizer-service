/** Legacy: từng lưu access token trong sessionStorage; giờ dùng cookie httpOnly — xóa khóa cũ nếu còn. */
const LEGACY_TOKEN_KEY = "mes_access_token";

export function clearMesSession(): void {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* private mode, etc. */
  }
}
