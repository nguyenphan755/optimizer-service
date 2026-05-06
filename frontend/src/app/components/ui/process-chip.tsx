interface ProcessChipProps {
  process: "Kéo" | "Xoắn" | "Giáp" | "Bọc";
  size?: "sm" | "md";
}

const processStyles = {
  Kéo: {
    bg: "#eff6ff",
    text: "#1d4ed8",
  },
  Xoắn: {
    bg: "#f5f3ff",
    text: "#6d28d9",
  },
  Giáp: {
    bg: "#fffbeb",
    text: "#b45309",
  },
  Bọc: {
    bg: "#f0fdf4",
    text: "#15803d",
  },
};

export function ProcessChip({ process, size = "md" }: ProcessChipProps) {
  const styles = processStyles[process];
  const fontSize = size === "sm" ? "8px" : "11px";
  const padding = size === "sm" ? "2px 8px" : "4px 10px";

  return (
    <span
      className="inline-block rounded-full font-medium"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        fontSize,
        padding,
      }}
    >
      {process}
    </span>
  );
}
