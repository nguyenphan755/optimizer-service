// Shared data types and constants for the MES system

export type Priority = 'P1' | 'P2' | 'P3';
export type LineStatus = 'Available' | 'Running' | 'Idle' | 'Breakdown' | 'Maintenance';
export type OperationStatus = 'completed' | 'in-progress' | 'pending' | 'scheduled';

export interface Operation {
  id: string;
  btpCode: string;
  finishedProduct: string;
  operationType: string;
  operationOrder: number;
  line: string;
  startHour: number;
  duration: number;
  setupTime: number;
  speed: number;
  length: number;
  locked: boolean;
  manualOverride: boolean;
  priority: Priority;
  status: OperationStatus;
  dueDate: string;
  dueDateHour: number;
  plannedStartHour?: number;
  plannedDuration?: number;
  actualStartHour?: number;
  actualDuration?: number;
  previousBTP?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  operationType: string;
  status: LineStatus;
  capacity: number;
  currentBTP?: string;
}

export interface Shift {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  breakStart?: number;
  breakEnd?: number;
}

export const OPERATION_COLORS: Record<string, string> = {
  Drawing: "#3b82f6",
  Annealing: "#06b6d4",
  Stranding: "#10b981",
  Armoring: "#f97316",
  Sheathing: "#a855f7",
  Testing: "#6b7280",
  Packing: "#ec4899",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#9ca3af",
};

export const LINE_STATUS_COLORS: Record<LineStatus, string> = {
  Available: "#10b981",
  Running: "#3b82f6",
  Idle: "#6b7280",
  Breakdown: "#ef4444",
  Maintenance: "#f59e0b",
};

export const SHIFTS: Shift[] = [
  { id: "shift1", name: "Shift 1", startHour: 0, endHour: 8, breakStart: 3, breakEnd: 3.5 },
  { id: "shift2", name: "Shift 2", startHour: 8, endHour: 16, breakStart: 11, breakEnd: 11.5 },
  { id: "shift3", name: "Shift 3", startHour: 16, endHour: 24, breakStart: 19, breakEnd: 19.5 },
];

export const PRODUCTION_LINES: ProductionLine[] = [
  { id: "LINE-01", name: "Drawing Line 1", operationType: "Drawing", status: "Running", capacity: 150, currentBTP: "BTP-1001" },
  { id: "LINE-02", name: "Drawing Line 2", operationType: "Drawing", status: "Available", capacity: 140 },
  { id: "LINE-03", name: "Drawing Line 3", operationType: "Drawing", status: "Running", capacity: 145, currentBTP: "BTP-1004" },
  { id: "LINE-08", name: "Annealing Line 1", operationType: "Annealing", status: "Running", capacity: 90, currentBTP: "BTP-1002" },
  { id: "LINE-12", name: "Stranding Line 1", operationType: "Stranding", status: "Running", capacity: 100, currentBTP: "BTP-1001" },
  { id: "LINE-13", name: "Stranding Line 2", operationType: "Stranding", status: "Available", capacity: 95 },
  { id: "LINE-14", name: "Stranding Line 3", operationType: "Stranding", status: "Maintenance", capacity: 110 },
  { id: "LINE-23", name: "Armoring Line 1", operationType: "Armoring", status: "Running", capacity: 60, currentBTP: "BTP-1001" },
  { id: "LINE-24", name: "Armoring Line 2", operationType: "Armoring", status: "Available", capacity: 65 },
  { id: "LINE-25", name: "Armoring Line 3", operationType: "Armoring", status: "Breakdown", capacity: 58 },
  { id: "LINE-34", name: "Sheathing Line 1", operationType: "Sheathing", status: "Idle", capacity: 80 },
  { id: "LINE-35", name: "Sheathing Line 2", operationType: "Sheathing", status: "Running", capacity: 85, currentBTP: "BTP-1002" },
  { id: "LINE-45", name: "Testing Line 1", operationType: "Testing", status: "Available", capacity: 100 },
  { id: "LINE-46", name: "Testing Line 2", operationType: "Testing", status: "Available", capacity: 98 },
  { id: "LINE-48", name: "Packing Line 1", operationType: "Packing", status: "Available", capacity: 150 },
];

