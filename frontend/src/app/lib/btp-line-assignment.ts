/**
 * BTP-LINE ASSIGNMENT DATA
 * Manages which BTP runs on which line with scheduling
 */

import { AGGREGATED_BTP, SPEED_MASTER } from "./central-btp-data";

export interface BTPLineAssignment {
  id: string;
  btpCode: string;
  btpName: string;
  quantity: number;
  assignedLine: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  setupTime: number; // minutes
  speed: number; // m/min
  priority: "P1" | "P2" | "P3";
  deadline: string;
  status: "scheduled" | "in-progress" | "completed" | "delayed";
  locked: boolean;
}

// Assign BTP to lines with realistic scheduling
// Rule: 1 line can run multiple BTP sequentially
export const BTP_LINE_ASSIGNMENTS: BTPLineAssignment[] = [
  // LINE-01: Chạy 3 BTP tuần tự
  {
    id: "assign-1",
    btpCode: "52000255",
    btpName: "CM 70c19x2 22",
    quantity: 1808,
    assignedLine: "LINE-01",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:36:00"),
    duration: 156, // (1808/85) + 15 setup
    setupTime: 15,
    speed: 85,
    priority: "P1",
    deadline: "2024-02-10",
    status: "scheduled",
    locked: false,
  },
  {
    id: "assign-2",
    btpCode: "52001145",
    btpName: "CM 35c19x2 18",
    quantity: 2400,
    assignedLine: "LINE-01",
    startTime: new Date("2024-01-27T08:50:00"), // 14 min gap for changeover
    endTime: new Date("2024-01-27T11:02:00"),
    duration: 132, // (2400/92) + 10 setup
    setupTime: 10,
    speed: 92,
    priority: "P1",
    deadline: "2024-02-08",
    status: "scheduled",
    locked: false,
  },
  {
    id: "assign-3",
    btpCode: "53000100",
    btpName: "Cm 50c19x2",
    quantity: 4700,
    assignedLine: "LINE-01",
    startTime: new Date("2024-01-27T11:15:00"),
    endTime: new Date("2024-01-27T13:33:00"),
    duration: 138, // (4700/78) + 18 setup
    setupTime: 18,
    speed: 78,
    priority: "P2",
    deadline: "2024-02-15",
    status: "scheduled",
    locked: false,
  },

  // LINE-02: Chạy 2 BTP tuần tự
  {
    id: "assign-4",
    btpCode: "53000258",
    btpName: "Cm 95c19x2 63",
    quantity: 3024,
    assignedLine: "LINE-02",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T09:26:00"),
    duration: 206, // (3024/65) + 20 setup
    setupTime: 20,
    speed: 65,
    priority: "P1",
    deadline: "2024-02-08",
    status: "in-progress",
    locked: true,
  },
  {
    id: "assign-5",
    btpCode: "52002680",
    btpName: "GD Al 2x95c19",
    quantity: 5100,
    assignedLine: "LINE-02",
    startTime: new Date("2024-01-27T09:40:00"),
    endTime: new Date("2024-01-27T11:08:00"),
    duration: 88, // (5100/62) + 26 setup
    setupTime: 26,
    speed: 62,
    priority: "P2",
    deadline: "2024-02-16",
    status: "scheduled",
    locked: false,
  },

  // LINE-03: Chạy 2 BTP
  {
    id: "assign-6",
    btpCode: "52003962",
    btpName: "GD Cc 14/5 1kV",
    quantity: 5116,
    assignedLine: "LINE-03",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:06:00"),
    duration: 126, // (5116/95) + 12 setup
    setupTime: 12,
    speed: 95,
    priority: "P1",
    deadline: "2024-02-10",
    status: "scheduled",
    locked: false,
  },
  {
    id: "assign-7",
    btpCode: "52005230",
    btpName: "GD Cc 16/6 1kV",
    quantity: 3300,
    assignedLine: "LINE-03",
    startTime: new Date("2024-01-27T08:20:00"),
    endTime: new Date("2024-01-27T10:16:00"),
    duration: 116, // (3300/82) + 16 setup
    setupTime: 16,
    speed: 82,
    priority: "P1",
    deadline: "2024-02-12",
    status: "scheduled",
    locked: false,
  },

  // LINE-04: Single BTP
  {
    id: "assign-8",
    btpCode: "52004120",
    btpName: "GD Cc 10/3 0.6kV",
    quantity: 4200,
    assignedLine: "LINE-04",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:02:00"),
    duration: 122, // (4200/88) + 14 setup
    setupTime: 14,
    speed: 88,
    priority: "P3",
    deadline: "2024-02-25",
    status: "scheduled",
    locked: false,
  },

  // LINE-05: Chạy 2 BTP
  {
    id: "assign-9",
    btpCode: "52002295",
    btpName: "GD Al 2x70c19",
    quantity: 6300,
    assignedLine: "LINE-05",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:52:00"),
    duration: 172, // (6300/70) + 22 setup
    setupTime: 22,
    speed: 70,
    priority: "P1",
    deadline: "2024-02-09",
    status: "scheduled",
    locked: false,
  },
  {
    id: "assign-10",
    btpCode: "52003150",
    btpName: "GD Al 2x120c19",
    quantity: 4500,
    assignedLine: "LINE-05",
    startTime: new Date("2024-01-27T09:05:00"),
    endTime: new Date("2024-01-27T11:13:00"),
    duration: 128, // (4500/58) + 28 setup
    setupTime: 28,
    speed: 58,
    priority: "P2",
    deadline: "2024-02-22",
    status: "scheduled",
    locked: false,
  },

  // LINE-06: Large conductor
  {
    id: "assign-11",
    btpCode: "53000310",
    btpName: "Cm 120c19x2 88",
    quantity: 9300,
    assignedLine: "LINE-06",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T09:54:00"),
    duration: 234, // (9300/55) + 25 setup
    setupTime: 25,
    speed: 55,
    priority: "P1",
    deadline: "2024-02-08",
    status: "scheduled",
    locked: false,
  },

  // LINE-08: Heavy duty
  {
    id: "assign-12",
    btpCode: "53000405",
    btpName: "Cm 150c19x2 105",
    quantity: 3500,
    assignedLine: "LINE-08",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:33:00"),
    duration: 153, // (3500/48) + 30 setup
    setupTime: 30,
    speed: 48,
    priority: "P2",
    deadline: "2024-02-18",
    status: "scheduled",
    locked: false,
  },

  // LINE-10: Heavy conductor
  {
    id: "assign-13",
    btpCode: "53000520",
    btpName: "Cm 185c19x2 130",
    quantity: 2800,
    assignedLine: "LINE-10",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:22:00"),
    duration: 142, // (2800/42) + 35 setup
    setupTime: 35,
    speed: 42,
    priority: "P1",
    deadline: "2024-02-09",
    status: "scheduled",
    locked: false,
  },

  // LINE-12: Large cross-section
  {
    id: "assign-14",
    btpCode: "53000625",
    btpName: "Cm 240c19x2 168",
    quantity: 1900,
    assignedLine: "LINE-12",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T07:30:00"),
    duration: 90, // (1900/38) + 40 setup
    setupTime: 40,
    speed: 38,
    priority: "P2",
    deadline: "2024-02-20",
    status: "scheduled",
    locked: false,
  },

  // LINE-14: Heavy conductor
  {
    id: "assign-15",
    btpCode: "53000715",
    btpName: "Cm 300c19x2 210",
    quantity: 2600,
    assignedLine: "LINE-14",
    startTime: new Date("2024-01-27T06:00:00"),
    endTime: new Date("2024-01-27T08:06:00"),
    duration: 126, // (2600/32) + 45 setup
    setupTime: 45,
    speed: 32,
    priority: "P1",
    deadline: "2024-02-12",
    status: "scheduled",
    locked: false,
  },
];

