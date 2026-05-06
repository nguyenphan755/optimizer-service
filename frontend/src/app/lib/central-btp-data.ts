/**
 * CENTRAL BTP DATA
 * Single source of truth for all BTP data across the application
 * 
 * FLOW: SAP (10 TP) → 20 BTP raw → Aggregated to 15 unique BTP → Scheduled on 50 lines
 */

// ============================================
// 1. RAW BTP REQUIREMENTS (from SAP)
// ============================================
// 20 BTP requirements exploded from 10 TPs (có trùng lặp)

export interface RawBTPRequirement {
  sourceTP: string;
  btpCode: string;
  productName: string;
  quantity: number;
  unit: string;
  priority: "P1" | "P2" | "P3";
  deadline: string;
  status: "valid" | "pending" | "invalid";
}

export const RAW_BTP_REQUIREMENTS: RawBTPRequirement[] = [
  // From TP-001
  { sourceTP: "TP-001", btpCode: "52000255", productName: "CM 70c19x2 22", quantity: 1008, unit: "M", priority: "P1", deadline: "2024-02-10", status: "valid" },
  { sourceTP: "TP-001", btpCode: "53000258", productName: "Cm 95c19x2 63", quantity: 1024, unit: "M", priority: "P1", deadline: "2024-02-10", status: "valid" },
  { sourceTP: "TP-001", btpCode: "52003962", productName: "GD Cc 14/5 1kV", quantity: 3016, unit: "M", priority: "P1", deadline: "2024-02-10", status: "valid" },
  
  // From TP-002
  { sourceTP: "TP-002", btpCode: "52000255", productName: "CM 70c19x2 22", quantity: 800, unit: "M", priority: "P2", deadline: "2024-02-15", status: "valid" },
  { sourceTP: "TP-002", btpCode: "53000100", productName: "Cm 50c19x2", quantity: 1500, unit: "M", priority: "P2", deadline: "2024-02-15", status: "valid" },
  { sourceTP: "TP-002", btpCode: "52002295", productName: "GD Al 2x70c19", quantity: 2800, unit: "M", priority: "P2", deadline: "2024-02-15", status: "valid" },
  
  // From TP-003
  { sourceTP: "TP-003", btpCode: "53000258", productName: "Cm 95c19x2 63", quantity: 2000, unit: "M", priority: "P1", deadline: "2024-02-08", status: "valid" },
  { sourceTP: "TP-003", btpCode: "53000310", productName: "Cm 120c19x2 88", quantity: 4500, unit: "M", priority: "P1", deadline: "2024-02-08", status: "valid" },
  { sourceTP: "TP-003", btpCode: "52001145", productName: "CM 35c19x2 18", quantity: 1200, unit: "M", priority: "P1", deadline: "2024-02-08", status: "valid" },
  
  // From TP-004
  { sourceTP: "TP-004", btpCode: "52003962", productName: "GD Cc 14/5 1kV", quantity: 2100, unit: "M", priority: "P2", deadline: "2024-02-18", status: "pending" },
  { sourceTP: "TP-004", btpCode: "53000405", productName: "Cm 150c19x2 105", quantity: 3500, unit: "M", priority: "P2", deadline: "2024-02-18", status: "valid" },
  
  // From TP-005
  { sourceTP: "TP-005", btpCode: "53000100", productName: "Cm 50c19x2", quantity: 3200, unit: "M", priority: "P3", deadline: "2024-02-25", status: "valid" },
  { sourceTP: "TP-005", btpCode: "52004120", productName: "GD Cc 10/3 0.6kV", quantity: 4200, unit: "M", priority: "P3", deadline: "2024-02-25", status: "valid" },
  
  // From TP-006
  { sourceTP: "TP-006", btpCode: "52002295", productName: "GD Al 2x70c19", quantity: 3500, unit: "M", priority: "P1", deadline: "2024-02-09", status: "valid" },
  { sourceTP: "TP-006", btpCode: "53000520", productName: "Cm 185c19x2 130", quantity: 2800, unit: "M", priority: "P1", deadline: "2024-02-09", status: "valid" },
  
  // From TP-007
  { sourceTP: "TP-007", btpCode: "53000310", productName: "Cm 120c19x2 88", quantity: 4800, unit: "M", priority: "P2", deadline: "2024-02-16", status: "valid" },
  { sourceTP: "TP-007", btpCode: "52002680", productName: "GD Al 2x95c19", quantity: 5100, unit: "M", priority: "P2", deadline: "2024-02-16", status: "valid" },
  
  // From TP-008
  { sourceTP: "TP-008", btpCode: "52001145", productName: "CM 35c19x2 18", quantity: 1200, unit: "M", priority: "P2", deadline: "2024-02-20", status: "valid" },
  { sourceTP: "TP-008", btpCode: "53000625", productName: "Cm 240c19x2 168", quantity: 1900, unit: "M", priority: "P2", deadline: "2024-02-20", status: "valid" },
  
  // From TP-009
  { sourceTP: "TP-009", btpCode: "52005230", productName: "GD Cc 16/6 1kV", quantity: 3300, unit: "M", priority: "P1", deadline: "2024-02-12", status: "valid" },
  { sourceTP: "TP-009", btpCode: "53000715", productName: "Cm 300c19x2 210", quantity: 2600, unit: "M", priority: "P1", deadline: "2024-02-12", status: "valid" },
  
  // From TP-010
  { sourceTP: "TP-010", btpCode: "52003150", productName: "GD Al 2x120c19", quantity: 4500, unit: "M", priority: "P2", deadline: "2024-02-22", status: "valid" },
];

