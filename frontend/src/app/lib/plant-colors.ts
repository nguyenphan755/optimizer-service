/**
 * Plant Color System
 * Màu sắc nhận diện cho 4 nhà máy CADIVI
 */

export const PLANT_COLORS = {
  "Cadivi Long Thành": {
    primary: "#3b82f6", // Blue
    light: "#dbeafe",
    dark: "#1e40af",
    bg: "#eff6ff",
    border: "#93c5fd",
    text: "#1e40af",
  },
  "Cadivi Tân Á": {
    primary: "#10b981", // Green
    light: "#d1fae5",
    dark: "#059669",
    bg: "#f0fdf4",
    border: "#6ee7b7",
    text: "#059669",
  },
  "Cadivi Đà Nẵng": {
    primary: "#f59e0b", // Orange
    light: "#fef3c7",
    dark: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    text: "#d97706",
  },
  "Cadivi Bắc Ninh": {
    primary: "#8b5cf6", // Purple
    light: "#ede9fe",
    dark: "#7c3aed",
    bg: "#faf5ff",
    border: "#c4b5fd",
    text: "#7c3aed",
  },
} as const;

export type PlantName = keyof typeof PLANT_COLORS;

/**
 * Get plant color by plant name
 */
export function getPlantColor(plantName: string, shade: "primary" | "light" | "dark" | "bg" | "border" | "text" = "primary"): string {
  const plant = plantName as PlantName;
  if (PLANT_COLORS[plant]) {
    return PLANT_COLORS[plant][shade];
  }
  // Default to gray if plant not found
  return shade === "primary" ? "#6b7280" : "#f3f4f6";
}

/**
 * Get short plant name (without "Cadivi" prefix)
 */
export function getShortPlantName(plantName: string): string {
  return plantName.replace("Cadivi ", "");
}

/** Chuẩn hóa tên hiển thị đủ tiền tố Cadivi (API master trả `name` ngắn). */
export function cadiviPlantLabel(name: string): string {
  return name.startsWith("Cadivi ") ? name : `Cadivi ${name}`;
}

/**
 * Status colors (độc lập với plant colors)
 */
export const STATUS_COLORS = {
  success: {
    primary: "#10b981",
    light: "#d1fae5",
    dark: "#059669",
    bg: "#f0fdf4",
  },
  warning: {
    primary: "#f59e0b",
    light: "#fef3c7",
    dark: "#d97706",
    bg: "#fffbeb",
  },
  error: {
    primary: "#ef4444",
    light: "#fee2e2",
    dark: "#dc2626",
    bg: "#fef2f2",
  },
  info: {
    primary: "#3b82f6",
    light: "#dbeafe",
    dark: "#1e40af",
    bg: "#eff6ff",
  },
  pending: {
    primary: "#f59e0b",
    light: "#fef3c7",
    dark: "#d97706",
    bg: "#fffbeb",
  },
  in_progress: {
    primary: "#3b82f6",
    light: "#dbeafe",
    dark: "#1e40af",
    bg: "#eff6ff",
  },
  completed: {
    primary: "#10b981",
    light: "#d1fae5",
    dark: "#059669",
    bg: "#f0fdf4",
  },
} as const;

/**
 * Priority colors
 */
export const PRIORITY_COLORS = {
  high: {
    primary: "#ef4444",
    light: "#fee2e2",
    dark: "#dc2626",
    bg: "#fef2f2",
  },
  medium: {
    primary: "#f59e0b",
    light: "#fef3c7",
    dark: "#d97706",
    bg: "#fffbeb",
  },
  low: {
    primary: "#6b7280",
    light: "#f3f4f6",
    dark: "#4b5563",
    bg: "#f9fafb",
  },
} as const;

/**
 * Chart colors cho Recharts
 * Sử dụng màu của 4 nhà máy theo thứ tự
 */
export const CHART_COLORS = [
  PLANT_COLORS["Cadivi Long Thành"].primary,   // Blue
  PLANT_COLORS["Cadivi Tân Á"].primary,         // Green
  PLANT_COLORS["Cadivi Đà Nẵng"].primary,       // Orange
  PLANT_COLORS["Cadivi Bắc Ninh"].primary,      // Purple
];

/**
 * Get chart color by index
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
