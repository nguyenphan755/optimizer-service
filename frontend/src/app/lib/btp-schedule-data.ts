// BTP-based scheduling data for line utilization Gantt chart

export type Priority = 'P1' | 'P2' | 'P3';
export type ScheduleStatus = 'Planned' | 'Running' | 'Completed' | 'Locked';

export interface BTPScheduleBlock {
  id: string;
  lineId: string;
  btpCode: string;
  productCode: string;
  productName: string;
  priority: Priority;
  plannedStart: number; // hour offset from start of timeline
  plannedEnd: number;
  actualStart?: number;
  actualEnd?: number;
  status: ScheduleStatus;
  locked: boolean;
  operations: string[]; // List of operation names for this BTP (for tooltip)
  length: number; // meters
  totalDuration: number; // hours
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#9ca3af",
};

export const PRIORITY_COLORS_DARK: Record<Priority, string> = {
  P1: "#f87171",
  P2: "#fb923c",
  P3: "#d1d5db",
};

export const PRODUCT_COLORS: Record<string, string> = {
  "CVV 3x240": "#3b82f6",
  "CVV 4x150": "#10b981",
  "XLPE 3x185": "#a855f7",
  "CVV 2x95": "#f59e0b",
  "XLPE 4x240": "#06b6d4",
};

export const PRODUCT_COLORS_DARK: Record<string, string> = {
  "CVV 3x240": "#60a5fa",
  "CVV 4x150": "#34d399",
  "XLPE 3x185": "#c084fc",
  "CVV 2x95": "#fbbf24",
  "XLPE 4x240": "#22d3ee",
};

export const PRODUCTION_LINES = [
  { id: "LINE-01", name: "Drawing Line 1", status: "Running" },
  { id: "LINE-02", name: "Drawing Line 2", status: "Available" },
  { id: "LINE-03", name: "Drawing Line 3", status: "Running" },
  { id: "LINE-08", name: "Annealing Line 1", status: "Running" },
  { id: "LINE-12", name: "Stranding Line 1", status: "Running" },
  { id: "LINE-13", name: "Stranding Line 2", status: "Available" },
  { id: "LINE-14", name: "Stranding Line 3", status: "Maintenance" },
  { id: "LINE-23", name: "Armoring Line 1", status: "Running" },
  { id: "LINE-24", name: "Armoring Line 2", status: "Available" },
  { id: "LINE-25", name: "Armoring Line 3", status: "Breakdown" },
  { id: "LINE-34", name: "Sheathing Line 1", status: "Idle" },
  { id: "LINE-35", name: "Sheathing Line 2", status: "Running" },
  { id: "LINE-45", name: "Testing Line 1", status: "Available" },
  { id: "LINE-46", name: "Testing Line 2", status: "Available" },
  { id: "LINE-48", name: "Packing Line 1", status: "Available" },
];

