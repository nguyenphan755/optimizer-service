import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Building2, Bell, Clock, LogOut, Menu, Moon, Sun, UserCircle } from "lucide-react";
import { useTheme } from "@/app/lib/theme-context";
import { useAuth } from "@/app/contexts/auth-context";
import {
  hasMesAdminLikeAccess,
  isPlantPortalUser,
  mesGreetingName,
  mesHeaderPlantLabel,
} from "@/app/lib/mes-plant-nav";
import { useMissingSubmissionsList } from "@/app/hooks/useMissingSubmissions";
import { usePlants } from "@/app/hooks/useMasterData";
import { playSubmissionBell } from "@/app/lib/submission-bell";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface MESHeaderProps {
  onOpenAccount?: () => void;
  /** Admin / HO: chỉ gọi khi có bài chờ xem mới (kèm id để nhấp nháy dòng) */
  onNavigateToApproval?: (highlightSubmissionIds: number[]) => void;
  /** User nhà máy: chỉ gọi khi có cập nhật phê duyệt/import mới */
  onNavigateToPlantUpload?: (highlightSubmissionIds: number[]) => void;
  /** Mở menu điều hướng (drawer) trên màn nhỏ */
  onMenuClick?: () => void;
}

function importJobTerminal(j: string | null): boolean {
  return j === "done" || j === "partial_error" || j === "failed";
}

function importJobSuccess(j: string | null): boolean {
  return j === "done" || j === "partial_error";
}

