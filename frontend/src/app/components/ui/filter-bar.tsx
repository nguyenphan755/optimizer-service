import { ReactNode } from "react";
import { cn } from "./utils";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function FilterBar({ children, className, sticky = false }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border",
        sticky && "sticky top-0 z-10 bg-white dark:bg-gray-900 border-b rounded-none",
        className
      )}
    >
      {children}
    </div>
  );
}