// Sample BTP schedule blocks - each represents ONE BTP running on ONE line
export const BTP_SCHEDULE: BTPScheduleBlock[] = [
  // LINE-01 schedule
  {
    id: "sch-1",
    lineId: "LINE-01",
    btpCode: "BTP-520000",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable",
    priority: "P1",
    plannedStart: 0,
    plannedEnd: 5,
    actualStart: 0,
    actualEnd: 5.2,
    status: "Completed",
    locked: false,
    operations: ["Drawing", "Annealing", "Stranding", "Armoring", "Sheathing"],
    length: 15000,
    totalDuration: 5,
  },
  {
    id: "sch-2",
    lineId: "LINE-01",
    btpCode: "BTP-520057",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable",
    priority: "P1",
    plannedStart: 5.17, // 10-minute gap (0.17 hours)
    plannedEnd: 8,
    actualStart: 5.3,
    status: "Running",
    locked: false,
    operations: ["Drawing", "Stranding", "Armoring", "Sheathing"],
    length: 8500,
    totalDuration: 2.83,
  },
  {
    id: "sch-3",
    lineId: "LINE-01",
    btpCode: "BTP-520142",
    productCode: "CVV 4x150",
    productName: "CVV 4x150 Cable",
    priority: "P2",
    plannedStart: 8.25, // 15-minute gap
    plannedEnd: 12.5,
    status: "Planned",
    locked: false,
    operations: ["Drawing", "Stranding", "Sheathing", "Testing"],
    length: 12000,
    totalDuration: 4.25,
  },
  
  // LINE-02 schedule
  {
    id: "sch-4",
    lineId: "LINE-02",
    btpCode: "BTP-531200",
    productCode: "XLPE 3x185",
    productName: "XLPE 3x185 Cable",
    priority: "P1",
    plannedStart: 0.5,
    plannedEnd: 4.5,
    actualStart: 0.5,
    actualEnd: 4.8,
    status: "Completed",
    locked: true,
    operations: ["Drawing", "Annealing", "Insulation", "Stranding"],
    length: 10000,
    totalDuration: 4,
  },
  {
    id: "sch-5",
    lineId: "LINE-02",
    btpCode: "BTP-531245",
    productCode: "XLPE 3x185",
    productName: "XLPE 3x185 Cable",
    priority: "P2",
    plannedStart: 5,
    plannedEnd: 9.5,
    status: "Running",
    locked: false,
    operations: ["Drawing", "Insulation", "Stranding", "Sheathing"],
    length: 13500,
    totalDuration: 4.5,
  },
  {
    id: "sch-6",
    lineId: "LINE-02",
    btpCode: "BTP-520890",
    productCode: "CVV 2x95",
    productName: "CVV 2x95 Cable",
    priority: "P3",
    plannedStart: 9.83, // 20-minute gap
    plannedEnd: 14,
    status: "Planned",
    locked: false,
    operations: ["Drawing", "Stranding", "Armoring"],
    length: 9800,
    totalDuration: 4.17,
  },

  // LINE-03 schedule
  {
    id: "sch-7",
    lineId: "LINE-03",
    btpCode: "BTP-540100",
    productCode: "XLPE 4x240",
    productName: "XLPE 4x240 Cable",
    priority: "P1",
    plannedStart: 1,
    plannedEnd: 6.5,
    actualStart: 1,
    status: "Running",
    locked: false,
    operations: ["Drawing", "Annealing", "Insulation", "Stranding", "Armoring"],
    length: 18000,
    totalDuration: 5.5,
  },
  {
    id: "sch-8",
    lineId: "LINE-03",
    btpCode: "BTP-520450",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable",
    priority: "P2",
    plannedStart: 6.75,
    plannedEnd: 11,
    status: "Planned",
    locked: false,
    operations: ["Drawing", "Stranding", "Sheathing"],
    length: 11000,
    totalDuration: 4.25,
  },

  // LINE-12 schedule
  {
    id: "sch-9",
    lineId: "LINE-12",
    btpCode: "BTP-520000",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable (Stranding stage)",
    priority: "P1",
    plannedStart: 2.5,
    plannedEnd: 6,
    actualStart: 2.5,
    status: "Running",
    locked: false,
    operations: ["Stranding"],
    length: 15000,
    totalDuration: 3.5,
  },
  {
    id: "sch-10",
    lineId: "LINE-12",
    btpCode: "BTP-520057",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable (Stranding stage)",
    priority: "P1",
    plannedStart: 6.3,
    plannedEnd: 9,
    status: "Planned",
    locked: false,
    operations: ["Stranding"],
    length: 8500,
    totalDuration: 2.7,
  },

  // LINE-23 schedule (Armoring)
  {
    id: "sch-11",
    lineId: "LINE-23",
    btpCode: "BTP-520000",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable (Armoring stage)",
    priority: "P1",
    plannedStart: 6,
    plannedEnd: 10,
    status: "Planned",
    locked: false,
    operations: ["Armoring"],
    length: 15000,
    totalDuration: 4,
  },

  // LINE-34 schedule (Sheathing)
  {
    id: "sch-12",
    lineId: "LINE-34",
    btpCode: "BTP-520000",
    productCode: "CVV 3x240",
    productName: "CVV 3x240 Cable (Sheathing stage)",
    priority: "P1",
    plannedStart: 10,
    plannedEnd: 13,
    status: "Planned",
    locked: false,
    operations: ["Sheathing"],
    length: 15000,
    totalDuration: 3,
  },
];

export function getGapMinutes(currentEnd: number, nextStart: number): number {
  return Math.round((nextStart - currentEnd) * 60);
}

export function shouldShowGap(gapMinutes: number, threshold: number = 5): boolean {
  return gapMinutes >= threshold;
}

export function getLineSchedule(lineId: string): BTPScheduleBlock[] {
  return BTP_SCHEDULE
    .filter(block => block.lineId === lineId)
    .sort((a, b) => a.plannedStart - b.plannedStart);
}