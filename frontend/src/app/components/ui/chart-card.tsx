import { Card, CardContent } from "@/app/components/ui/card";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  legend?: ReactNode;
}

export function ChartCard({ title, subtitle, children, legend }: ChartCardProps) {
  return (
    <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-[13px] font-medium">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {legend && <div className="mb-3">{legend}</div>}

        <div>{children}</div>
      </CardContent>
    </Card>
  );
}
