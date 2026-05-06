// ============================================================================
// PRODUCTION LOT-BASED SCHEDULING DATA MODEL
// For Wire & Cable Manufacturing - Process Flow Scheduling
// 15 BTP from 10 TP (realistic production data)
// ============================================================================

export type Priority = "P1" | "P2" | "P3";
export type ProcessType = "drawing" | "stranding" | "armoring" | "sheathing";
export type LotStatus = "ready" | "running" | "completed" | "blocked" | "waiting";

// ============================================================================
// 1. AGGREGATED BTP REQUIREMENTS (Planning Level) - 15 BTP UNIQUE
// ============================================================================
export interface AggregatedBTPRequirement {
  btpCode: string;
  productName: string;
  totalQuantity: number; // Total meters needed
  unit: string;
  priority: Priority;
  earliestDeadline: string;
  totalLots: number; // How many TP lots comprise this BTP
  completedLots: number;
  status: "pending" | "in-progress" | "completed";
}

export const AGGREGATED_BTP_REQUIREMENTS: AggregatedBTPRequirement[] = [
  {
    btpCode: "BTP-001",
    productName: "Cáp điện lực 3x240+120mm² 0.6/1kV",
    totalQuantity: 1808,
    unit: "m",
    priority: "P1",
    earliestDeadline: "2025-02-05",
    totalLots: 2,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-002",
    productName: "Cáp điện lực 3x185+95mm² 0.6/1kV",
    totalQuantity: 1200,
    unit: "m",
    priority: "P1",
    earliestDeadline: "2025-02-06",
    totalLots: 1,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-003",
    productName: "Cáp điện lực 3x150+70mm² 0.6/1kV",
    totalQuantity: 2500,
    unit: "m",
    priority: "P2",
    earliestDeadline: "2025-02-08",
    totalLots: 3,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-004",
    productName: "Cáp điện lực 3x120+70mm² 0.6/1kV",
    totalQuantity: 1800,
    unit: "m",
    priority: "P1",
    earliestDeadline: "2025-02-04",
    totalLots: 2,
    completedLots: 2,
    status: "completed",
  },
  {
    btpCode: "BTP-005",
    productName: "Cáp điện lực 4x240mm² 0.6/1kV",
    totalQuantity: 2200,
    unit: "m",
    priority: "P2",
    earliestDeadline: "2025-02-10",
    totalLots: 2,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-006",
    productName: "Cáp điện lực 3x95+50mm² 0.6/1kV",
    totalQuantity: 1600,
    unit: "m",
    priority: "P1",
    earliestDeadline: "2025-02-03",
    totalLots: 2,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-007",
    productName: "Cáp điện lực 3x70+35mm² 0.6/1kV",
    totalQuantity: 1400,
    unit: "m",
    priority: "P3",
    earliestDeadline: "2025-02-12",
    totalLots: 2,
    completedLots: 1,
    status: "in-progress",
  },
  {
    btpCode: "BTP-008",
    productName: "Cáp điện lực 3x50+25mm² 0.6/1kV",
    totalQuantity: 900,
    unit: "m",
    priority: "P2",
    earliestDeadline: "2025-02-09",
    totalLots: 1,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-009",
    productName: "Cáp điện lực 4x185mm² 0.6/1kV",
    totalQuantity: 1900,
    unit: "m",
    priority: "P1",
    earliestDeadline: "2025-02-05",
    totalLots: 2,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-010",
    productName: "Cáp điện lực 3x300+150mm² 0.6/1kV",
    totalQuantity: 1500,
    unit: "m",
    priority: "P2",
    earliestDeadline: "2025-02-11",
    totalLots: 1,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-011",
    productName: "Cáp điều khiển 10x1.5mm² 300/500V",
    totalQuantity: 2800,
    unit: "m",
    priority: "P3",
    earliestDeadline: "2025-02-15",
    totalLots: 2,
    completedLots: 0,
    status: "pending",
  },
  {
    btpCode: "BTP-012",
    productName: "Cáp điện lực 3x16+10mm² 0.6/1kV",
    totalQuantity: 1100,
    unit: "m",
    priority: "P2",
    earliestDeadline: "2025-02-08",
    totalLots: 1,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-013",
    productName: "Cáp điện lực 3x25+16mm² 0.6/1kV",
    totalQuantity: 1300,
    unit: "m",
    priority: "P1",
    earliestDeadline: "2025-02-06",
    totalLots: 2,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-014",
    productName: "Cáp điện lực 4x150mm² 0.6/1kV",
    totalQuantity: 1700,
    unit: "m",
    priority: "P2",
    earliestDeadline: "2025-02-09",
    totalLots: 1,
    completedLots: 0,
    status: "in-progress",
  },
  {
    btpCode: "BTP-015",
    productName: "Cáp điều khiển 7x2.5mm² 300/500V",
    totalQuantity: 2400,
    unit: "m",
    priority: "P3",
    earliestDeadline: "2025-02-14",
    totalLots: 2,
    completedLots: 0,
    status: "pending",
  },
];