export const INITIAL_OPERATIONS: Operation[] = [
  // BTP-1001 - P1 Priority (Urgent)
  { 
    id: "op1", btpCode: "BTP-1001", finishedProduct: "FP-A001", operationType: "Drawing", 
    operationOrder: 10, line: "LINE-01", startHour: 0, duration: 2.5, setupTime: 0.5, 
    speed: 120, length: 5000, locked: false, manualOverride: false, priority: "P1",
    status: "completed", dueDate: "2026-01-19 14:00", dueDateHour: 14,
    plannedStartHour: 0, plannedDuration: 2.5, actualStartHour: 0, actualDuration: 2.3
  },
  { 
    id: "op2", btpCode: "BTP-1001", finishedProduct: "FP-A001", operationType: "Stranding", 
    operationOrder: 20, line: "LINE-12", startHour: 3, duration: 3.5, setupTime: 0.3, 
    speed: 80, length: 5000, locked: false, manualOverride: false, priority: "P1",
    status: "in-progress", dueDate: "2026-01-19 14:00", dueDateHour: 14,
    plannedStartHour: 2.5, plannedDuration: 3.5, actualStartHour: 3, previousBTP: "BTP-1001"
  },
  { 
    id: "op3", btpCode: "BTP-1001", finishedProduct: "FP-A001", operationType: "Armoring", 
    operationOrder: 30, line: "LINE-23", startHour: 6.8, duration: 4, setupTime: 0.4, 
    speed: 45, length: 5000, locked: false, manualOverride: false, priority: "P1",
    status: "pending", dueDate: "2026-01-19 14:00", dueDateHour: 14,
    plannedStartHour: 6, plannedDuration: 4
  },
  { 
    id: "op4", btpCode: "BTP-1001", finishedProduct: "FP-A001", operationType: "Sheathing", 
    operationOrder: 40, line: "LINE-34", startHour: 11.2, duration: 3, setupTime: 0.3, 
    speed: 60, length: 5000, locked: false, manualOverride: false, priority: "P1",
    status: "pending", dueDate: "2026-01-19 14:00", dueDateHour: 14,
    plannedStartHour: 10.4, plannedDuration: 3
  },
  
  // BTP-1002 - P2 Priority (Normal)
  { 
    id: "op5", btpCode: "BTP-1002", finishedProduct: "FP-A001", operationType: "Drawing", 
    operationOrder: 10, line: "LINE-02", startHour: 0.5, duration: 3, setupTime: 0.5, 
    speed: 115, length: 7500, locked: false, manualOverride: false, priority: "P2",
    status: "completed", dueDate: "2026-01-19 18:00", dueDateHour: 18,
    plannedStartHour: 0.5, plannedDuration: 3, actualStartHour: 0.5, actualDuration: 3.2
  },
  { 
    id: "op6", btpCode: "BTP-1002", finishedProduct: "FP-A001", operationType: "Annealing", 
    operationOrder: 15, line: "LINE-08", startHour: 4, duration: 2, setupTime: 0.2, 
    speed: 90, length: 7500, locked: true, manualOverride: false, priority: "P2",
    status: "completed", dueDate: "2026-01-19 18:00", dueDateHour: 18,
    plannedStartHour: 3.5, plannedDuration: 2, actualStartHour: 4, actualDuration: 2
  },
  { 
    id: "op7", btpCode: "BTP-1002", finishedProduct: "FP-A001", operationType: "Stranding", 
    operationOrder: 20, line: "LINE-13", startHour: 6.5, duration: 4, setupTime: 0.3, 
    speed: 75, length: 7500, locked: false, manualOverride: false, priority: "P2",
    status: "scheduled", dueDate: "2026-01-19 18:00", dueDateHour: 18,
    plannedStartHour: 6.2, plannedDuration: 4
  },
  { 
    id: "op8", btpCode: "BTP-1002", finishedProduct: "FP-A001", operationType: "Sheathing", 
    operationOrder: 40, line: "LINE-35", startHour: 10.8, duration: 3.5, setupTime: 0.3, 
    speed: 65, length: 7500, locked: false, manualOverride: true, priority: "P2",
    status: "scheduled", dueDate: "2026-01-19 18:00", dueDateHour: 18,
    plannedStartHour: 10.5, plannedDuration: 3.5
  },
  
  // BTP-1003 - P3 Priority (Low)
  { 
    id: "op9", btpCode: "BTP-1003", finishedProduct: "FP-B002", operationType: "Drawing", 
    operationOrder: 10, line: "LINE-03", startHour: 14, duration: 2, setupTime: 0.5, 
    speed: 125, length: 3200, locked: false, manualOverride: false, priority: "P3",
    status: "scheduled", dueDate: "2026-01-20 10:00", dueDateHour: 34,
    plannedStartHour: 13, plannedDuration: 2
  },
  { 
    id: "op10", btpCode: "BTP-1003", finishedProduct: "FP-B002", operationType: "Stranding", 
    operationOrder: 20, line: "LINE-12", startHour: 16.5, duration: 2.5, setupTime: 0.3, 
    speed: 85, length: 3200, locked: false, manualOverride: false, priority: "P3",
    status: "scheduled", dueDate: "2026-01-20 10:00", dueDateHour: 34,
    plannedStartHour: 16, plannedDuration: 2.5
  },
  { 
    id: "op11", btpCode: "BTP-1003", finishedProduct: "FP-B002", operationType: "Testing", 
    operationOrder: 50, line: "LINE-45", startHour: 19.3, duration: 1.5, setupTime: 0.2, 
    speed: 100, length: 3200, locked: false, manualOverride: false, priority: "P3",
    status: "scheduled", dueDate: "2026-01-20 10:00", dueDateHour: 34,
    plannedStartHour: 19, plannedDuration: 1.5
  },
  { 
    id: "op12", btpCode: "BTP-1003", finishedProduct: "FP-B002", operationType: "Packing", 
    operationOrder: 60, line: "LINE-48", startHour: 21, duration: 1, setupTime: 0.2, 
    speed: 150, length: 3200, locked: false, manualOverride: false, priority: "P3",
    status: "scheduled", dueDate: "2026-01-20 10:00", dueDateHour: 34,
    plannedStartHour: 20.8, plannedDuration: 1
  },
  
  // BTP-1004 - P1 Priority (Urgent, Late)
  { 
    id: "op13", btpCode: "BTP-1004", finishedProduct: "FP-A001", operationType: "Drawing", 
    operationOrder: 10, line: "LINE-03", startHour: 1, duration: 3.5, setupTime: 0.5, 
    speed: 110, length: 8500, locked: false, manualOverride: false, priority: "P1",
    status: "completed", dueDate: "2026-01-19 08:00", dueDateHour: 8,
    plannedStartHour: 1, plannedDuration: 3.5, actualStartHour: 1, actualDuration: 4
  },
  { 
    id: "op14", btpCode: "BTP-1004", finishedProduct: "FP-A001", operationType: "Stranding", 
    operationOrder: 20, line: "LINE-13", startHour: 5, duration: 4.5, setupTime: 0.3, 
    speed: 78, length: 8500, locked: false, manualOverride: false, priority: "P1",
    status: "in-progress", dueDate: "2026-01-19 08:00", dueDateHour: 8,
    plannedStartHour: 4.5, plannedDuration: 4.5, actualStartHour: 5
  },
];

export function calculateLateness(operation: Operation): number {
  const finishHour = operation.startHour + operation.duration + operation.setupTime;
  return Math.max(0, finishHour - operation.dueDateHour);
}

export function isLate(operation: Operation): boolean {
  return calculateLateness(operation) > 0;
}

export function isAtRisk(operation: Operation): boolean {
  const finishHour = operation.startHour + operation.duration + operation.setupTime;
  const timeToDeadline = operation.dueDateHour - finishHour;
  return timeToDeadline > 0 && timeToDeadline < 2; // At risk if less than 2 hours buffer
}