function formatNowVi(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function MESHeader({
  onOpenAccount,
  onNavigateToApproval,
  onNavigateToPlantUpload,
  onMenuClick,
}: MESHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const prevPendingTotalRef = useRef<number | null>(null);
  const plantPortal = isPlantPortalUser(user ?? null);
  const { data: plants } = usePlants();
  const userPlantId = useMemo(() => {
    if (!plantPortal || !user?.plant_code?.trim() || !plants?.length) return null;
    const code = user.plant_code.trim().toUpperCase();
    const p = plants.find((x) => x.code.trim().toUpperCase() === code);
    return p?.id ?? null;
  }, [plantPortal, user, plants]);

  const plantWaterlineInitRef = useRef(false);
  const approvalWaterlineInitRef = useRef(false);
  const plantSnapRef = useRef<Map<number, { status: string; ij: string | null }>>(new Map());
  const plantSoundPrimedRef = useRef(false);
  const [plantDecisionWaterline, setPlantDecisionWaterline] = useState<string | null>(null);
  const [approvalPendingWaterline, setApprovalPendingWaterline] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !hasMesAdminLikeAccess(user)) {
      prevPendingTotalRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    plantWaterlineInitRef.current = false;
    approvalWaterlineInitRef.current = false;
    plantSnapRef.current.clear();
    plantSoundPrimedRef.current = false;
    setPlantDecisionWaterline(null);
    setApprovalPendingWaterline(null);
  }, [user?.id]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const plantHeaderLabel =
    user && user.role !== "admin"
      ? mesHeaderPlantLabel(user.plant_code) ??
        (user.plant_code?.trim() ? user.plant_code.trim().toUpperCase() : null)
      : null;

  const greeting = user ? mesGreetingName(user) : "";
  const fullAccess = hasMesAdminLikeAccess(user ?? null);

  const { data: pendingList, isFetched: pendingListFetched } = useMissingSubmissionsList({
    plantId: null,
    page: 1,
    limit: 50,
    status: "pending_review",
    enabled: Boolean(user) && fullAccess,
    refetchInterval: 25_000,
  });
  const pendingTotal = pendingList?.total ?? 0;

  const { data: plantSubs, isFetched: plantSubsFetched } = useMissingSubmissionsList({
    plantId: userPlantId,
    page: 1,
    limit: 50,
    enabled: Boolean(user) && plantPortal && userPlantId != null,
    refetchInterval: 25_000,
  });

  useEffect(() => {
    if (!plantPortal || !user?.id || userPlantId == null || !plantSubsFetched || !plantSubs) return;
    if (plantWaterlineInitRef.current) return;
    const key = `mes_plant_decision_waterline_${user.id}`;
    let stored = localStorage.getItem(key);
    if (stored == null) {
      const maxT = plantSubs.items.reduce((acc, i) => {
        if (!i.reviewed_at) return acc;
        return Math.max(acc, new Date(i.reviewed_at).getTime());
      }, 0);
      stored = (maxT > 0 ? new Date(maxT) : new Date()).toISOString();
      localStorage.setItem(key, stored);
    }
    setPlantDecisionWaterline(stored);
    plantWaterlineInitRef.current = true;
  }, [plantPortal, user?.id, userPlantId, plantSubsFetched, plantSubs]);

  const unseenPlantDecisionIds = useMemo(() => {
    if (!plantDecisionWaterline || !plantSubs?.items?.length) return [];
    const w = new Date(plantDecisionWaterline).getTime();
    return [...plantSubs.items]
      .filter((i) => i.reviewed_at && new Date(i.reviewed_at).getTime() > w)
      .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime())
      .map((i) => i.id);
  }, [plantDecisionWaterline, plantSubs]);
  const unseenPlantDecisionCount = unseenPlantDecisionIds.length;

  useEffect(() => {
    if (!fullAccess || !user?.id || !pendingListFetched || !pendingList) return;
    if (approvalWaterlineInitRef.current) return;
    const key = `mes_approval_pending_waterline_${user.id}`;
    let stored = localStorage.getItem(key);
    if (stored == null) {
      const maxT = pendingList.items.reduce((acc, i) => {
        return Math.max(acc, new Date(i.created_at).getTime());
      }, 0);
      stored = (maxT > 0 ? new Date(maxT) : new Date()).toISOString();
      localStorage.setItem(key, stored);
    }
    setApprovalPendingWaterline(stored);
    approvalWaterlineInitRef.current = true;
  }, [fullAccess, user?.id, pendingListFetched, pendingList]);

  const unseenApprovalIds = useMemo(() => {
    if (!approvalPendingWaterline || !pendingList?.items?.length) return [];
    const w = new Date(approvalPendingWaterline).getTime();
    return [...pendingList.items]
      .filter((i) => new Date(i.created_at).getTime() > w)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((i) => i.id);
  }, [approvalPendingWaterline, pendingList]);
  const unseenApprovalCount = unseenApprovalIds.length;

  useEffect(() => {
    if (!plantPortal || userPlantId == null || !plantSubsFetched || !plantSubs?.items) return;
    const map = plantSnapRef.current;
    let shouldPlay = false;
    for (const it of plantSubs.items) {
      const prev = map.get(it.id);
      const ij = it.import_job_status ?? null;
      if (prev) {
        if (prev.status === "pending_review" && it.status !== "pending_review") {
          shouldPlay = true;
        }
        if (
          it.status === "import_started" &&
          prev.status === "import_started" &&
          !importJobTerminal(prev.ij) &&
          importJobSuccess(ij)
        ) {
          shouldPlay = true;
        }
      }
      map.set(it.id, { status: it.status, ij });
    }
    if (plantSoundPrimedRef.current && shouldPlay && document.visibilityState === "visible") {
      playSubmissionBell();
    }
    plantSoundPrimedRef.current = true;
  }, [plantPortal, userPlantId, plantSubsFetched, plantSubs]);

  useEffect(() => {
    if (!fullAccess || !user || !pendingListFetched) return;
    const prev = prevPendingTotalRef.current;
    if (prev === null) {
      prevPendingTotalRef.current = pendingTotal;
      return;
    }
    if (pendingTotal > prev && document.visibilityState === "visible") {
      playSubmissionBell();
    }
    prevPendingTotalRef.current = pendingTotal;
  }, [pendingTotal, fullAccess, user, pendingListFetched]);

  const approvalBellButton =
    user && fullAccess && onNavigateToApproval ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          if (unseenApprovalCount === 0) return;
          if (user?.id) {
            const key = `mes_approval_pending_waterline_${user.id}`;
            const nowIso = new Date().toISOString();
            localStorage.setItem(key, nowIso);
            setApprovalPendingWaterline(nowIso);
          }
          onNavigateToApproval(unseenApprovalIds);
        }}
        className="relative h-10 w-10 shrink-0 text-white touch-manipulation hover:bg-white/10 sm:h-9 sm:w-9"
        aria-label={
          unseenApprovalCount > 0
            ? `${unseenApprovalCount} bài chờ duyệt mới. Mở Approval Dashboard.`
            : "Thông báo"
        }
      >
        <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
        {unseenApprovalCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-slate-900 tabular-nums shadow-sm ring-2 ring-[#1e3a8a]">
            {unseenApprovalCount > 99 ? "99+" : unseenApprovalCount}
          </span>
        ) : null}
      </Button>
    ) : null;

  const plantBellButton =
    user && !fullAccess && plantPortal && userPlantId != null && onNavigateToPlantUpload ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          if (unseenPlantDecisionIds.length === 0) return;
          if (user?.id) {
            const key = `mes_plant_decision_waterline_${user.id}`;
            const nowIso = new Date().toISOString();
            localStorage.setItem(key, nowIso);
            setPlantDecisionWaterline(nowIso);
          }
          onNavigateToPlantUpload(unseenPlantDecisionIds);
        }}
        className="relative h-10 w-10 shrink-0 text-white touch-manipulation hover:bg-white/10 sm:h-9 sm:w-9"
        aria-label={
          unseenPlantDecisionCount > 0
            ? `Có ${unseenPlantDecisionCount} cập nhật phê duyệt/import. Mở Plant Upload.`
            : "Thông báo"
        }
      >
        <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
        {unseenPlantDecisionCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold leading-none text-slate-900 tabular-nums shadow-sm ring-2 ring-[#1e3a8a]">
            {unseenPlantDecisionCount > 99 ? "99+" : unseenPlantDecisionCount}
          </span>
        ) : null}
      </Button>
    ) : null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#1e40af] bg-[#1e3a8a] px-3 transition-colors dark:border-[#1e293b] dark:bg-[#0f172a] sm:h-16 sm:gap-4 sm:px-4 md:px-6">
      {onMenuClick && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0 text-white hover:bg-white/10 md:hidden h-11 w-11 touch-manipulation"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <div className="flex min-w-0 flex-1 items-start gap-2 text-white">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-col gap-0.5 leading-tight">
          <p className="truncate text-[0.9rem] font-normal text-blue-100/90 md:text-[1.05rem]">
            CADIVI · Capacity Lookup
          </p>
          <h1 className="truncate text-sm font-semibold text-white sm:text-base md:text-lg">
            Truy vấn và tra soát dữ liệu tốc độ
          </h1>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
        <div className="hidden min-w-0 flex-col items-end gap-0.5 text-right text-xs text-blue-100 md:flex lg:text-sm">
          {user && (
            <span className="max-w-[220px] truncate font-medium text-white" title={user.username}>
              Xin chào, {greeting}!
            </span>
          )}
          {plantHeaderLabel && (
            <span className="flex max-w-[280px] items-center justify-end gap-1 truncate">
              <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{plantHeaderLabel}</span>
            </span>
          )}
          {user?.role === "admin" && (
            <span className="text-[11px] text-blue-200/90">Quản trị · toàn bộ nhà máy</span>
          )}
          {user && user.role !== "admin" && fullAccess && (
            <span className="text-[11px] text-blue-200/90">Head Office · toàn bộ nhà máy</span>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-white md:hidden">
          <Clock className="h-3.5 w-3.5 shrink-0 text-blue-200" aria-hidden />
          <time dateTime={now.toISOString()} className="tabular-nums text-[10px] font-medium">
            {now.toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </time>
        </div>

        <div className="hidden items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-white md:flex lg:px-3">
          <Clock className="h-4 w-4 shrink-0 text-blue-200" aria-hidden />
          <time dateTime={now.toISOString()} className="tabular-nums text-xs font-medium lg:text-sm">
            {formatNowVi(now)}
          </time>
        </div>

        {user && (
          <div className="flex max-w-[140px] flex-col items-end truncate text-[10px] leading-tight text-blue-100 md:hidden">
            <span className="truncate font-medium text-white">Xin chào, {greeting}!</span>
            {plantHeaderLabel ? <span className="truncate">{plantHeaderLabel}</span> : null}
          </div>
        )}

        {approvalBellButton && (
          <div className="border-l border-white/20 pl-2 sm:pl-3">
            {unseenApprovalCount > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{approvalBellButton}</TooltipTrigger>
                  <TooltipContent side="bottom">
                    {unseenApprovalCount} bài chờ mới — Approval Dashboard
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              approvalBellButton
            )}
          </div>
        )}

        {user && fullAccess && onOpenAccount && (
          <div className="flex items-center gap-1 border-l border-white/20 pl-2 sm:gap-2 sm:pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAccount}
              className="h-10 gap-1 px-2 text-white touch-manipulation hover:bg-white/10 sm:h-9 sm:px-3"
            >
              <UserCircle className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Tài khoản</span>
            </Button>
          </div>
        )}
        {user && !fullAccess && (
          <>
            {plantBellButton && (
              <div className="border-l border-white/20 pl-2 sm:pl-3">
                {unseenPlantDecisionCount > 0 ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{plantBellButton}</TooltipTrigger>
                      <TooltipContent side="bottom">
                        {unseenPlantDecisionCount} cập nhật mới — Plant Upload
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  plantBellButton
                )}
              </div>
            )}
            <div className="flex items-center gap-1 border-l border-white/20 pl-2 sm:gap-2 sm:pl-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void logout()}
                className="h-10 gap-1 px-2 text-white touch-manipulation hover:bg-white/10 sm:h-9 sm:px-3"
              >
                <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Đăng xuất</span>
              </Button>
            </div>
          </>
        )}

        <div className="border-l border-white/20 pl-2 sm:pl-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-10 w-10 shrink-0 text-white touch-manipulation hover:bg-white/10 sm:h-9 sm:w-9"
                  aria-label={theme === "light" ? "Bật giao diện tối" : "Bật giao diện sáng"}
                >
                  {theme === "light" ? <Moon className="h-5 w-5 sm:h-4 sm:w-4" /> : <Sun className="h-5 w-5 sm:h-4 sm:w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {theme === "light" ? "Chuyển chế độ tối" : "Chuyển chế độ sáng"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
