import {
  LayoutDashboard,
  BarChart3,
  Factory,
  Search,
  AlertTriangle,
  Upload,
  CheckCircle,
  Sparkles,
  FileUp,
  UserCircle,
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import type { MesUser } from "@/app/api/types";
import { hasMesAdminLikeAccess, isPlantPortalUser } from "@/app/lib/mes-plant-nav";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function MenuItem({ icon, label, active, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 sm:py-3 text-sm transition-colors rounded-lg touch-manipulation min-h-[44px] sm:min-h-0",
        active
          ? "bg-[#1e3a8a] dark:bg-[#3b82f6] text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
      )}
    >
      <span className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-gray-500 dark:text-gray-400")}>
        {icon}
      </span>
      <span className="text-left">{label}</span>
    </button>
  );
}

interface MESSidebarProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  user: MesUser;
}

function SidebarInner({
  activeScreen,
  onNavigate,
  user,
}: {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  user: MesUser;
}) {
  const fullAccess = hasMesAdminLikeAccess(user);
  const plantNav = isPlantPortalUser(user);

  return (
    <>
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-3 border-b border-gray-200 dark:border-gray-800">
          <Factory className="h-6 w-6 text-[#1e3a8a] dark:text-[#3b82f6] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">CADIVI</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">Capacity Lookup System</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 px-3 py-2 space-y-1 overflow-y-auto overscroll-contain">
        <MenuItem
          icon={<LayoutDashboard />}
          label="Dashboard Năng lực"
          active={activeScreen === "dashboard-overview" || activeScreen === "dashboard-plant-detail"}
          onClick={() => onNavigate("dashboard-overview")}
        />

        <div className="pt-2 pb-1 border-t border-gray-200 dark:border-gray-800 mt-2" />

        <MenuItem
          icon={<Search />}
          label="Capacity Lookup"
          active={activeScreen === "material-lookup"}
          onClick={() => onNavigate("material-lookup")}
        />
        <MenuItem
          icon={<BarChart3 />}
          label="Báo cáo Năng lực"
          active={activeScreen === "capacity-report"}
          onClick={() => onNavigate("capacity-report")}
        />

        {!plantNav && (
          <>
            <MenuItem
              icon={<FileUp />}
              label="Master Data Setup"
              active={activeScreen === "master-import"}
              onClick={() => onNavigate("master-import")}
            />
          </>
        )}

        <MenuItem
          icon={<AlertTriangle />}
          label="Missing Data Records"
          active={activeScreen === "missing-data"}
          onClick={() => onNavigate("missing-data")}
        />

        <MenuItem
          icon={<Upload />}
          label="Plant Upload Portal"
          active={activeScreen === "plant-upload"}
          onClick={() => onNavigate("plant-upload")}
        />

        {!plantNav && (
          <>
            <MenuItem
              icon={<CheckCircle />}
              label="Approval Dashboard"
              active={activeScreen === "approval"}
              onClick={() => onNavigate("approval")}
            />

            <MenuItem
              icon={<Sparkles />}
              label="AI Analytics"
              active={activeScreen === "ai-insight"}
              onClick={() => onNavigate("ai-insight")}
            />
          </>
        )}

        {fullAccess && (
          <>
            <div className="pt-2 pb-1 border-t border-gray-200 dark:border-gray-800 mt-2" />
            <MenuItem
              icon={<UserCircle />}
              label="Tài khoản"
              active={activeScreen === "account"}
              onClick={() => onNavigate("account")}
            />
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-gray-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">v1.0.0 • Phase 1-6</div>
      </div>
    </>
  );
}

export function MESSidebar({
  activeScreen,
  onScreenChange,
  mobileOpen,
  onMobileOpenChange,
  user,
}: MESSidebarProps) {
  const closeMobile = () => onMobileOpenChange(false);

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="flex h-full w-[min(19rem,calc(100vw-1rem))] max-w-[90vw] flex-col gap-0 border-r border-gray-200 p-0 dark:border-gray-800"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Điều hướng ứng dụng</SheetTitle>
          </SheetHeader>
          <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-900">
            <SidebarInner
              activeScreen={activeScreen}
              user={user}
              onNavigate={(s) => {
                onScreenChange(s);
                closeMobile();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900 md:flex">
        <SidebarInner activeScreen={activeScreen} onNavigate={onScreenChange} user={user} />
      </aside>
    </>
  );
}
