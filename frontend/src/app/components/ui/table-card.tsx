import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Table } from "./table";
import { cn } from "./utils";

interface TableCardProps {
  title: string;
  description?: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
  maxHeight?: string;
}

export function TableCard({
  title,
  description,
  headerActions,
  filters,
  children,
  footer,
  className,
  stickyHeader = true,
  maxHeight = "calc(100vh - 400px)",
}: TableCardProps) {
  return (
    <Card className={className}>
      <CardHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-white dark:bg-gray-900 border-b")}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
        {filters && <div className="mt-4">{filters}</div>}
      </CardHeader>

      <CardContent className="p-0">
        <div
          className="overflow-auto border-t"
          style={{ maxHeight: stickyHeader ? maxHeight : undefined }}
        >
          {children}
        </div>
      </CardContent>

      {footer && (
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50">
          {footer}
        </div>
      )}
    </Card>
  );
}
