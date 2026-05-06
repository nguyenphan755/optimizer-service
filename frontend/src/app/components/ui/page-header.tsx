import { ReactNode } from "react";
import { cn } from "./utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
  /** Thanh tiêu đề thấp (dashboard): bỏ padding dưới lớn, chữ nhỏ hơn để không bị cắt */
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  subtitle,
  actions,
  sticky = false,
  className,
  compact = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        compact ? "pb-0" : "pb-6",
        sticky && "sticky top-0 z-20 bg-white dark:bg-gray-900 border-b pb-4",
        className
      )}
    >
      <div className={cn("flex justify-between gap-3", compact ? "items-center" : "items-start")}>
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "font-bold tracking-tight text-foreground",
              compact ? "text-base sm:text-lg leading-snug" : "text-2xl"
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "text-muted-foreground",
                compact ? "text-[11px] leading-snug mt-0.5" : "text-sm mt-2"
              )}
            >
              {description}
            </p>
          )}
          {subtitle && (
            <p
              className={cn(
                "text-muted-foreground",
                compact ? "text-[11px] leading-snug mt-0.5" : "text-xs mt-1"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className={cn("flex shrink-0 items-center gap-2", compact && "self-center")}>{actions}</div>
        )}
      </div>
    </div>
  );
}
