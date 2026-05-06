interface LegendItem {
  name: string;
  color: string;
}

interface ChartLegendProps {
  items: LegendItem[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5"
            style={{
              backgroundColor: item.color,
              borderRadius: "2px",
            }}
          />
          <span className="text-[11px] text-muted-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
