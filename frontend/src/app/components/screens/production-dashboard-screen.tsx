import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Package, Clock, AlertCircle, TrendingUp, Activity, Factory, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Badge } from "@/app/components/ui/badge";
import { PageHeader } from "@/app/components/ui/page-header";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import { AGGREGATED_BTP } from "@/app/lib/central-btp-data";
import { BTP_LINE_ASSIGNMENTS, PRODUCTION_LINES } from "@/app/lib/btp-line-assignment";

const lineUtilizationData = [
  { line: "LINE-01", utilization: 89, status: "Available" },
  { line: "LINE-02", utilization: 92, status: "Running" },
  { line: "LINE-03", utilization: 85, status: "Available" },
  { line: "LINE-04", utilization: 68, status: "Available" },
  { line: "LINE-05", utilization: 91, status: "Available" },
  { line: "LINE-06", utilization: 87, status: "Available" },
  { line: "LINE-08", utilization: 75, status: "Available" },
  { line: "LINE-10", utilization: 72, status: "Available" },
  { line: "LINE-12", utilization: 58, status: "Available" },
  { line: "LINE-14", utilization: 65, status: "Available" },
];

const operationLoadData = [
  { operation: "Drawing", count: 156, color: "#3b82f6" },
  { operation: "Stranding", count: 124, color: "#10b981" },
  { operation: "Armoring", count: 98, color: "#f97316" },
  { operation: "Sheathing", count: 87, color: "#a855f7" },
  { operation: "Testing", count: 145, color: "#6b7280" },
  { operation: "Annealing", count: 112, color: "#06b6d4" },
  { operation: "Packing", count: 142, color: "#ec4899" },
];

const scheduleAdherenceData = [
  { day: "Mon", adherence: 94 },
  { day: "Tue", adherence: 92 },
  { day: "Wed", adherence: 89 },
  { day: "Thu", adherence: 91 },
  { day: "Fri", adherence: 88 },
];

const priorityDistribution = [
  { priority: "P1", count: 9, color: "#ef4444" },
  { priority: "P2", count: 5, color: "#f97316" },
  { priority: "P3", count: 1, color: "#9ca3af" },
];

