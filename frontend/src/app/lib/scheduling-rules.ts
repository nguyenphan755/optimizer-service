// Configurable scheduling rules system

export interface SchedulingRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  locked: boolean;
  order: number;
}

export const DEFAULT_SCHEDULING_RULES: SchedulingRule[] = [
  {
    id: "machine-availability",
    name: "Machine Availability",
    description: "Exclude lines in breakdown or maintenance status",
    weight: 100,
    enabled: true,
    locked: true,
    order: 1,
  },
  {
    id: "priority-compliance",
    name: "Priority Compliance",
    description: "Higher priority (P1) orders scheduled first",
    weight: 90,
    enabled: true,
    locked: false,
    order: 2,
  },
  {
    id: "fastest-completion",
    name: "Fastest Completion Time",
    description: "Select line with highest optimal speed for operation",
    weight: 80,
    enabled: true,
    locked: false,
    order: 3,
  },
  {
    id: "earliest-available",
    name: "Earliest Available Machine",
    description: "Select line with earliest available time slot",
    weight: 70,
    enabled: true,
    locked: false,
    order: 4,
  },
  {
    id: "minimize-gap",
    name: "Minimize Gap Between Operations",
    description: "Reduce waiting time between dependent operations",
    weight: 60,
    enabled: true,
    locked: false,
    order: 5,
  },
  {
    id: "minimize-setup",
    name: "Minimize Setup/Changeover",
    description: "Prefer lines with same BTP to reduce setup time",
    weight: 50,
    enabled: true,
    locked: false,
    order: 6,
  },
  {
    id: "load-balancing",
    name: "Load Balancing",
    description: "Distribute work evenly across compatible lines",
    weight: 40,
    enabled: false,
    locked: false,
    order: 7,
  },
  {
    id: "due-date-urgency",
    name: "Due Date Urgency",
    description: "Prioritize operations close to due date",
    weight: 85,
    enabled: true,
    locked: false,
    order: 8,
  },
];

export interface MachineOption {
  lineId: string;
  lineName: string;
  status: string;
  optimalSpeed: number;
  setupTime: number;
  estimatedStart: number;
  estimatedFinish: number;
  score: number;
  isRecommended: boolean;
  isAvailable: boolean;
  scoreBreakdown: {
    ruleId: string;
    ruleName: string;
    weight: number;
    contribution: number;
    reason: string;
  }[];
}

export interface ProductionOrder {
  id: string;
  orderCode: string;
  finishedProduct: string;
  priority: 'P1' | 'P2' | 'P3';
  dueDate: string;
  status: 'Planned' | 'Running' | 'Locked' | 'Completed';
  btpCodes: string[];
  totalOperations: number;
  completedOperations: number;
}

export const PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    id: "ord-1",
    orderCode: "ORD-2026-001",
    finishedProduct: "FP-A001",
    priority: "P1",
    dueDate: "2026-01-19 14:00",
    status: "Running",
    btpCodes: ["BTP-1001", "BTP-1002"],
    totalOperations: 8,
    completedOperations: 3,
  },
  {
    id: "ord-2",
    orderCode: "ORD-2026-002",
    finishedProduct: "FP-B002",
    priority: "P3",
    dueDate: "2026-01-20 10:00",
    status: "Planned",
    btpCodes: ["BTP-1003"],
    totalOperations: 4,
    completedOperations: 0,
  },
  {
    id: "ord-3",
    orderCode: "ORD-2026-003",
    finishedProduct: "FP-A001",
    priority: "P1",
    dueDate: "2026-01-19 08:00",
    status: "Running",
    btpCodes: ["BTP-1004"],
    totalOperations: 2,
    completedOperations: 1,
  },
  {
    id: "ord-4",
    orderCode: "ORD-2026-004",
    finishedProduct: "FP-C003",
    priority: "P2",
    dueDate: "2026-01-19 18:00",
    status: "Planned",
    btpCodes: ["BTP-1005"],
    totalOperations: 2,
    completedOperations: 0,
  },
  {
    id: "ord-5",
    orderCode: "ORD-2026-005",
    finishedProduct: "FP-A001",
    priority: "P2",
    dueDate: "2026-01-19 22:00",
    status: "Planned",
    btpCodes: ["BTP-1006"],
    totalOperations: 2,
    completedOperations: 0,
  },
  {
    id: "ord-6",
    orderCode: "ORD-2026-006",
    finishedProduct: "FP-B002",
    priority: "P2",
    dueDate: "2026-01-20 08:00",
    status: "Locked",
    btpCodes: ["BTP-1007"],
    totalOperations: 2,
    completedOperations: 0,
  },
];

export function calculateMachineScore(
  operation: any,
  line: any,
  rules: SchedulingRule[]
): MachineOption {
  const enabledRules = rules.filter(r => r.enabled).sort((a, b) => a.order - b.order);
  
  let totalScore = 0;
  const scoreBreakdown: MachineOption['scoreBreakdown'] = [];

  enabledRules.forEach(rule => {
    let contribution = 0;
    let reason = "";

    switch (rule.id) {
      case "machine-availability":
        if (line.status === "Available" || line.status === "Running") {
          contribution = rule.weight;
          reason = "Line is available";
        } else {
          contribution = -rule.weight;
          reason = `Line is ${line.status}`;
        }
        break;

      case "priority-compliance":
        contribution = operation.priority === "P1" ? rule.weight : rule.weight * 0.5;
        reason = `Priority ${operation.priority}`;
        break;

      case "fastest-completion":
        const speedRatio = line.capacity / 150; // normalized
        contribution = rule.weight * speedRatio;
        reason = `Speed: ${line.capacity} m/min`;
        break;

      case "earliest-available":
        // Simulate availability
        contribution = rule.weight * 0.8;
        reason = "Available in 2h";
        break;

      case "minimize-gap":
        if (line.currentBTP === operation.btpCode) {
          contribution = rule.weight;
          reason = "Same BTP, no gap";
        } else {
          contribution = rule.weight * 0.3;
          reason = "Different BTP";
        }
        break;

      case "minimize-setup":
        if (line.currentBTP === operation.btpCode) {
          contribution = rule.weight;
          reason = "No setup needed";
        } else {
          contribution = 0;
          reason = "Setup required (0.5h)";
        }
        break;

      case "due-date-urgency":
        contribution = operation.priority === "P1" ? rule.weight : rule.weight * 0.6;
        reason = "Due date compliance";
        break;

      default:
        contribution = 0;
        reason = "Not calculated";
    }

    totalScore += contribution;
    scoreBreakdown.push({
      ruleId: rule.id,
      ruleName: rule.name,
      weight: rule.weight,
      contribution: Math.round(contribution),
      reason,
    });
  });

  const isAvailable = line.status !== "Breakdown" && line.status !== "Maintenance";
  
  return {
    lineId: line.id,
    lineName: line.name,
    status: line.status,
    optimalSpeed: line.capacity,
    setupTime: line.currentBTP === operation.btpCode ? 0 : 0.5,
    estimatedStart: operation.startHour + 2,
    estimatedFinish: operation.startHour + 2 + operation.duration,
    score: Math.round(totalScore),
    isRecommended: false, // Will be set after comparison
    isAvailable,
    scoreBreakdown,
  };
}
