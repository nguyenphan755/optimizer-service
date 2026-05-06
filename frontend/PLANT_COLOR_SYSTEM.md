# Plant Color System - Hệ thống màu sắc nhà máy CADIVI

## 🎨 Quy định màu cho 4 nhà máy

Mỗi nhà máy CADIVI có bộ màu riêng để dễ phân biệt trên UI, charts, và reports.

### Bảng màu chính:

| Nhà máy | Màu chính | Hex | Ý nghĩa |
|---------|-----------|-----|---------|
| **Cadivi Long Thành** | 🔵 Blue | `#3b82f6` | Plant lớn nhất, màu primary của hệ thống |
| **Cadivi Tân Á** | 🟢 Green | `#10b981` | Tăng trưởng, hiệu quả cao |
| **Cadivi Đà Nẵng** | 🟠 Orange | `#f59e0b` | Nổi bật, dễ nhận diện |
| **Cadivi Bắc Ninh** | 🟣 Purple | `#8b5cf6` | Khác biệt, độc đáo |

## 📦 File Constants: `/src/app/lib/plant-colors.ts`

### Color Shades

Mỗi nhà máy có 6 shades:

```typescript
{
  primary: "#3b82f6",  // Màu chính - dùng cho borders, icons
  light: "#dbeafe",    // Màu nhạt - dùng cho hover states
  dark: "#1e40af",     // Màu đậm - dùng cho text, dark mode
  bg: "#eff6ff",       // Background - dùng cho card backgrounds
  border: "#93c5fd",   // Border nhạt - dùng cho subtle borders
  text: "#1e40af",     // Text color - dùng cho headings
}
```

### Helper Functions

#### 1. `getPlantColor(plantName, shade)`

Lấy màu của nhà máy theo shade.

```typescript
// Lấy màu chính
const color = getPlantColor("Cadivi Long Thành");  // "#3b82f6"

// Lấy màu background
const bgColor = getPlantColor("Cadivi Long Thành", "bg");  // "#eff6ff"

// Lấy màu border
const borderColor = getPlantColor("Cadivi Tân Á", "border");  // "#6ee7b7"
```

#### 2. `getShortPlantName(plantName)`

Loại bỏ "Cadivi " prefix.

```typescript
getShortPlantName("Cadivi Long Thành");  // "Long Thành"
getShortPlantName("Cadivi Đà Nẵng");    // "Đà Nẵng"
```

#### 3. `getChartColor(index)`

Lấy màu cho charts theo index.

```typescript
const colors = [0, 1, 2, 3].map(i => getChartColor(i));
// ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]
```

## 🎯 Usage Examples

### 1. Plant Badge với màu nhà máy

```tsx
<Badge
  style={{
    backgroundColor: getPlantColor(plant),
    color: "white",
  }}
>
  {getShortPlantName(plant)}
</Badge>
```

### 2. Card với border màu nhà máy

```tsx
<Card
  className="border-2"
  style={{
    borderColor: getPlantColor(plant),
    backgroundColor: getPlantColor(plant, "bg"),
  }}
>
  <div
    className="h-3 w-3 rounded"
    style={{ backgroundColor: getPlantColor(plant) }}
  />
  <span>{getShortPlantName(plant)}</span>
</Card>
```

### 3. Chart với màu nhà máy

```tsx
import { getPlantColor } from "@/app/lib/plant-colors";

<BarChart data={data}>
  <Bar dataKey="value">
    {data.map((entry, index) => (
      <Cell
        key={`cell-${index}`}
        fill={getPlantColor(entry.plant)}
      />
    ))}
  </Bar>
</BarChart>
```

### 4. Factory Icon với gradient

```tsx
<div
  className="h-12 w-12 rounded-xl flex items-center justify-center"
  style={{
    background: `linear-gradient(to bottom right, ${getPlantColor(plant)}, ${getPlantColor(plant, "dark")})`
  }}
>
  <Factory className="h-6 w-6 text-white" />
</div>
```

### 5. Table Row với plant color

```tsx
<TableRow>
  <TableCell>
    <div className="flex items-center gap-2">
      <div
        className="h-3 w-3 rounded"
        style={{ backgroundColor: getPlantColor(plant) }}
      />
      <span style={{ color: getPlantColor(plant, "text") }}>
        {getShortPlantName(plant)}
      </span>
    </div>
  </TableCell>
</TableRow>
```