// ============================================
// 2. AGGREGATED BTP (15 unique)
// ============================================
// After aggregation: same BTP codes are combined

export interface AggregatedBTP {
  btpCode: string;
  productName: string;
  totalQuantity: number;
  unit: string;
  priority: "P1" | "P2" | "P3";
  earliestDeadline: string;
  sourceTPs: { tp: string; quantity: number; priority: string; deadline: string }[];
  status: "valid" | "pending" | "invalid";
}

export const AGGREGATED_BTP: AggregatedBTP[] = [
  {
    btpCode: "52000255",
    productName: "CM 70c19x2 22",
    totalQuantity: 1808, // 1008 + 800
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-10",
    sourceTPs: [
      { tp: "TP-001", quantity: 1008, priority: "P1", deadline: "2024-02-10" },
      { tp: "TP-002", quantity: 800, priority: "P2", deadline: "2024-02-15" },
    ],
    status: "valid",
  },
  {
    btpCode: "53000258",
    productName: "Cm 95c19x2 63",
    totalQuantity: 3024, // 1024 + 2000
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-08",
    sourceTPs: [
      { tp: "TP-001", quantity: 1024, priority: "P1", deadline: "2024-02-10" },
      { tp: "TP-003", quantity: 2000, priority: "P1", deadline: "2024-02-08" },
    ],
    status: "valid",
  },
  {
    btpCode: "52003962",
    productName: "GD Cc 14/5 1kV",
    totalQuantity: 5116, // 3016 + 2100
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-10",
    sourceTPs: [
      { tp: "TP-001", quantity: 3016, priority: "P1", deadline: "2024-02-10" },
      { tp: "TP-004", quantity: 2100, priority: "P2", deadline: "2024-02-18" },
    ],
    status: "pending", // One source is pending
  },
  {
    btpCode: "53000100",
    productName: "Cm 50c19x2",
    totalQuantity: 4700, // 1500 + 3200
    unit: "M",
    priority: "P2",
    earliestDeadline: "2024-02-15",
    sourceTPs: [
      { tp: "TP-002", quantity: 1500, priority: "P2", deadline: "2024-02-15" },
      { tp: "TP-005", quantity: 3200, priority: "P3", deadline: "2024-02-25" },
    ],
    status: "valid",
  },
  {
    btpCode: "52002295",
    productName: "GD Al 2x70c19",
    totalQuantity: 6300, // 2800 + 3500
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-09",
    sourceTPs: [
      { tp: "TP-002", quantity: 2800, priority: "P2", deadline: "2024-02-15" },
      { tp: "TP-006", quantity: 3500, priority: "P1", deadline: "2024-02-09" },
    ],
    status: "valid",
  },
  {
    btpCode: "53000310",
    productName: "Cm 120c19x2 88",
    totalQuantity: 9300, // 4500 + 4800
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-08",
    sourceTPs: [
      { tp: "TP-003", quantity: 4500, priority: "P1", deadline: "2024-02-08" },
      { tp: "TP-007", quantity: 4800, priority: "P2", deadline: "2024-02-16" },
    ],
    status: "valid",
  },
  {
    btpCode: "52001145",
    productName: "CM 35c19x2 18",
    totalQuantity: 2400, // 1200 + 1200
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-08",
    sourceTPs: [
      { tp: "TP-003", quantity: 1200, priority: "P1", deadline: "2024-02-08" },
      { tp: "TP-008", quantity: 1200, priority: "P2", deadline: "2024-02-20" },
    ],
    status: "valid",
  },
  {
    btpCode: "53000405",
    productName: "Cm 150c19x2 105",
    totalQuantity: 3500,
    unit: "M",
    priority: "P2",
    earliestDeadline: "2024-02-18",
    sourceTPs: [
      { tp: "TP-004", quantity: 3500, priority: "P2", deadline: "2024-02-18" },
    ],
    status: "valid",
  },
  {
    btpCode: "52004120",
    productName: "GD Cc 10/3 0.6kV",
    totalQuantity: 4200,
    unit: "M",
    priority: "P3",
    earliestDeadline: "2024-02-25",
    sourceTPs: [
      { tp: "TP-005", quantity: 4200, priority: "P3", deadline: "2024-02-25" },
    ],
    status: "valid",
  },
  {
    btpCode: "53000520",
    productName: "Cm 185c19x2 130",
    totalQuantity: 2800,
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-09",
    sourceTPs: [
      { tp: "TP-006", quantity: 2800, priority: "P1", deadline: "2024-02-09" },
    ],
    status: "valid",
  },
  {
    btpCode: "52002680",
    productName: "GD Al 2x95c19",
    totalQuantity: 5100,
    unit: "M",
    priority: "P2",
    earliestDeadline: "2024-02-16",
    sourceTPs: [
      { tp: "TP-007", quantity: 5100, priority: "P2", deadline: "2024-02-16" },
    ],
    status: "valid",
  },
  {
    btpCode: "53000625",
    productName: "Cm 240c19x2 168",
    totalQuantity: 1900,
    unit: "M",
    priority: "P2",
    earliestDeadline: "2024-02-20",
    sourceTPs: [
      { tp: "TP-008", quantity: 1900, priority: "P2", deadline: "2024-02-20" },
    ],
    status: "valid",
  },
  {
    btpCode: "52005230",
    productName: "GD Cc 16/6 1kV",
    totalQuantity: 3300,
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-12",
    sourceTPs: [
      { tp: "TP-009", quantity: 3300, priority: "P1", deadline: "2024-02-12" },
    ],
    status: "valid",
  },
  {
    btpCode: "53000715",
    productName: "Cm 300c19x2 210",
    totalQuantity: 2600,
    unit: "M",
    priority: "P1",
    earliestDeadline: "2024-02-12",
    sourceTPs: [
      { tp: "TP-009", quantity: 2600, priority: "P1", deadline: "2024-02-12" },
    ],
    status: "valid",
  },
  {
    btpCode: "52003150",
    productName: "GD Al 2x120c19",
    totalQuantity: 4500,
    unit: "M",
    priority: "P2",
    earliestDeadline: "2024-02-22",
    sourceTPs: [
      { tp: "TP-010", quantity: 4500, priority: "P2", deadline: "2024-02-22" },
    ],
    status: "valid",
  },
];

