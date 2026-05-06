/**
 * GANTT CHART DATA
 * Generated from scheduled BTP results for timeline visualization
 */

import { SCHEDULED_RESULTS, AGGREGATED_BTP, getPriorityColor, getStatusColor } from "./central-btp-data";

export interface GanttBlock {
  id: string;
  btpCode: string;
  btpName: string;
  lineId: string;
  lineName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  quantity: number;
  priority: "P1" | "P2" | "P3";
  deadline: string;
  status: "scheduled" | "in-progress" | "completed" | "delayed";
  locked: boolean;
}

// Production lines for Gantt
export const GANTT_LINES = [
  { id: "LINE-01", name: "LINE-01 - Drawing/Conductor", type: "drawing" },
  { id: "LINE-02", name: "LINE-02 - Drawing/Conductor", type: "drawing" },
  { id: "LINE-03", name: "LINE-03 - Drawing/Conductor", type: "drawing" },
  { id: "LINE-04", name: "LINE-04 - Drawing/Conductor", type: "drawing" },
  { id: "LINE-05", name: "LINE-05 - Aluminum Processing", type: "aluminum" },
  { id: "LINE-06", name: "LINE-06 - Large Conductor", type: "drawing" },
  { id: "LINE-07", name: "LINE-07 - Small Conductor", type: "drawing" },
  { id: "LINE-08", name: "LINE-08 - Heavy Duty", type: "drawing" },
  { id: "LINE-09", name: "LINE-09 - Ground Wire", type: "ground" },
  { id: "LINE-10", name: "LINE-10 - Heavy Conductor", type: "drawing" },
  { id: "LINE-11", name: "LINE-11 - Aluminum", type: "aluminum" },
  { id: "LINE-12", name: "LINE-12 - Large Cross-Section", type: "drawing" },
  { id: "LINE-13", name: "LINE-13 - Ground Wire", type: "ground" },
  { id: "LINE-14", name: "LINE-14 - Heavy Conductor", type: "drawing" },
  { id: "LINE-15", name: "LINE-15 - Aluminum", type: "aluminum" },
];

// Parse time string "2024-01-27 06:00" to Date
function parseTime(timeStr: string): Date {
  return new Date(timeStr);
}

// Convert scheduled results to Gantt blocks
export const GANTT_BLOCKS: GanttBlock[] = SCHEDULED_RESULTS.map((result, index) => ({
  id: `gantt-${index}`,
  btpCode: result.btpCode,
  btpName: result.btpName,
  lineId: result.assignedLine,
  lineName: GANTT_LINES.find(l => l.id === result.assignedLine)?.name || result.assignedLine,
  startTime: parseTime(result.startTime),
  endTime: parseTime(result.endTime),
  duration: result.duration,
  quantity: result.quantity,
  priority: result.priority,
  deadline: result.deadline,
  status: result.status,
  locked: result.status === "in-progress" || result.status === "completed",
}));

// Get timeline boundaries
const allTimes = GANTT_BLOCKS.flatMap(b => [b.startTime.getTime(), b.endTime.getTime()]);
export const TIMELINE_START = new Date(Math.min(...allTimes));
export const TIMELINE_END = new Date(Math.max(...allTimes));

// Calculate hour offset from timeline start
export function getHourOffset(date: Date): number {
  const diffMs = date.getTime() - TIMELINE_START.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

// Get blocks for a specific line
export function getBlocksForLine(lineId: string): GanttBlock[] {
  return GANTT_BLOCKS.filter(b => b.lineId === lineId).sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );
}

// Color mapping
export const BTP_COLORS: Record<string, string> = {
  "52000255": "#3b82f6", // Blue
  "53000258": "#10b981", // Green
  "52003962": "#f59e0b", // Amber
  "53000100": "#8b5cf6", // Purple
  "52002295": "#06b6d4", // Cyan
  "53000310": "#ec4899", // Pink
  "52001145": "#f97316", // Orange
  "53000405": "#14b8a6", // Teal
  "52004120": "#a855f7", // Violet
  "53000520": "#84cc16", // Lime
  "52002680": "#22d3ee", // Sky
  "53000625": "#f43f5e", // Rose
  "52005230": "#eab308", // Yellow
  "53000715": "#6366f1", // Indigo
  "52003150": "#10b981", // Emerald
};

export function getBTPColor(btpCode: string): string {
  return BTP_COLORS[btpCode] || "#6b7280";
}

export function getPriorityBorderColor(priority: "P1" | "P2" | "P3"): string {
  return getPriorityColor(priority);
}

export function getStatusBgColor(status: string): string {
  return getStatusColor(status);
}

// Format date for display
export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Calculate gap between blocks
export function getGapBetweenBlocks(block1: GanttBlock, block2: GanttBlock): number {
  const gap = (block2.startTime.getTime() - block1.endTime.getTime()) / (1000 * 60); // minutes
  return Math.max(0, gap);
}

// Check if there's a significant gap (> 15 minutes)
export function hasSignificantGap(block1: GanttBlock, block2: GanttBlock): boolean {
  return getGapBetweenBlocks(block1, block2) > 15;
}
