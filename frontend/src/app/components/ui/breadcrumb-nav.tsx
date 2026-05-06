import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <div className="flex items-center gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {idx > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span
            className={`text-[13px] ${
              item.onClick
                ? "text-muted-foreground hover:text-foreground cursor-pointer"
                : "font-medium"
            }`}
            onClick={item.onClick}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