// ============================================
// 3. SPEED MASTER (BTP × Line)
// ============================================
// Optimal speeds for each BTP on each capable line

export interface SpeedMasterEntry {
  btpCode: string;
  btpName: string;
  line: string;
  optimalSpeed: number; // m/min
  setupTime: number; // minutes
  efficiency: number; // %
}

export const SPEED_MASTER: SpeedMasterEntry[] = [
  // 52000255: CM 70c19x2 22
  { btpCode: "52000255", btpName: "CM 70c19x2 22", line: "LINE-01", optimalSpeed: 85, setupTime: 15, efficiency: 92 },
  { btpCode: "52000255", btpName: "CM 70c19x2 22", line: "LINE-12", optimalSpeed: 80, setupTime: 20, efficiency: 88 },
  { btpCode: "52000255", btpName: "CM 70c19x2 22", line: "LINE-23", optimalSpeed: 75, setupTime: 18, efficiency: 85 },
  
  // 53000258: Cm 95c19x2 63
  { btpCode: "53000258", btpName: "Cm 95c19x2 63", line: "LINE-02", optimalSpeed: 65, setupTime: 20, efficiency: 90 },
  { btpCode: "53000258", btpName: "Cm 95c19x2 63", line: "LINE-13", optimalSpeed: 60, setupTime: 25, efficiency: 87 },
  { btpCode: "53000258", btpName: "Cm 95c19x2 63", line: "LINE-24", optimalSpeed: 58, setupTime: 22, efficiency: 84 },
  
  // 52003962: GD Cc 14/5 1kV
  { btpCode: "52003962", btpName: "GD Cc 14/5 1kV", line: "LINE-03", optimalSpeed: 95, setupTime: 12, efficiency: 94 },
  { btpCode: "52003962", btpName: "GD Cc 14/5 1kV", line: "LINE-14", optimalSpeed: 90, setupTime: 15, efficiency: 91 },
  { btpCode: "52003962", btpName: "GD Cc 14/5 1kV", line: "LINE-25", optimalSpeed: 88, setupTime: 14, efficiency: 89 },
  
  // 53000100: Cm 50c19x2
  { btpCode: "53000100", btpName: "Cm 50c19x2", line: "LINE-04", optimalSpeed: 78, setupTime: 18, efficiency: 89 },
  { btpCode: "53000100", btpName: "Cm 50c19x2", line: "LINE-15", optimalSpeed: 75, setupTime: 20, efficiency: 86 },
  
  // 52002295: GD Al 2x70c19
  { btpCode: "52002295", btpName: "GD Al 2x70c19", line: "LINE-05", optimalSpeed: 70, setupTime: 22, efficiency: 88 },
  { btpCode: "52002295", btpName: "GD Al 2x70c19", line: "LINE-16", optimalSpeed: 68, setupTime: 24, efficiency: 85 },
  
  // 53000310: Cm 120c19x2 88
  { btpCode: "53000310", btpName: "Cm 120c19x2 88", line: "LINE-06", optimalSpeed: 55, setupTime: 25, efficiency: 91 },
  { btpCode: "53000310", btpName: "Cm 120c19x2 88", line: "LINE-17", optimalSpeed: 52, setupTime: 28, efficiency: 88 },
  
  // 52001145: CM 35c19x2 18
  { btpCode: "52001145", btpName: "CM 35c19x2 18", line: "LINE-07", optimalSpeed: 92, setupTime: 10, efficiency: 93 },
  { btpCode: "52001145", btpName: "CM 35c19x2 18", line: "LINE-18", optimalSpeed: 88, setupTime: 12, efficiency: 90 },
  
  // 53000405: Cm 150c19x2 105
  { btpCode: "53000405", btpName: "Cm 150c19x2 105", line: "LINE-08", optimalSpeed: 48, setupTime: 30, efficiency: 89 },
  { btpCode: "53000405", btpName: "Cm 150c19x2 105", line: "LINE-19", optimalSpeed: 45, setupTime: 32, efficiency: 86 },
  
  // 52004120: GD Cc 10/3 0.6kV
  { btpCode: "52004120", btpName: "GD Cc 10/3 0.6kV", line: "LINE-09", optimalSpeed: 88, setupTime: 14, efficiency: 92 },
  { btpCode: "52004120", btpName: "GD Cc 10/3 0.6kV", line: "LINE-20", optimalSpeed: 85, setupTime: 16, efficiency: 89 },
  
  // 53000520: Cm 185c19x2 130
  { btpCode: "53000520", btpName: "Cm 185c19x2 130", line: "LINE-10", optimalSpeed: 42, setupTime: 35, efficiency: 88 },
  { btpCode: "53000520", btpName: "Cm 185c19x2 130", line: "LINE-21", optimalSpeed: 40, setupTime: 38, efficiency: 85 },
  
  // 52002680: GD Al 2x95c19
  { btpCode: "52002680", btpName: "GD Al 2x95c19", line: "LINE-11", optimalSpeed: 62, setupTime: 26, efficiency: 90 },
  { btpCode: "52002680", btpName: "GD Al 2x95c19", line: "LINE-22", optimalSpeed: 60, setupTime: 28, efficiency: 87 },
  
  // 53000625: Cm 240c19x2 168
  { btpCode: "53000625", btpName: "Cm 240c19x2 168", line: "LINE-12", optimalSpeed: 38, setupTime: 40, efficiency: 87 },
  { btpCode: "53000625", btpName: "Cm 240c19x2 168", line: "LINE-23", optimalSpeed: 35, setupTime: 42, efficiency: 84 },
  
  // 52005230: GD Cc 16/6 1kV
  { btpCode: "52005230", btpName: "GD Cc 16/6 1kV", line: "LINE-13", optimalSpeed: 82, setupTime: 16, efficiency: 91 },
  { btpCode: "52005230", btpName: "GD Cc 16/6 1kV", line: "LINE-24", optimalSpeed: 80, setupTime: 18, efficiency: 88 },
  
  // 53000715: Cm 300c19x2 210
  { btpCode: "53000715", btpName: "Cm 300c19x2 210", line: "LINE-14", optimalSpeed: 32, setupTime: 45, efficiency: 86 },
  { btpCode: "53000715", btpName: "Cm 300c19x2 210", line: "LINE-25", optimalSpeed: 30, setupTime: 48, efficiency: 83 },
  
  // 52003150: GD Al 2x120c19
  { btpCode: "52003150", btpName: "GD Al 2x120c19", line: "LINE-15", optimalSpeed: 58, setupTime: 28, efficiency: 89 },
  { btpCode: "52003150", btpName: "GD Al 2x120c19", line: "LINE-26", optimalSpeed: 55, setupTime: 30, efficiency: 86 },
];

