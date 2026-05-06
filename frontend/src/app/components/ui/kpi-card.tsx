import { Card, CardContent } from "@/app/components/ui/card";
import { ReactNode } from "react";
import { cn } from "./utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  subText?: string;
  icon?: ReactNode;
  variant?: "neutral" | "success" | "warning" | "danger" | "info";
  showProgressBar?: boolean;
  progressValue?: number;
  onClick?: () => void;
}

const variantStyles = {
  neutral: {
    subTextColor: "text-muted-foreground",
    progressBg: "#e5e7eb",
  },
  success: {
    subTextColor: "text-[#15803d]",
    progressBg: "#15803d",
  },
  warning: {
    subTextColor: "text-[#b45309]",
    progressBg: "#f59e0b",
  },
  danger: {
    subTextColor: "text-[#dc2626]",
    progressBg: "#dc2626",
  },
  info: {
    subTextColor: "text-[#2563eb]",
    progressBg: "#2563eb",
  },
};

export function KpiCard({
  label,
  value,
  subText,
  icon,
  variant = "neutral",
  showProgressBar = false,
  progressValue = 0,
  onClick,
}: KpiCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "border-[0.5px]",
        onClick
          ? "cursor-pointer select-none hover:bg-muted/30 transition-colors"
          : undefined
      )}
      style={{ borderRadius: "10px" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <CardContent className="p-[14px_16px]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              {label}
            </p>
            <p className="text-[24px] font-medium leading-tight">{value}</p>
            {subText && (
              <p className={`text-[11px] mt-1 ${styles.subTextColor}`}>
                {subText}
              </p>
            )}
            {showProgressBar && (
              <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressValue}%`,
                    backgroundColor: styles.progressBg,
                  }}
                />
              </div>
            )}
          </div>
          {icon && <div className="ml-3">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
