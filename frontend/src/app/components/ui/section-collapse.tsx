import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectionCollapseProps {
  title: string;
  subtitle?: string;
  chip?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function SectionCollapse({
  title,
  subtitle,
  chip,
  children,
  defaultExpanded = true,
}: SectionCollapseProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-[0.5px] rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-[13px] font-medium">{title}</span>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground">{subtitle}</span>
          )}
        </div>
        {chip}
      </div>

      {isExpanded && <div className="bg-white dark:bg-gray-900">{children}</div>}
    </div>
  );
}