// ============================================================================
// 2. PRODUCTION LOTS (TP-BTP Combinations) - ~28 LOTS TOTAL
// ============================================================================
export interface ProductionLot {
  lotId: string;
  tpCode: string;
  btpCode: string;
  productName: string;
  quantity: number;
  unit: string;
  priority: Priority;
  dueDate: string;
  
  routing: ProcessType[];
  currentProcess: ProcessType | null;
  currentProcessIndex: number;
  
  status: LotStatus;
  completedProcesses: ProcessType[];
  
  assignedLine: string | null;
  estimatedStartTime: string | null;
  estimatedEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  
  progressPercent: number;
  isReadyForNextProcess: boolean;
  isBlocked: boolean;
  blockingReason: string | null;
}

export const PRODUCTION_LOTS: ProductionLot[] = [
  // BTP-001: 3x240+120mm² (2 lots) - Full 4 processes
  {
    lotId: "LOT-001",
    tpCode: "TP002",
    btpCode: "BTP-001",
    productName: "Cáp điện lực 3x240+120mm²",
    quantity: 800,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-05",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "stranding",
    currentProcessIndex: 1,
    status: "running",
    completedProcesses: ["drawing"],
    assignedLine: "STR-LINE-02",
    estimatedStartTime: "2025-01-26T08:00",
    estimatedEndTime: "2025-01-26T10:30",
    actualStartTime: "2025-01-26T08:15",
    actualEndTime: null,
    progressPercent: 35,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-002",
    tpCode: "TP001",
    btpCode: "BTP-001",
    productName: "Cáp điện lực 3x240+120mm²",
    quantity: 1008,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-05",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "drawing",
    currentProcessIndex: 0,
    status: "running",
    completedProcesses: [],
    assignedLine: "DRW-LINE-01",
    estimatedStartTime: "2025-01-26T06:00",
    estimatedEndTime: "2025-01-26T09:00",
    actualStartTime: "2025-01-26T06:10",
    actualEndTime: null,
    progressPercent: 65,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-002: 3x185+95mm² (1 lot) - 3 processes (no armoring)
  {
    lotId: "LOT-003",
    tpCode: "TP003",
    btpCode: "BTP-002",
    productName: "Cáp điện lực 3x185+95mm²",
    quantity: 1200,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-06",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-003: 3x150+70mm² (3 lots) - Full 4 processes
  {
    lotId: "LOT-004",
    tpCode: "TP005",
    btpCode: "BTP-003",
    productName: "Cáp điện lực 3x150+70mm²",
    quantity: 800,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-08",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "sheathing",
    currentProcessIndex: 3,
    status: "running",
    completedProcesses: ["drawing", "stranding", "armoring"],
    assignedLine: "SHT-LINE-01",
    estimatedStartTime: "2025-01-26T10:00",
    estimatedEndTime: "2025-01-26T12:00",
    actualStartTime: "2025-01-26T10:05",
    actualEndTime: null,
    progressPercent: 85,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-005",
    tpCode: "TP006",
    btpCode: "BTP-003",
    productName: "Cáp điện lực 3x150+70mm²",
    quantity: 850,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-08",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "armoring",
    currentProcessIndex: 2,
    status: "running",
    completedProcesses: ["drawing", "stranding"],
    assignedLine: "ARM-LINE-01",
    estimatedStartTime: "2025-01-26T09:00",
    estimatedEndTime: "2025-01-26T11:30",
    actualStartTime: "2025-01-26T09:10",
    actualEndTime: null,
    progressPercent: 45,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-006",
    tpCode: "TP007",
    btpCode: "BTP-003",
    productName: "Cáp điện lực 3x150+70mm²",
    quantity: 850,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-08",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 1,
    status: "ready",
    completedProcesses: ["drawing"],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 25,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-005: 4x240mm² (2 lots) - 3 processes
  {
    lotId: "LOT-007",
    tpCode: "TP008",
    btpCode: "BTP-005",
    productName: "Cáp điện lực 4x240mm²",
    quantity: 1100,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-10",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: "stranding",
    currentProcessIndex: 1,
    status: "running",
    completedProcesses: ["drawing"],
    assignedLine: "STR-LINE-01",
    estimatedStartTime: "2025-01-26T07:00",
    estimatedEndTime: "2025-01-26T09:30",
    actualStartTime: "2025-01-26T07:20",
    actualEndTime: null,
    progressPercent: 55,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-008",
    tpCode: "TP009",
    btpCode: "BTP-005",
    productName: "Cáp điện lực 4x240mm²",
    quantity: 1100,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-10",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "waiting",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: false,
    isBlocked: true,
    blockingReason: "Waiting for raw material",
  },

  // BTP-006: 3x95+50mm² (2 lots) - Full 4 processes
  {
    lotId: "LOT-009",
    tpCode: "TP010",
    btpCode: "BTP-006",
    productName: "Cáp điện lực 3x95+50mm²",
    quantity: 800,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-03",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 2,
    status: "ready",
    completedProcesses: ["drawing", "stranding"],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 50,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-010",
    tpCode: "TP011",
    btpCode: "BTP-006",
    productName: "Cáp điện lực 3x95+50mm²",
    quantity: 800,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-03",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "drawing",
    currentProcessIndex: 0,
    status: "running",
    completedProcesses: [],
    assignedLine: "DRW-LINE-03",
    estimatedStartTime: "2025-01-26T08:00",
    estimatedEndTime: "2025-01-26T10:00",
    actualStartTime: "2025-01-26T08:05",
    actualEndTime: null,
    progressPercent: 40,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-007: 3x70+35mm² (2 lots) - 3 processes
  {
    lotId: "LOT-011",
    tpCode: "TP012",
    btpCode: "BTP-007",
    productName: "Cáp điện lực 3x70+35mm²",
    quantity: 700,
    unit: "m",
    priority: "P3",
    dueDate: "2025-02-12",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 3,
    status: "completed",
    completedProcesses: ["drawing", "stranding", "sheathing"],
    assignedLine: null,
    estimatedStartTime: "2025-01-25T08:00",
    estimatedEndTime: "2025-01-25T12:00",
    actualStartTime: "2025-01-25T08:10",
    actualEndTime: "2025-01-25T11:50",
    progressPercent: 100,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-012",
    tpCode: "TP013",
    btpCode: "BTP-007",
    productName: "Cáp điện lực 3x70+35mm²",
    quantity: 700,
    unit: "m",
    priority: "P3",
    dueDate: "2025-02-12",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-008: 3x50+25mm² (1 lot) - 2 processes only (drawing -> sheathing)
  {
    lotId: "LOT-013",
    tpCode: "TP014",
    btpCode: "BTP-008",
    productName: "Cáp điện lực 3x50+25mm²",
    quantity: 900,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-09",
    routing: ["drawing", "sheathing"],
    currentProcess: "sheathing",
    currentProcessIndex: 1,
    status: "running",
    completedProcesses: ["drawing"],
    assignedLine: "SHT-LINE-02",
    estimatedStartTime: "2025-01-26T09:00",
    estimatedEndTime: "2025-01-26T11:00",
    actualStartTime: "2025-01-26T09:15",
    actualEndTime: null,
    progressPercent: 60,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-009: 4x185mm² (2 lots) - Full 4 processes
  {
    lotId: "LOT-014",
    tpCode: "TP015",
    btpCode: "BTP-009",
    productName: "Cáp điện lực 4x185mm²",
    quantity: 950,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-05",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "armoring",
    currentProcessIndex: 2,
    status: "running",
    completedProcesses: ["drawing", "stranding"],
    assignedLine: "ARM-LINE-02",
    estimatedStartTime: "2025-01-26T08:30",
    estimatedEndTime: "2025-01-26T11:00",
    actualStartTime: "2025-01-26T08:40",
    actualEndTime: null,
    progressPercent: 50,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-015",
    tpCode: "TP016",
    btpCode: "BTP-009",
    productName: "Cáp điện lực 4x185mm²",
    quantity: 950,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-05",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 1,
    status: "ready",
    completedProcesses: ["drawing"],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 25,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-010: 3x300+150mm² (1 lot) - Full 4 processes
  {
    lotId: "LOT-016",
    tpCode: "TP017",
    btpCode: "BTP-010",
    productName: "Cáp điện lực 3x300+150mm²",
    quantity: 1500,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-11",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "drawing",
    currentProcessIndex: 0,
    status: "running",
    completedProcesses: [],
    assignedLine: "DRW-LINE-02",
    estimatedStartTime: "2025-01-26T07:00",
    estimatedEndTime: "2025-01-26T10:00",
    actualStartTime: "2025-01-26T07:10",
    actualEndTime: null,
    progressPercent: 70,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-011: Control cable (2 lots) - 2 processes (drawing -> sheathing)
  {
    lotId: "LOT-017",
    tpCode: "TP018",
    btpCode: "BTP-011",
    productName: "Cáp điều khiển 10x1.5mm²",
    quantity: 1400,
    unit: "m",
    priority: "P3",
    dueDate: "2025-02-15",
    routing: ["drawing", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-018",
    tpCode: "TP019",
    btpCode: "BTP-011",
    productName: "Cáp điều khiển 10x1.5mm²",
    quantity: 1400,
    unit: "m",
    priority: "P3",
    dueDate: "2025-02-15",
    routing: ["drawing", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "waiting",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: false,
    isBlocked: true,
    blockingReason: "Low priority, queued",
  },

  // BTP-012: 3x16+10mm² (1 lot) - 3 processes
  {
    lotId: "LOT-019",
    tpCode: "TP020",
    btpCode: "BTP-012",
    productName: "Cáp điện lực 3x16+10mm²",
    quantity: 1100,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-08",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-013: 3x25+16mm² (2 lots) - Full 4 processes
  {
    lotId: "LOT-020",
    tpCode: "TP021",
    btpCode: "BTP-013",
    productName: "Cáp điện lực 3x25+16mm²",
    quantity: 650,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-06",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: "stranding",
    currentProcessIndex: 1,
    status: "running",
    completedProcesses: ["drawing"],
    assignedLine: "STR-LINE-03",
    estimatedStartTime: "2025-01-26T08:00",
    estimatedEndTime: "2025-01-26T09:30",
    actualStartTime: "2025-01-26T08:10",
    actualEndTime: null,
    progressPercent: 45,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-021",
    tpCode: "TP022",
    btpCode: "BTP-013",
    productName: "Cáp điện lực 3x25+16mm²",
    quantity: 650,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-06",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-014: 4x150mm² (1 lot) - 3 processes
  {
    lotId: "LOT-022",
    tpCode: "TP023",
    btpCode: "BTP-014",
    productName: "Cáp điện lực 4x150mm²",
    quantity: 1700,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-09",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 1,
    status: "ready",
    completedProcesses: ["drawing"],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 33,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },

  // BTP-015: Control cable (2 lots) - 2 processes
  {
    lotId: "LOT-023",
    tpCode: "TP024",
    btpCode: "BTP-015",
    productName: "Cáp điều khiển 7x2.5mm²",
    quantity: 1200,
    unit: "m",
    priority: "P3",
    dueDate: "2025-02-14",
    routing: ["drawing", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "waiting",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: false,
    isBlocked: true,
    blockingReason: "Pending material inspection",
  },
  {
    lotId: "LOT-024",
    tpCode: "TP025",
    btpCode: "BTP-015",
    productName: "Cáp điều khiển 7x2.5mm²",
    quantity: 1200,
    unit: "m",
    priority: "P3",
    dueDate: "2025-02-14",
    routing: ["drawing", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "waiting",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: false,
    isBlocked: true,
    blockingReason: "Pending material inspection",
  },

  // Additional lots for diversity
  {
    lotId: "LOT-025",
    tpCode: "TP026",
    btpCode: "BTP-002",
    productName: "Cáp điện lực 3x185+95mm²",
    quantity: 600,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-06",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: "drawing",
    currentProcessIndex: 0,
    status: "running",
    completedProcesses: [],
    assignedLine: "DRW-LINE-04",
    estimatedStartTime: "2025-01-26T09:00",
    estimatedEndTime: "2025-01-26T11:00",
    actualStartTime: "2025-01-26T09:05",
    actualEndTime: null,
    progressPercent: 30,
    isReadyForNextProcess: false,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-026",
    tpCode: "TP027",
    btpCode: "BTP-009",
    productName: "Cáp điện lực 4x185mm²",
    quantity: 500,
    unit: "m",
    priority: "P1",
    dueDate: "2025-02-05",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-027",
    tpCode: "TP028",
    btpCode: "BTP-005",
    productName: "Cáp điện lực 4x240mm²",
    quantity: 800,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-10",
    routing: ["drawing", "stranding", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 2,
    status: "ready",
    completedProcesses: ["drawing", "stranding"],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 67,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },
  {
    lotId: "LOT-028",
    tpCode: "TP029",
    btpCode: "BTP-010",
    productName: "Cáp điện lực 3x300+150mm²",
    quantity: 750,
    unit: "m",
    priority: "P2",
    dueDate: "2025-02-11",
    routing: ["drawing", "stranding", "armoring", "sheathing"],
    currentProcess: null,
    currentProcessIndex: 0,
    status: "ready",
    completedProcesses: [],
    assignedLine: null,
    estimatedStartTime: null,
    estimatedEndTime: null,
    actualStartTime: null,
    actualEndTime: null,
    progressPercent: 0,
    isReadyForNextProcess: true,
    isBlocked: false,
    blockingReason: null,
  },
];

// ============================================================================
// 3. PROCESS STATIONS & LINES (10+ production lines)
// ============================================================================
export interface ProcessStation {
  stationId: string;
  processType: ProcessType;
  stationName: string;
  lines: ProductionLine[];
  currentLoad: number;
  capacity: number;
}

export interface ProductionLine {
  lineId: string;
  lineName: string;
  processType: ProcessType;
  status: "available" | "running" | "maintenance" | "breakdown";
  currentLot: string | null;
  speedMPerMin: number;
  setupTimeMin: number;
}

export const PROCESS_STATIONS: ProcessStation[] = [
  {
    stationId: "DRAWING-STATION",
    processType: "drawing",
    stationName: "Drawing Station",
    lines: [
      {
        lineId: "DRW-LINE-01",
        lineName: "Drawing Line 1",
        processType: "drawing",
        status: "running",
        currentLot: "LOT-002",
        speedMPerMin: 12,
        setupTimeMin: 15,
      },
      {
        lineId: "DRW-LINE-02",
        lineName: "Drawing Line 2",
        processType: "drawing",
        status: "running",
        currentLot: "LOT-016",
        speedMPerMin: 10,
        setupTimeMin: 15,
      },
      {
        lineId: "DRW-LINE-03",
        lineName: "Drawing Line 3",
        processType: "drawing",
        status: "running",
        currentLot: "LOT-010",
        speedMPerMin: 11,
        setupTimeMin: 15,
      },
      {
        lineId: "DRW-LINE-04",
        lineName: "Drawing Line 4",
        processType: "drawing",
        status: "running",
        currentLot: "LOT-025",
        speedMPerMin: 11.5,
        setupTimeMin: 15,
      },
    ],
    currentLoad: 4,
    capacity: 4,
  },
  {
    stationId: "STRANDING-STATION",
    processType: "stranding",
    stationName: "Stranding Station",
    lines: [
      {
        lineId: "STR-LINE-01",
        lineName: "Stranding Line 1",
        processType: "stranding",
        status: "running",
        currentLot: "LOT-007",
        speedMPerMin: 8,
        setupTimeMin: 20,
      },
      {
        lineId: "STR-LINE-02",
        lineName: "Stranding Line 2",
        processType: "stranding",
        status: "running",
        currentLot: "LOT-001",
        speedMPerMin: 9,
        setupTimeMin: 20,
      },
      {
        lineId: "STR-LINE-03",
        lineName: "Stranding Line 3",
        processType: "stranding",
        status: "running",
        currentLot: "LOT-020",
        speedMPerMin: 8.5,
        setupTimeMin: 20,
      },
    ],
    currentLoad: 3,
    capacity: 3,
  },
  {
    stationId: "ARMORING-STATION",
    processType: "armoring",
    stationName: "Armoring Station",
    lines: [
      {
        lineId: "ARM-LINE-01",
        lineName: "Armoring Line 1",
        processType: "armoring",
        status: "running",
        currentLot: "LOT-005",
        speedMPerMin: 6,
        setupTimeMin: 25,
      },
      {
        lineId: "ARM-LINE-02",
        lineName: "Armoring Line 2",
        processType: "armoring",
        status: "running",
        currentLot: "LOT-014",
        speedMPerMin: 5.5,
        setupTimeMin: 25,
      },
    ],
    currentLoad: 2,
    capacity: 2,
  },
  {
    stationId: "SHEATHING-STATION",
    processType: "sheathing",
    stationName: "Sheathing Station",
    lines: [
      {
        lineId: "SHT-LINE-01",
        lineName: "Sheathing Line 1",
        processType: "sheathing",
        status: "running",
        currentLot: "LOT-004",
        speedMPerMin: 7,
        setupTimeMin: 15,
      },
      {
        lineId: "SHT-LINE-02",
        lineName: "Sheathing Line 2",
        processType: "sheathing",
        status: "running",
        currentLot: "LOT-013",
        speedMPerMin: 8,
        setupTimeMin: 15,
      },
      {
        lineId: "SHT-LINE-03",
        lineName: "Sheathing Line 3",
        processType: "sheathing",
        status: "maintenance",
        currentLot: null,
        speedMPerMin: 7,
        setupTimeMin: 15,
      },
      {
        lineId: "SHT-LINE-04",
        lineName: "Sheathing Line 4",
        processType: "sheathing",
        status: "available",
        currentLot: null,
        speedMPerMin: 7.5,
        setupTimeMin: 15,
      },
    ],
    currentLoad: 2,
    capacity: 4,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getProcessDisplayName(process: ProcessType): string {
  const names: Record<ProcessType, string> = {
    drawing: "Kéo",
    stranding: "Xoắn",
    armoring: "Giáp",
    sheathing: "Bọc",
  };
  return names[process];
}

export function getProcessIcon(process: ProcessType): string {
  const icons: Record<ProcessType, string> = {
    drawing: "🔽",
    stranding: "🌀",
    armoring: "🛡️",
    sheathing: "📦",
  };
  return icons[process];
}

export function getProcessColor(process: ProcessType): string {
  const colors: Record<ProcessType, string> = {
    drawing: "#3b82f6",
    stranding: "#10b981",
    armoring: "#f59e0b",
    sheathing: "#8b5cf6",
  };
  return colors[process];
}

export function getStatusColor(status: LotStatus): string {
  const colors: Record<LotStatus, string> = {
    ready: "#10b981",
    running: "#3b82f6",
    completed: "#6b7280",
    blocked: "#ef4444",
    waiting: "#f59e0b",
  };
  return colors[status];
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    P1: "#ef4444",
    P2: "#f59e0b",
    P3: "#3b82f6",
  };
  return colors[priority];
}

export function getNextProcess(lot: ProductionLot): ProcessType | null {
  const nextIndex = lot.currentProcessIndex + 1;
  if (nextIndex < lot.routing.length) {
    return lot.routing[nextIndex];
  }
  return null;
}

export function calculateEstimatedDuration(
  quantity: number,
  speedMPerMin: number,
  setupTimeMin: number
): number {
  return Math.ceil(quantity / speedMPerMin + setupTimeMin);
}

export function getLotsByProcess(process: ProcessType): ProductionLot[] {
  return PRODUCTION_LOTS.filter(
    (lot) => lot.currentProcess === process && lot.status === "running"
  );
}

export function getReadyLotsForProcess(process: ProcessType): ProductionLot[] {
  return PRODUCTION_LOTS.filter((lot) => {
    const nextProcess = getNextProcess(lot);
    return nextProcess === process && lot.isReadyForNextProcess;
  });
}

export function getAvailableLinesForProcess(process: ProcessType): ProductionLine[] {
  const station = PROCESS_STATIONS.find((s) => s.processType === process);
  if (!station) return [];
  return station.lines.filter((line) => line.status === "available");
}
