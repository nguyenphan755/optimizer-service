import { Badge } from "@/app/components/ui/badge";

interface EfficiencyBadgeProps {
  efficiency: number;
}

export function EfficiencyBadge({ efficiency }: EfficiencyBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let label = "Tốt";
  let bgColor = "#f0fdf4";
  let textColor = "#15803d";

  if (efficiency >= 90) {
    label = "Tốt";
    bgColor = "#f0fdf4";
    textColor = "#15803d";
  } else if (efficiency >= 70) {
    label = "Trung bình";
    bgColor = "#fffbeb";
    textColor = "#b45309";
  } else {
    label = "Thấp";
    bgColor = "#fef2f2";
    textColor = "#dc2626";
  }

  return (
    <Badge
      variant={variant}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: "none",
      }}
    >
      {label}
    </Badge>
  );
}
