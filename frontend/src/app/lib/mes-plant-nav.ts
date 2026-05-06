import type { MesUser } from "@/app/api/types";

/**
 * User nhà máy (role `user`, không phải HO): chỉ các màn được phép theo nghiệp vụ.
 * Admin hoặc user có plant_code HO: toàn bộ ứng dụng (như admin).
 */
export const PLANT_USER_ALLOWED_SCREENS = new Set([
  "dashboard-overview",
  "dashboard-plant-detail",
  "material-lookup",
  "capacity-report",
  "missing-data",
  "plant-upload",
]);

/** User HO (plant_code): quyền menu & dữ liệu như admin, role vẫn là `user`. */
export function isHeadOfficeMesUser(user: MesUser | null): boolean {
  if (!user || user.role === "admin") return false;
  const c = user.plant_code?.trim().toUpperCase();
  return c === "HO";
}

/** Admin hoặc tài khoản HO: toàn bộ màn, Tài khoản, Missing/Upload không khóa NM. */
export function hasMesAdminLikeAccess(user: MesUser | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isHeadOfficeMesUser(user);
}

/** User nhà máy bị giới hạn menu (không phải admin, không phải HO). */
export function isPlantPortalUser(user: MesUser | null): boolean {
  return Boolean(user && user.role !== "admin" && !isHeadOfficeMesUser(user));
}

export function isScreenAllowedForMesUser(user: MesUser | null, screen: string): boolean {
  if (!user) return false;
  if (hasMesAdminLikeAccess(user)) return true;
  return PLANT_USER_ALLOWED_SCREENS.has(screen);
}

/** Label "Cadivi …" dùng đồng bộ filter Missing Data / UI (khớp plants từ API). */
export function cadiviPlantLabel(name: string): string {
  return name.startsWith("Cadivi ") ? name : `Cadivi ${name}`;
}

/** Hiển thị trên header theo `plant_code` tài khoản (LT/TA/DN/BN/HO). */
const HEADER_PLANT_BY_CODE: Record<string, string> = {
  LT: "CADIVI Đồng Nai",
  TA: "CADIVI Sài Gòn",
  DN: "CADIVI Đà Nẵng",
  BN: "CADIVI Bắc Ninh",
  HO: "Head Office",
};

export function mesHeaderPlantLabel(plantCode: string | null | undefined): string | null {
  if (!plantCode?.trim()) return null;
  const k = plantCode.trim().toUpperCase();
  return HEADER_PLANT_BY_CODE[k] ?? null;
}

/** Tên gọi ngắn cho lời chào: phần trước @ nếu username là email. */
export function mesGreetingName(user: MesUser): string {
  const u = user.username.trim();
  if (u.includes("@")) {
    const local = u.split("@")[0]?.trim();
    if (local) return local;
  }
  const d = user.display_name?.trim();
  if (d) return d;
  return u || "bạn";
}