// ============================================
// 4. SCHEDULED RESULTS
// ============================================
// After running scheduling algorithm

export interface ScheduledBTP {
  btpCode: string;
  btpName: string;
  quantity: number;
  assignedLine: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  priority: "P1" | "P2" | "P3";
  deadline: string;
  status: "scheduled" | "in-progress" | "completed" | "delayed";
}

export const SCHEDULED_RESULTS: ScheduledBTP[] = [
  { btpCode: "53000258", btpName: "Cm 95c19x2 63", quantity: 3024, assignedLine: "LINE-02", startTime: "2024-01-27 06:00", endTime: "2024-01-27 12:28", duration: 388, priority: "P1", deadline: "2024-02-08", status: "scheduled" },
  { btpCode: "53000310", btpName: "Cm 120c19x2 88", quantity: 9300, assignedLine: "LINE-06", startTime: "2024-01-27 06:00", endTime: "2024-01-27 18:49", duration: 769, priority: "P1", deadline: "2024-02-08", status: "scheduled" },
  { btpCode: "52001145", btpName: "CM 35c19x2 18", quantity: 2400, assignedLine: "LINE-07", startTime: "2024-01-27 06:00", endTime: "2024-01-27 12:06", duration: 366, priority: "P1", deadline: "2024-02-08", status: "in-progress" },
  { btpCode: "52002295", btpName: "GD Al 2x70c19", quantity: 6300, assignedLine: "LINE-05", startTime: "2024-01-27 06:00", endTime: "2024-01-27 17:30", duration: 690, priority: "P1", deadline: "2024-02-09", status: "scheduled" },
  { btpCode: "53000520", btpName: "Cm 185c19x2 130", quantity: 2800, assignedLine: "LINE-10", startTime: "2024-01-27 06:00", endTime: "2024-01-27 13:07", duration: 427, priority: "P1", deadline: "2024-02-09", status: "scheduled" },
  { btpCode: "52000255", btpName: "CM 70c19x2 22", quantity: 1808, assignedLine: "LINE-01", startTime: "2024-01-27 06:00", endTime: "2024-01-27 12:16", duration: 376, priority: "P1", deadline: "2024-02-10", status: "scheduled" },
  { btpCode: "52003962", btpName: "GD Cc 14/5 1kV", quantity: 5116, assignedLine: "LINE-03", startTime: "2024-01-27 06:00", endTime: "2024-01-27 13:54", duration: 474, priority: "P1", deadline: "2024-02-10", status: "scheduled" },
  { btpCode: "52005230", btpName: "GD Cc 16/6 1kV", quantity: 3300, assignedLine: "LINE-13", startTime: "2024-01-27 06:00", endTime: "2024-01-27 13:16", duration: 436, priority: "P1", deadline: "2024-02-12", status: "scheduled" },
  { btpCode: "53000715", btpName: "Cm 300c19x2 210", quantity: 2600, assignedLine: "LINE-14", startTime: "2024-01-27 06:00", endTime: "2024-01-27 19:23", duration: 803, priority: "P1", deadline: "2024-02-12", status: "scheduled" },
  { btpCode: "53000100", btpName: "Cm 50c19x2", quantity: 4700, assignedLine: "LINE-04", startTime: "2024-01-27 06:00", endTime: "2024-01-27 17:18", duration: 678, priority: "P2", deadline: "2024-02-15", status: "scheduled" },
  { btpCode: "52002680", btpName: "GD Al 2x95c19", quantity: 5100, assignedLine: "LINE-11", startTime: "2024-01-27 12:30", endTime: "2024-01-28 01:52", duration: 802, priority: "P2", deadline: "2024-02-16", status: "scheduled" },
  { btpCode: "53000405", btpName: "Cm 150c19x2 105", quantity: 3500, assignedLine: "LINE-08", startTime: "2024-01-27 14:00", endTime: "2024-01-28 03:58", duration: 838, priority: "P2", deadline: "2024-02-18", status: "scheduled" },
  { btpCode: "53000625", btpName: "Cm 240c19x2 168", quantity: 1900, assignedLine: "LINE-12", startTime: "2024-01-27 18:00", endTime: "2024-01-28 04:00", duration: 600, priority: "P2", deadline: "2024-02-20", status: "scheduled" },
  { btpCode: "52003150", btpName: "GD Al 2x120c19", quantity: 4500, assignedLine: "LINE-15", startTime: "2024-01-28 06:00", endTime: "2024-01-28 19:36", duration: 816, priority: "P2", deadline: "2024-02-22", status: "scheduled" },
  { btpCode: "52004120", btpName: "GD Cc 10/3 0.6kV", quantity: 4200, assignedLine: "LINE-09", startTime: "2024-01-28 08:00", endTime: "2024-01-28 18:48", duration: 648, priority: "P3", deadline: "2024-02-25", status: "scheduled" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getBTPByCode(btpCode: string): AggregatedBTP | undefined {
  return AGGREGATED_BTP.find(btp => btp.btpCode === btpCode);
}

export function getSpeedForBTPOnLine(btpCode: string, line: string): SpeedMasterEntry | undefined {
  return SPEED_MASTER.find(sm => sm.btpCode === btpCode && sm.line === line);
}

export function calculateDuration(quantity: number, speed: number, setupTime: number = 0): number {
  // Duration in minutes = (quantity / speed) + setupTime
  return Math.ceil(quantity / speed) + setupTime;
}

export function getPriorityColor(priority: "P1" | "P2" | "P3"): string {
  switch (priority) {
    case "P1": return "#ef4444";
    case "P2": return "#f59e0b";
    case "P3": return "#3b82f6";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "scheduled": return "#3b82f6";
    case "in-progress": return "#f59e0b";
    case "completed": return "#10b981";
    case "delayed": return "#ef4444";
    default: return "#6b7280";
  }
}
