// Mock data for 6 Analytics Dashboards

// ============================================
// A. MACHINE PERFORMANCE ANALYTICS
// ============================================

export const machinePerformanceData = {
  // OEE (Overall Equipment Effectiveness) by machine
  oeeData: [
    { machine: "DR-DN-01", availability: 92, performance: 85, quality: 98, oee: 76, plant: "Cadivi Đà Nẵng", process: "Kéo" },
    { machine: "TW-LT-05", availability: 88, performance: 82, quality: 96, oee: 69, plant: "Cadivi Long Thành", process: "Xoắn" },
    { machine: "SH-TA-08", availability: 90, performance: 88, quality: 97, oee: 77, plant: "Cadivi Tân Á", process: "Bọc" },
    { machine: "AR-BN-02", availability: 95, performance: 90, quality: 99, oee: 85, plant: "Cadivi Bắc Ninh", process: "Giáp" },
    { machine: "DR-LT-03", availability: 85, performance: 78, quality: 95, oee: 63, plant: "Cadivi Long Thành", process: "Kéo" },
    { machine: "TW-DN-08", availability: 87, performance: 80, quality: 97, oee: 67, plant: "Cadivi Đà Nẵng", process: "Xoắn" },
    { machine: "SH-BN-05", availability: 91, performance: 86, quality: 98, oee: 77, plant: "Cadivi Bắc Ninh", process: "Bọc" },
    { machine: "AR-TA-01", availability: 93, performance: 88, quality: 99, oee: 81, plant: "Cadivi Tân Á", process: "Giáp" },
  ],

  // Utilization timeline (last 30 days)
  utilizationTimeline: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-03-${String(i + 6).padStart(2, "0")}`,
    "Cadivi Đà Nẵng": 72 + Math.random() * 15,
    "Cadivi Long Thành": 68 + Math.random() * 18,
    "Cadivi Tân Á": 65 + Math.random() * 20,
    "Cadivi Bắc Ninh": 75 + Math.random() * 12,
  })),

  // Downtime analysis
  downtimeData: [
    { reason: "Setup/Changeover", hours: 145, percent: 35, impact: "high" },
    { reason: "Planned Maintenance", hours: 98, percent: 24, impact: "medium" },
    { reason: "Material Shortage", hours: 76, percent: 18, impact: "high" },
    { reason: "Unplanned Breakdown", hours: 52, percent: 13, impact: "critical" },
    { reason: "Quality Issues", hours: 42, percent: 10, impact: "medium" },
  ],

  // Top/Bottom performers
  topPerformers: [
    { machine: "AR-BN-02", oee: 85, plant: "Cadivi Bắc Ninh", utilization: 88 },
    { machine: "AR-TA-01", oee: 81, plant: "Cadivi Tân Á", utilization: 85 },
    { machine: "SH-BN-05", oee: 77, plant: "Cadivi Bắc Ninh", utilization: 82 },
    { machine: "SH-TA-08", oee: 77, plant: "Cadivi Tân Á", utilization: 81 },
    { machine: "DR-DN-01", oee: 76, plant: "Cadivi Đà Nẵng", utilization: 80 },
  ],

  bottomPerformers: [
    { machine: "DR-LT-03", oee: 63, plant: "Cadivi Long Thành", utilization: 65 },
    { machine: "TW-DN-08", oee: 67, plant: "Cadivi Đà Nẵng", utilization: 68 },
    { machine: "TW-LT-05", oee: 69, plant: "Cadivi Long Thành", utilization: 70 },
    { machine: "DR-TA-07", oee: 71, plant: "Cadivi Tân Á", utilization: 72 },
    { machine: "SH-DN-09", oee: 73, plant: "Cadivi Đà Nẵng", utilization: 74 },
  ],
};

// ============================================
// B. MULTI-PLANT COMPARISON
// ============================================

export const plantComparisonData = {
  // Side-by-side KPIs
  plantKPIs: [
    {
      plant: "Cadivi Đà Nẵng",
      coverage: 84,
      avgSpeed: 185,
      efficiency: 78,
      quality: 96.5,
      utilization: 76,
      outputPerShift: 15.2,
    },
    {
      plant: "Cadivi Long Thành",
      coverage: 79,
      avgSpeed: 178,
      efficiency: 72,
      quality: 95.8,
      utilization: 72,
      outputPerShift: 14.1,
    },
    {
      plant: "Cadivi Tân Á",
      coverage: 72,
      avgSpeed: 168,
      efficiency: 75,
      quality: 97.2,
      utilization: 69,
      outputPerShift: 13.8,
    },
    {
      plant: "Cadivi Bắc Ninh",
      coverage: 88,
      avgSpeed: 192,
      efficiency: 82,
      quality: 98.1,
      utilization: 81,
      outputPerShift: 16.5,
    },
  ],

  // Rankings by metric
  rankings: {
    coverage: [
      { rank: 1, plant: "Cadivi Bắc Ninh", value: 88, change: "+3%" },
      { rank: 2, plant: "Cadivi Đà Nẵng", value: 84, change: "+1%" },
      { rank: 3, plant: "Cadivi Long Thành", value: 79, change: "-2%" },
      { rank: 4, plant: "Cadivi Tân Á", value: 72, change: "+5%" },
    ],
    efficiency: [
      { rank: 1, plant: "Cadivi Bắc Ninh", value: 82, change: "+2%" },
      { rank: 2, plant: "Cadivi Đà Nẵng", value: 78, change: "0%" },
      { rank: 3, plant: "Cadivi Tân Á", value: 75, change: "+4%" },
      { rank: 4, plant: "Cadivi Long Thành", value: 72, change: "-1%" },
    ],
    quality: [
      { rank: 1, plant: "Cadivi Bắc Ninh", value: 98.1, change: "+0.2%" },
      { rank: 2, plant: "Cadivi Tân Á", value: 97.2, change: "+0.5%" },
      { rank: 3, plant: "Cadivi Đà Nẵng", value: 96.5, change: "+0.1%" },
      { rank: 4, plant: "Cadivi Long Thành", value: 95.8, change: "-0.3%" },
    ],
  },

  // Gap analysis
  gapAnalysis: {
    bestPlant: "Cadivi Bắc Ninh",
    worstPlant: "Cadivi Long Thành",
    gaps: [
      { metric: "Coverage", gap: 9, potential: "121 materials" },
      { metric: "Efficiency", gap: 10, potential: "1.8 km/shift increase" },
      { metric: "Utilization", gap: 9, potential: "8% more capacity" },
    ],
  },

  // Cost comparison (VND per km)
  costComparison: [
    { plant: "Cadivi Bắc Ninh", costPerKm: 42500, costPerKg: 185000 },
    { plant: "Cadivi Đà Nẵng", costPerKm: 45200, costPerKg: 195000 },
    { plant: "Cadivi Tân Á", costPerKm: 47800, costPerKg: 205000 },
    { plant: "Cadivi Long Thành", costPerKm: 49100, costPerKg: 212000 },
  ],
};

// ============================================
// C. MATERIAL ANALYTICS
// ============================================

export const materialAnalyticsData = {
  // Bubble chart: Complexity vs Speed
  complexitySpeedData: [
    { material: "53000234", complexity: 7.2, actualSpeed: 178, volume: 850, process: "Xoắn" },
    { material: "56001234", complexity: 5.8, actualSpeed: 165, volume: 920, process: "Bọc" },
    { material: "52000567", complexity: 3.2, actualSpeed: 620, volume: 1450, process: "Kéo" },
    { material: "55000345", complexity: 9.5, actualSpeed: 7.2, volume: 280, process: "Giáp" },
    { material: "53000789", complexity: 6.5, actualSpeed: 160, volume: 680, process: "Xoắn" },
    { material: "56001567", complexity: 6.1, actualSpeed: 158, volume: 750, process: "Bọc" },
    { material: "52000890", complexity: 3.8, actualSpeed: 595, volume: 1320, process: "Kéo" },
    { material: "53001234", complexity: 7.8, actualSpeed: 170, volume: 820, process: "Xoắn" },
    { material: "56001890", complexity: 5.5, actualSpeed: 155, volume: 880, process: "Bọc" },
    { material: "52001123", complexity: 4.2, actualSpeed: 580, volume: 1280, process: "Kéo" },
  ],

  // Variance analysis (top deviations)
  varianceAnalysis: [
    { material: "52000567", design: 780, actual: 620, variance: -160, variancePercent: -20.5, impact: "high" },
    { material: "53000234", design: 245, actual: 178, variance: -67, variancePercent: -27.3, impact: "critical" },
    { material: "56001234", design: 180, actual: 165, variance: -15, variancePercent: -8.3, impact: "medium" },
    { material: "52000890", design: 760, actual: 595, variance: -165, variancePercent: -21.7, impact: "high" },
    { material: "53000789", design: 240, actual: 160, variance: -80, variancePercent: -33.3, impact: "critical" },
  ],

  // Portfolio matrix (2x2)
  portfolioMatrix: [
    { material: "52000567", volume: "high", efficiency: "high", quadrant: "star" },
    { material: "53000234", volume: "high", efficiency: "low", quadrant: "problem" },
    { material: "56001234", volume: "medium", efficiency: "high", quadrant: "growth" },
    { material: "55000345", volume: "low", efficiency: "high", quadrant: "niche" },
    { material: "53000789", volume: "medium", efficiency: "low", quadrant: "review" },
  ],

  // Multi-machine consistency
  multiMachineConsistency: [
    {
      material: "53000234",
      machines: 5,
      avgSpeed: 172,
      stdDev: 12.5,
      minSpeed: 158,
      maxSpeed: 185,
      consistency: "low",
    },
    {
      material: "56001234",
      machines: 4,
      avgSpeed: 165,
      stdDev: 4.2,
      minSpeed: 161,
      maxSpeed: 168,
      consistency: "high",
    },
    {
      material: "52000567",
      machines: 6,
      avgSpeed: 615,
      stdDev: 18.8,
      minSpeed: 590,
      maxSpeed: 638,
      consistency: "medium",
    },
  ],

  // Problematic materials
  problematicMaterials: [
    { material: "53000789", issue: "High variance across machines", severity: "critical", affectedPlants: 3 },
    { material: "52000890", issue: "Consistently below design speed", severity: "high", affectedPlants: 2 },
    { material: "56002123", issue: "Frequent quality issues", severity: "high", affectedPlants: 2 },
    { material: "55000901", issue: "Missing data in 2/4 plants", severity: "medium", affectedPlants: 2 },
  ],
};

// ============================================
// D. TRENDS & FORECASTING
// ============================================

export const trendsData = {
  // Historical trends (12 months)
  historicalTrends: [
    { month: "2025-04", coverage: 68, avgSpeed: 165, utilization: 62, output: 12.5 },
    { month: "2025-05", coverage: 70, avgSpeed: 168, utilization: 64, output: 12.8 },
    { month: "2025-06", coverage: 71, avgSpeed: 170, utilization: 66, output: 13.1 },
    { month: "2025-07", coverage: 73, avgSpeed: 172, utilization: 68, output: 13.4 },
    { month: "2025-08", coverage: 75, avgSpeed: 175, utilization: 70, output: 13.8 },
    { month: "2025-09", coverage: 76, avgSpeed: 177, utilization: 71, output: 14.0 },
    { month: "2025-10", coverage: 78, avgSpeed: 180, utilization: 73, output: 14.5 },
    { month: "2025-11", coverage: 79, avgSpeed: 182, utilization: 74, output: 14.8 },
    { month: "2025-12", coverage: 80, avgSpeed: 184, utilization: 75, output: 15.0 },
    { month: "2026-01", coverage: 81, avgSpeed: 186, utilization: 76, output: 15.2 },
    { month: "2026-02", coverage: 82, avgSpeed: 188, utilization: 77, output: 15.5 },
    { month: "2026-03", coverage: 84, avgSpeed: 190, utilization: 78, output: 15.8 },
  ],

  // Forecast (next 6 months)
  forecast: [
    { month: "2026-04", coverageForecast: 85, utilizationForecast: 79, outputForecast: 16.0, confidence: "high" },
    { month: "2026-05", coverageForecast: 86, utilizationForecast: 80, outputForecast: 16.2, confidence: "high" },
    { month: "2026-06", coverageForecast: 88, utilizationForecast: 81, outputForecast: 16.5, confidence: "medium" },
    { month: "2026-07", coverageForecast: 89, utilizationForecast: 82, outputForecast: 16.8, confidence: "medium" },
    { month: "2026-08", coverageForecast: 90, utilizationForecast: 83, outputForecast: 17.0, confidence: "low" },
    { month: "2026-09", coverageForecast: 91, utilizationForecast: 84, outputForecast: 17.2, confidence: "low" },
  ],

  // YoY comparison
  yoyComparison: [
    { metric: "Coverage", current: 84, lastYear: 68, growth: "+16%", status: "excellent" },
    { metric: "Avg Speed", current: 190, lastYear: 165, growth: "+15.2%", status: "excellent" },
    { metric: "Utilization", current: 78, lastYear: 62, growth: "+16%", status: "excellent" },
    { metric: "Output/Shift", current: 15.8, lastYear: 12.5, growth: "+26.4%", status: "excellent" },
  ],

  // Seasonal patterns
  seasonalPatterns: [
    { month: "Jan", avgUtilization: 72, pattern: "low" },
    { month: "Feb", avgUtilization: 76, pattern: "medium" },
    { month: "Mar", avgUtilization: 82, pattern: "high" },
    { month: "Apr", avgUtilization: 85, pattern: "peak" },
    { month: "May", avgUtilization: 83, pattern: "high" },
    { month: "Jun", avgUtilization: 78, pattern: "medium" },
    { month: "Jul", avgUtilization: 74, pattern: "low" },
    { month: "Aug", avgUtilization: 76, pattern: "medium" },
    { month: "Sep", avgUtilization: 81, pattern: "high" },
    { month: "Oct", avgUtilization: 84, pattern: "peak" },
    { month: "Nov", avgUtilization: 80, pattern: "high" },
    { month: "Dec", avgUtilization: 75, pattern: "medium" },
  ],
};

// ============================================
// E. OPTIMIZATION CENTER
// ============================================

export const optimizationData = {
  // Material-to-machine matching scores
  matchingScores: [
    { material: "53000234", currentMachine: "TW-DN-08", score: 72, recommendedMachine: "TW-BN-04", potentialGain: "+15%" },
    { material: "52000890", currentMachine: "DR-LT-03", score: 68, recommendedMachine: "DR-BN-05", potentialGain: "+12%" },
    { material: "56001567", currentMachine: "SH-TA-05", score: 85, recommendedMachine: "SH-TA-05", potentialGain: "0%" },
    { material: "53000789", currentMachine: "TW-DN-10", score: 65, recommendedMachine: "TW-LT-12", potentialGain: "+18%" },
  ],

  // Load balancing opportunities
  loadBalancingOpportunities: [
    {
      fromPlant: "Cadivi Bắc Ninh",
      toPlant: "Cadivi Long Thành",
      materials: 45,
      capacityGain: "8%",
      impact: "medium",
    },
    {
      fromPlant: "Cadivi Đà Nẵng",
      toPlant: "Cadivi Tân Á",
      materials: 32,
      capacityGain: "5%",
      impact: "low",
    },
  ],

  // Underutilized capacity alerts
  underutilizedCapacity: [
    { plant: "Cadivi Tân Á", process: "Kéo", utilization: 62, available: "38%", potentialOutput: "+4.2 km/shift" },
    { plant: "Cadivi Long Thành", process: "Xoắn", utilization: 68, available: "32%", potentialOutput: "+2.8 km/shift" },
    { plant: "Cadivi Đà Nẵng", process: "Bọc", utilization: 71, available: "29%", potentialOutput: "+3.1 km/shift" },
  ],

  // Transfer recommendations
  transferRecommendations: [
    {
      material: "53000234",
      from: "Cadivi Đà Nẵng",
      to: "Cadivi Bắc Ninh",
      reason: "Better machine match",
      expectedImprovement: "+15% speed",
      priority: "high",
    },
    {
      material: "52000890",
      from: "Cadivi Long Thành",
      to: "Cadivi Bắc Ninh",
      reason: "Higher utilization available",
      expectedImprovement: "+12% speed",
      priority: "medium",
    },
  ],

  // ROI scenarios
  roiScenarios: [
    {
      initiative: "Optimize top 10 problematic materials",
      investment: "120M VND",
      annualSaving: "485M VND",
      roi: "304%",
      payback: "3 months",
    },
    {
      initiative: "Implement load balancing across plants",
      investment: "85M VND",
      annualSaving: "320M VND",
      roi: "276%",
      payback: "3.2 months",
    },
    {
      initiative: "Upgrade 5 underperforming machines",
      investment: "650M VND",
      annualSaving: "1.2B VND",
      roi: "85%",
      payback: "6.5 months",
    },
  ],
};

// ============================================
// F. EXECUTIVE SUMMARY
// ============================================

export const executiveSummaryData = {
  // Strategic KPIs
  strategicKPIs: [
    { label: "Overall Coverage", value: "84%", target: "90%", status: "on-track", trend: "+16% YoY" },
    { label: "System Utilization", value: "78%", target: "85%", status: "on-track", trend: "+16% YoY" },
    { label: "Avg Output/Shift", value: "15.8 km", target: "17.5 km", status: "on-track", trend: "+26% YoY" },
    { label: "Quality Rate", value: "96.9%", target: "98%", status: "attention", trend: "+0.5% YoY" },
    { label: "OEE", value: "74%", target: "80%", status: "on-track", trend: "+8% YoY" },
  ],

  // Critical alerts
  criticalAlerts: [
    { severity: "critical", message: "5 materials với variance >30% cần điều tra ngay", affected: "3 plants" },
    { severity: "high", message: "Long Thành plant efficiency giảm 2% so với tháng trước", affected: "1 plant" },
    { severity: "medium", message: "38% capacity chưa sử dụng tại Tân Á - công đoạn Kéo", affected: "1 plant" },
  ],

  // Monthly summary
  monthlySummary: {
    month: "Tháng 3/2026",
    highlights: [
      "Coverage tăng từ 82% lên 84%",
      "Bắc Ninh plant đạt OEE 85% - cao nhất hệ thống",
      "Hoàn thành optimization 12 materials, tăng 8% output",
    ],
    challenges: [
      "Long Thành vẫn thấp nhất về efficiency (72%)",
      "Missing data ở Tân Á còn 28% materials",
    ],
  },

  // Capacity vs Demand gap
  capacityDemandGap: [
    { month: "T4/2026", demand: 85, capacity: 78, gap: -7, status: "shortage" },
    { month: "T5/2026", demand: 88, capacity: 80, gap: -8, status: "shortage" },
    { month: "T6/2026", demand: 90, capacity: 81, gap: -9, status: "shortage" },
    { month: "T7/2026", demand: 92, capacity: 82, gap: -10, status: "critical" },
  ],

  // Investment priorities
  investmentPriorities: [
    { priority: 1, initiative: "Optimize top 10 problematic materials", impact: "High", roi: "304%" },
    { priority: 2, initiative: "Complete missing data collection", impact: "High", roi: "180%" },
    { priority: 3, initiative: "Upgrade 5 underperforming machines", impact: "Medium", roi: "85%" },
  ],
};
