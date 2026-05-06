import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/app/lib/theme-context";
import { AuthProvider, useAuth } from "@/app/contexts/auth-context";
import {
  hasMesAdminLikeAccess,
  isPlantPortalUser,
  isScreenAllowedForMesUser,
} from "@/app/lib/mes-plant-nav";
import { MESHeader } from "@/app/components/mes-header";
import { MESSidebar } from "@/app/components/mes-sidebar";

// Screens
import { ProductionDashboardScreen } from "@/app/components/screens/production-dashboard-screen";
import { DashboardOverviewScreen } from "@/app/components/screens/dashboard-overview-screen";
import { DashboardPlantDetailScreen } from "@/app/components/screens/dashboard-plant-detail-screen";
import { CapacityReportScreen } from "@/app/components/screens/capacity-report-screen";
import { ImportBTPOrdersScreen } from "@/app/components/screens/import-btp-orders-screen";
import { MaterialLookupScreen } from "@/app/components/screens/material-lookup-screen";
import { MissingDataScreen } from "@/app/components/screens/missing-data-screen";
import { PlantUploadScreen } from "@/app/components/screens/plant-upload-screen";
import { ApprovalDashboardScreen } from "@/app/components/screens/approval-dashboard-screen";
import { AIInsightScreen } from "@/app/components/screens/ai-insight-screen";
import { LoginScreen } from "@/app/components/screens/login-screen";
import { AccountScreen } from "@/app/components/screens/account-screen";

// Analytics Dashboards
import { MachinePerformanceDashboard } from "@/app/components/screens/machine-performance-dashboard";
import { PlantComparisonDashboard } from "@/app/components/screens/plant-comparison-dashboard";
import { MaterialAnalyticsDashboard } from "@/app/components/screens/material-analytics-dashboard";
import { TrendsForecastingDashboard } from "@/app/components/screens/trends-forecasting-dashboard";
import { OptimizationCenterDashboard } from "@/app/components/screens/optimization-center-dashboard";
import { ExecutiveSummaryDashboard } from "@/app/components/screens/executive-summary-dashboard";
import type { BellRowHighlightPayload } from "@/app/hooks/useBellRowFlash";

function AppShell() {
  const { user, isReady } = useAuth();
  const [activeScreen, setActiveScreen] = useState("dashboard-overview");
  const [selectedPlant, setSelectedPlant] = useState<string>("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [approvalBellHighlight, setApprovalBellHighlight] = useState<BellRowHighlightPayload | null>(null);
  const [plantUploadBellHighlight, setPlantUploadBellHighlight] = useState<BellRowHighlightPayload | null>(null);

  const clearApprovalBellHighlight = useCallback(() => setApprovalBellHighlight(null), []);
  const clearPlantUploadBellHighlight = useCallback(() => setPlantUploadBellHighlight(null), []);

  const handleNavigateToPlantDetail = (plantName: string) => {
    setSelectedPlant(plantName);
    setActiveScreen("dashboard-plant-detail");
  };

  const handleNavigateBackToDashboard = () => {
    setActiveScreen("dashboard-overview");
    setSelectedPlant("");
  };

  useEffect(() => {
    if (!user) return;
    if (!isScreenAllowedForMesUser(user, activeScreen)) {
      setActiveScreen("dashboard-overview");
      setSelectedPlant("");
    }
  }, [user, activeScreen]);

  useEffect(() => {
    if (activeScreen !== "approval") setApprovalBellHighlight(null);
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen !== "plant-upload") setPlantUploadBellHighlight(null);
  }, [activeScreen]);

  const renderScreen = () => {
    switch (activeScreen) {
      case "account":
        if (!hasMesAdminLikeAccess(user)) {
          return <DashboardOverviewScreen onNavigateToPlantDetail={handleNavigateToPlantDetail} />;
        }
        return <AccountScreen onBack={() => setActiveScreen("dashboard-overview")} />;

      case "dashboard-overview":
        return <DashboardOverviewScreen onNavigateToPlantDetail={handleNavigateToPlantDetail} />;
      case "dashboard-plant-detail":
        return (
          <DashboardPlantDetailScreen
            plantName={selectedPlant}
            onNavigateBack={handleNavigateBackToDashboard}
          />
        );

      case "production-dashboard":
        return <ProductionDashboardScreen />;

      case "capacity-report":
        return <CapacityReportScreen />;
      case "master-import":
        return <ImportBTPOrdersScreen />;

      case "material-lookup":
        return <MaterialLookupScreen />;

      case "missing-data":
        return <MissingDataScreen />;

      case "plant-upload":
        return (
          <PlantUploadScreen
            bellRowHighlight={plantUploadBellHighlight}
            onBellRowHighlightConsumed={clearPlantUploadBellHighlight}
          />
        );
      case "approval":
        return (
          <ApprovalDashboardScreen
            bellRowHighlight={approvalBellHighlight}
            onBellRowHighlightConsumed={clearApprovalBellHighlight}
          />
        );

      case "ai-insight":
        return (
          <AIInsightScreen
            onOpenDeepAnalytics={(screen) => setActiveScreen(screen)}
            onOpenOperational={(screen) => setActiveScreen(screen)}
          />
        );

      case "analytics-machine-performance":
        return <MachinePerformanceDashboard />;
      case "analytics-plant-comparison":
        return <PlantComparisonDashboard />;
      case "analytics-material":
        return <MaterialAnalyticsDashboard />;
      case "analytics-trends":
        return <TrendsForecastingDashboard />;
      case "analytics-optimization":
        return <OptimizationCenterDashboard />;
      case "analytics-executive":
        return <ExecutiveSummaryDashboard />;

      default:
        return <DashboardOverviewScreen onNavigateToPlantDetail={handleNavigateToPlantDetail} />;
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster richColors position="top-center" />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-background">
        <MESHeader
          onOpenAccount={hasMesAdminLikeAccess(user) ? () => setActiveScreen("account") : undefined}
          onNavigateToApproval={
            hasMesAdminLikeAccess(user)
              ? (highlightSubmissionIds) => {
                  setApprovalBellHighlight({
                    submissionIds: highlightSubmissionIds,
                    token: Date.now(),
                  });
                  setActiveScreen("approval");
                  setMobileNavOpen(false);
                }
              : undefined
          }
          onNavigateToPlantUpload={
            isPlantPortalUser(user)
              ? (highlightSubmissionIds) => {
                  setPlantUploadBellHighlight({
                    submissionIds: highlightSubmissionIds,
                    token: Date.now(),
                  });
                  setActiveScreen("plant-upload");
                  setMobileNavOpen(false);
                }
              : undefined
          }
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <MESSidebar
            activeScreen={activeScreen}
            onScreenChange={setActiveScreen}
            mobileOpen={mobileNavOpen}
            onMobileOpenChange={setMobileNavOpen}
            user={user}
          />
          <main
            id="app-main-scroll"
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto pb-[env(safe-area-inset-bottom)]"
          >
            {renderScreen()}
          </main>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
