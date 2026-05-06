import { ReactNode } from "react";
import { X, Maximize2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  onMaximize?: () => void;
}

const widthClasses = {
  sm: "w-96",
  md: "w-[32rem]",
  lg: "w-[48rem]",
  xl: "w-[64rem]",
};

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "lg",
  footer,
  onMaximize,
}: SideDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col",
          "border-l border-gray-200 dark:border-gray-800",
          widthClasses[width]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