export function ProductionDashboardScreen() {
  const lateOps = AGGREGATED_BTP.filter(op => op.status === 'pending');
  const atRiskOps: typeof AGGREGATED_BTP = [];
  const p1Ops = AGGREGATED_BTP.filter(op => op.priority === 'P1');
  const onTimeDelivery = Math.round(((AGGREGATED_BTP.length - lateOps.length) / AGGREGATED_BTP.length) * 100);
  
  const availableLines = PRODUCTION_LINES.filter(l => l.status === 'available' || l.status === 'running' || l.status === 'idle').length;
  const breakdownLines = PRODUCTION_LINES.filter(l => l.status === 'breakdown').length;
  const maintenanceLines = PRODUCTION_LINES.filter(l => l.status === 'maintenance').length;

  // Map status for display
  const statusCounts: Record<string, number> = {
    'available': PRODUCTION_LINES.filter(l => l.status === 'available').length,
    'running': PRODUCTION_LINES.filter(l => l.status === 'running').length,
    'idle': PRODUCTION_LINES.filter(l => l.status === 'idle').length,
    'breakdown': PRODUCTION_LINES.filter(l => l.status === 'breakdown').length,
    'maintenance': PRODUCTION_LINES.filter(l => l.status === 'maintenance').length,
  };

  const statusColors: Record<string, string> = {
    'available': '#10b981',
    'running': '#3b82f6',
    'idle': '#6b7280',
    'breakdown': '#ef4444',
    'maintenance': '#f59e0b',
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Production Scheduling Dashboard"
        description="Real-time overview with priority tracking, bottleneck analysis, and schedule adherence"
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total BTP</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{AGGREGATED_BTP.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled this run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Assignments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{BTP_LINE_ASSIGNMENTS.length}</div>
            <p className="text-xs text-muted-foreground mt-1">On production lines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Lines</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{availableLines}/{PRODUCTION_LINES.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {breakdownLines > 0 && `${breakdownLines} breakdown, `}
              {maintenanceLines > 0 && `${maintenanceLines} maintenance`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">On-Time Delivery</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{onTimeDelivery}%</div>
            <p className="text-xs text-muted-foreground mt-1">{lateOps.length} late orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">P1 Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#ef4444]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-[#ef4444]">{p1Ops.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Priority orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Schedule Adherence</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">91%</div>
            <p className="text-xs text-[#10b981] mt-1">Good performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#ef4444]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-[#ef4444]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Late Operations</div>
                <div className="text-2xl">{lateOps.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#f59e0b]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-[#f59e0b]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">At Risk</div>
                <div className="text-2xl">{atRiskOps.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#10b981]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Target className="h-6 w-6 text-[#10b981]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">On Schedule</div>
                <div className="text-2xl">{AGGREGATED_BTP.length - lateOps.length - atRiskOps.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Line Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Line Utilization (%) - Bottleneck Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lineUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="line" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <div className="font-medium">{data.line}</div>
                          <div className="text-sm text-muted-foreground">Status: {data.status}</div>
                          <div className="text-sm">Utilization: {data.utilization}%</div>
                          {data.utilization > 95 && (
                            <Badge variant="destructive" className="mt-1">Bottleneck</Badge>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
                  {lineUtilizationData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.utilization > 95 ? "#ef4444" : entry.utilization > 85 ? "#f59e0b" : "#1e3a8a"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="text-[#ef4444]">■ &gt;95% Critical</span>
              <span className="ml-4 text-[#f59e0b]">■ 85-95% High</span>
              <span className="ml-4 text-[#1e3a8a]">■ &lt;85% Normal</span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Adherence Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Adherence Trend (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scheduleAdherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="adherence" 
                  stroke="#1e3a8a" 
                  strokeWidth={2}
                  dot={{ fill: '#1e3a8a', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-muted-foreground">
              Target: &gt;90% | Current Week Average: 91%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority & Operation Distribution */}
      <div className="grid grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ priority, count }) => `${priority}: ${count}`}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {priorityDistribution.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">
                        {item.priority === 'P1' ? 'P1 - Urgent' : item.priority === 'P2' ? 'P2 - Normal' : 'P3 - Low'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operation Load Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Operation Load Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operationLoadData.map((op) => (
                <div key={op.operation}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: op.color }}></div>
                      <span className="text-sm">{op.operation}</span>
                    </div>
                    <span className="text-sm font-medium">{op.count} ops</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: op.color,
                        width: `${(op.count / 156) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Bottleneck & Capacity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="p-4 border-l-4 border-l-[#ef4444] bg-red-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-[#ef4444]" />
                <h4 className="font-medium">Critical Bottleneck</h4>
              </div>
              <p className="text-2xl mb-1">Armoring</p>
              <p className="text-sm text-muted-foreground">98% avg utilization</p>
              <Badge variant="destructive" className="mt-2">Action Required</Badge>
            </div>

            <div className="p-4 border-l-4 border-l-[#f59e0b] bg-orange-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-[#f59e0b]" />
                <h4 className="font-medium">High Load</h4>
              </div>
              <p className="text-2xl mb-1">Drawing</p>
              <p className="text-sm text-muted-foreground">92% avg utilization</p>
              <Badge className="mt-2 bg-[#f59e0b]">Monitor</Badge>
            </div>

            <div className="p-4 border-l-4 border-l-[#10b981] bg-green-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-[#10b981]" />
                <h4 className="font-medium">Optimal</h4>
              </div>
              <p className="text-2xl mb-1">Stranding</p>
              <p className="text-sm text-muted-foreground">85% avg utilization</p>
              <Badge className="mt-2 bg-[#10b981]">Good</Badge>
            </div>

            <div className="p-4 border-l-4 border-l-[#6b7280] bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-[#6b7280]" />
                <h4 className="font-medium">Under-Utilized</h4>
              </div>
              <p className="text-2xl mb-1">Sheathing</p>
              <p className="text-sm text-muted-foreground">45% avg utilization</p>
              <Badge variant="outline" className="mt-2">Capacity Available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Production Line Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              return (
                <div key={status} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[status] }}></div>
                    <span className="text-sm font-medium">{status}</span>
                  </div>
                  <div className="text-2xl">{count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round((count / PRODUCTION_LINES.length) * 100)}% of total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}