## 📊 Recharts Integration

### CustomTooltip với plant colors

```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const plantName = payload[0]?.payload?.plant;
    const plantColor = plantName ? getPlantColor(plantName) : "#6b7280";

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold" style={{ color: plantColor }}>
          {getShortPlantName(label || plantName)}
        </p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

<BarChart data={data}>
  <Tooltip content={<CustomTooltip />} />
</BarChart>
```

### Legend với plant colors

```tsx
<ResponsiveContainer>
  <PieChart>
    <Pie data={plantData}>
      {plantData.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={getPlantColor(entry.plant)}
        />
      ))}
    </Pie>
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

## ✅ Đã áp dụng vào các screens:

### 1. **Capacity Report Screen**
- ✅ Bar charts với màu từng nhà máy
- ✅ Plant color legend card
- ✅ Custom tooltip với màu nhà máy
- ✅ Table với plant color indicators
- ✅ Missing data bars với màu nhà máy

### 2. **Missing Data Screen**
- ✅ Plant badges với màu riêng
- ✅ Plant statistics cards với border + bg colors
- ✅ Table rows với plant color indicators

### 3. **Material Lookup Screen**
- ✅ Plant cards với gradient icons
- ✅ Card borders với màu nhà máy cho recommended items
- ✅ Short plant names (without "Cadivi")

## 🎨 Other Color Systems

### Status Colors (độc lập với plant)

```typescript
STATUS_COLORS = {
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
}
```

### Priority Colors

```typescript
PRIORITY_COLORS = {
  high: "#ef4444",    // Red
  medium: "#f59e0b",  // Orange
  low: "#6b7280",     // Gray
}
```

## 📝 Best Practices

### DO ✅
- **Luôn dùng** `getPlantColor()` thay vì hardcode hex
- **Luôn dùng** `getShortPlantName()` để display
- Dùng `style={{}}` cho dynamic colors thay vì className
- Dùng gradient cho icons: `linear-gradient(to bottom right, primary, dark)`
- Dùng `bg` shade cho card backgrounds
- Dùng `border` shade cho subtle borders

### DON'T ❌
- ❌ Hardcode hex colors: `#3b82f6`
- ❌ Hardcode plant names: `"Long Thành"` (dùng `getShortPlantName()`)
- ❌ Mix status colors với plant colors
- ❌ Dùng same color cho nhiều plants
- ❌ Quên import: `import { getPlantColor } from "@/app/lib/plant-colors"`

## 🔄 Migration Checklist

Khi update một screen để dùng plant colors:

- [ ] Import: `import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors"`
- [ ] Replace hardcoded plant names với `getShortPlantName()`
- [ ] Replace hardcoded colors với `getPlantColor(plant, shade)`
- [ ] Update badges: `style={{ backgroundColor: getPlantColor(plant) }}`
- [ ] Update cards: `style={{ borderColor: getPlantColor(plant) }}`
- [ ] Update charts: `<Cell fill={getPlantColor(entry.plant)} />`
- [ ] Update tooltips: Use `CustomTooltip` pattern
- [ ] Test với tất cả 4 nhà máy
- [ ] Check dark mode

## 🎯 Screens cần update tiếp:

- [ ] Production Dashboard Screen
- [ ] Import BTP Orders Screen
- [ ] Plant Upload Screen
- [ ] Approval Dashboard Screen
- [ ] AI Insight Screen

## 📸 Visual Examples

### Before:
```tsx
<Badge className="bg-blue-500">Long Thành</Badge>
```

### After:
```tsx
<Badge style={{ backgroundColor: getPlantColor("Cadivi Long Thành") }}>
  {getShortPlantName("Cadivi Long Thành")}
</Badge>
```

---

## 💡 Tips

1. **Accessibility**: Đảm bảo contrast ratio đủ giữa text và background
2. **Dark mode**: Tất cả shades đều có dark mode variant
3. **Print**: Plant colors print tốt trên cả color và grayscale
4. **Data viz**: Màu được chọn dựa trên color-blind friendly palette