// Production lines for assignment
export const PRODUCTION_LINES = [
  { id: "LINE-01", name: "LINE-01 - Drawing/Conductor", type: "drawing", status: "available" },
  { id: "LINE-02", name: "LINE-02 - Drawing/Conductor", type: "drawing", status: "running" },
  { id: "LINE-03", name: "LINE-03 - Ground Wire", type: "ground", status: "available" },
  { id: "LINE-04", name: "LINE-04 - Ground Wire", type: "ground", status: "available" },
  { id: "LINE-05", name: "LINE-05 - Aluminum Processing", type: "aluminum", status: "available" },
  { id: "LINE-06", name: "LINE-06 - Large Conductor", type: "drawing", status: "available" },
  { id: "LINE-07", name: "LINE-07 - Small Conductor", type: "drawing", status: "maintenance" },
  { id: "LINE-08", name: "LINE-08 - Heavy Duty", type: "drawing", status: "available" },
  { id: "LINE-09", name: "LINE-09 - Ground Wire", type: "ground", status: "breakdown" },
  { id: "LINE-10", name: "LINE-10 - Heavy Conductor", type: "drawing", status: "available" },
  { id: "LINE-11", name: "LINE-11 - Aluminum", type: "aluminum", status: "idle" },
  { id: "LINE-12", name: "LINE-12 - Large Cross-Section", type: "drawing", status: "available" },
  { id: "LINE-13", name: "LINE-13 - Ground Wire", type: "ground", status: "available" },
  { id: "LINE-14", name: "LINE-14 - Heavy Conductor", type: "drawing", status: "available" },
  { id: "LINE-15", name: "LINE-15 - Aluminum", type: "aluminum", status: "available" },
];

// Get assignments for a specific line
export function getAssignmentsForLine(lineId: string): BTPLineAssignment[] {
  return BTP_LINE_ASSIGNMENTS
    .filter(a => a.assignedLine === lineId)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

// Get assignment for a specific BTP
export function getAssignmentForBTP(btpCode: string): BTPLineAssignment | undefined {
  return BTP_LINE_ASSIGNMENTS.find(a => a.btpCode === btpCode);
}

// Calculate gap between two assignments
export function calculateGap(prev: BTPLineAssignment, next: BTPLineAssignment): number {
  const gapMs = next.startTime.getTime() - prev.endTime.getTime();
  return Math.floor(gapMs / (1000 * 60)); // minutes
}

// Check if line has capacity for new BTP
export function hasLineCapacity(lineId: string, proposedStart: Date, proposedEnd: Date): boolean {
  const lineAssignments = getAssignmentsForLine(lineId);
  
  for (const assignment of lineAssignments) {
    // Check for overlap
    if (
      (proposedStart >= assignment.startTime && proposedStart < assignment.endTime) ||
      (proposedEnd > assignment.startTime && proposedEnd <= assignment.endTime) ||
      (proposedStart <= assignment.startTime && proposedEnd >= assignment.endTime)
    ) {
      return false; // Overlap detected
    }
  }
  
  return true; // No overlap
}

// Get available lines for BTP
export function getAvailableLinesForBTP(btpCode: string): string[] {
  // Get lines that can run this BTP from Speed Master
  const capableLines = SPEED_MASTER
    .filter(sm => sm.btpCode === btpCode)
    .map(sm => sm.line);
  
  // Filter by status (available, idle, or running with capacity)
  return capableLines.filter(lineId => {
    const line = PRODUCTION_LINES.find(l => l.id === lineId);
    return line && (line.status === "available" || line.status === "idle" || line.status === "running");
  });
}

// Format time for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
