Thiết kế trang Dashboard cho hệ thống CADIVI Capacity Lookup.
Gồm 2 màn hình liên kết: Dashboard Tổng + Dashboard Drill-down nhà máy.
Theme: Light mặc định. Dùng đúng design tokens đã có từ Phase 1.

════════════════════════════════════════
MÀN 1 — dashboard/overview (Tổng quan toàn hệ thống)
════════════════════════════════════════

── Layout tổng thể ──────────────────────────────────────────────

Giữ sidebar nav đã có (220px, nền #1a2e5a).
Phần main: topbar + filter bar + content cuộn dọc.

Topbar (height 52px, border-bottom):
  Trái: "Dashboard — Năng lực sản xuất" (heading-md)
        "Cập nhật: 03/04/2026" (text-xs, text-secondary, bên dưới)
  Phải: 2 dropdown filter cạnh nhau —
        [Tất cả nhà máy ▾]  [Tất cả công đoạn ▾]
        Style: border 0.5px, radius 6px, height 32px, font 12px

── Row 1 — KPI Cards (8 cards, 4+4 chia 2 hàng) ─────────────────

Mỗi card: bg white, border 0.5px, radius 10px, padding 14px 16px.
Label: 11px uppercase letter-spacing, text-secondary.
Value: 24px font-weight 500.
Sub-text: 11px, màu theo semantic (success/warning/danger/info).

Hàng 1 — Data coverage:
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Tổng material    │ Có dữ liệu đầy đủ│ Thiếu dữ liệu    │ Chờ phê duyệt   │
│ 5.291            │ 4.334            │ 957              │ 12               │
│ ↑ 4 sheet import │ 81.9% coverage   │ 18.1% cần bổ sung│ batch upload mới │
│ (text-secondary) │ (success)        │ (warning)        │ (info/blue)      │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

Hàng 2 — Máy móc theo công đoạn:
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Tổng máy · Kéo   │ Tổng máy · Xoắn  │ Tổng máy · Giáp  │ Tổng máy · Bọc   │
│ 25               │ 58               │ 9                │ 24               │
│ 3 nhà máy        │ 3 nhà máy        │ 3 nhà máy        │ 3 nhà máy        │
│ chip [Kéo]xanh   │ chip [Xoắn]tím   │ chip [Giáp]vàng  │ chip [Bọc]xanh lá│
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

Chip công đoạn nhỏ (8px text, rounded-full) đặt góc trên phải mỗi card hàng 2:
  Kéo  → bg #eff6ff  text #1d4ed8
  Xoắn → bg #f5f3ff  text #6d28d9
  Giáp → bg #fffbeb  text #b45309
  Bọc  → bg #f0fdf4  text #15803d

── Row 2 — 2 Charts ngang nhau (grid 1fr 1fr, gap 16px) ──────────

Chart card style: bg white, border 0.5px, radius 10px, padding 16px.
Chart title: 13px font-weight 500. Sub-title: 11px text-secondary, margin-bottom 14px.
Legend custom HTML (KHÔNG dùng Chart.js default legend):
  Mỗi item: hình vuông 10x10px radius 2px + tên, font 11px, gap 14px, flex-wrap.

Card trái — "Coverage dữ liệu theo công đoạn":
  Loại: Stacked bar chart (Chart.js)
  Trục X: Kéo / Xoắn / Giáp / Bọc
  Dataset 1 "Có data": màu #2563eb
  Dataset 2 "Thiếu":   màu #e5e7eb
  Trục Y: 0–100, label hiện "%"
  Border-radius cột: 4px
  Height canvas wrapper: 200px

Card phải — "Tốc độ thực tế vs thiết kế":
  Loại: Grouped bar chart
  Trục X: Kéo / Xoắn / Giáp / Bọc
  Dataset 1 "Thiết kế": màu #93c5fd (xanh nhạt)
  Dataset 2 "Thực tế":  màu #2563eb (xanh đậm)
  Giá trị minh họa (m/min): Kéo 756/588 · Xoắn 248/166 · Giáp 7.2/7.2 · Bọc 178/162
  Lưu ý: Kéo có giá trị lớn hơn rất nhiều → trục Y tự scale
  Height canvas wrapper: 200px

── Row 3 — Scatter chart full width ─────────────────────────────

Card full width: bg white, border 0.5px, radius 10px, padding 16px.
Title: "Phân bố actual_speed theo nhà máy — Top 20 material (Xoắn)"
Sub:   "Scatter: mỗi điểm = 1 material-machine | trục X = design_speed | trục Y = actual_speed"

Legend 3 màu theo nhà máy:
  Đà Nẵng   → #2563eb (blue)
  Long Thành → #16a34a (green)
  Tân Á      → #d97706 (amber)

Chart: Scatter (Chart.js), 20 data points phân bố rải rác.
Trục X label: "Design speed (m/min)" · Trục Y label: "Actual speed (m/min)"
Grid lines: màu #f0f0f0 (rất nhạt)
Point radius: 6px, opacity 0.55 để thấy overlap
Height canvas wrapper: 260px

── Row 4 — Pareto chart full width ──────────────────────────────

Card full width, cùng style.
Title: "Missing data theo nhà máy — Phân tích Pareto"
Sub:   "Cột: số material thiếu | Đường đỏ: % tích lũy"

Chart: Bar + Line kết hợp (Chart.js type: 'bar' với dataset line overlay).
Labels: Xoắn / Bọc / Kéo / Giáp (sắp xếp giảm dần)
Bar values: 420 / 310 / 145 / 82
Bar colors: mỗi công đoạn 1 màu (xanh/tím/vàng/xanh lá — theo scheme chip)
Line: % tích lũy [43%, 75%, 90%, 100%], màu #dc2626, point radius 4px
Trục Y trái: "Số material" · Trục Y phải: "% tích lũy" (0–100%)
Height canvas wrapper: 220px

── Row 5 — Data table full width ────────────────────────────────

Card: bg white, border 0.5px, radius 10px, overflow hidden.

Table header (card level):
  Trái: "Top 20 material — Năng lực sản xuất thực tế" (13px font-weight 500)
  Phải: badge [Xoắn + Bọc] màu blue

Table columns (9 cột):
  Material Code | Mô tả | Công đoạn | Nhà máy | Máy (đề xuất) |
  TK (m/min) | TT (m/min) | Output km/ca | Status

Table style:
  Header row: bg #f9fafb, text 11px uppercase letter-spacing, text-secondary
  Header height: 40px · Row height: 44px
  Row hover: bg #fafafa
  Font "Material Code": font-mono 11px
  Font "TK/TT": font-mono 11px, text-primary
  Chip công đoạn: nhỏ rounded-full (cùng scheme màu trên)
  Badge Status:
    "Đầy đủ"    → bg #f0fdf4 text #15803d
    "Thiếu data" → bg #fffbeb text #b45309
  Divider: 0.5px border-bottom giữa các row
  Last row: không có border-bottom

── Clickable — drill-down ───────────────────────────────────────

Mỗi row trong table có cursor pointer.
Khi hover: slight bg highlight + cursor pointer.
Khi click vào tên nhà máy (cột "Nhà máy"):
  → Navigate đến Màn 2: dashboard/plant-detail với plant tương ứng.

Thêm 3 "Plant Summary Card" nhỏ ngay dưới Row 4 (trước table),
layout 3 cột (1 card/nhà máy), clickable → drill-down:

┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Đà Nẵng          →  │ │ Long Thành        →  │ │ Tân Á             →  │
│ 1.820 materials     │ │ 1.640 materials     │ │ 1.831 materials     │
│ ██████████ 84%      │ │ ████████░░ 79%      │ │ ███████░░░ 72%      │
│ coverage bar        │ │ coverage bar        │ │ coverage bar        │
│ 32 máy · 4 công đoạn│ │ 28 máy · 4 CĐ      │ │ 30 máy · 4 CĐ      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

Progress bar: height 4px, radius 2px.
  Đà Nẵng   → màu #2563eb
  Long Thành → màu #16a34a
  Tân Á      → màu #d97706
Mũi tên → bên phải mỗi card (text-secondary, 14px).
Hover card: border đổi từ 0.5px tertiary → 1px secondary.

════════════════════════════════════════
MÀN 2 — dashboard/plant-detail (Drill-down 1 nhà máy)
════════════════════════════════════════

Truy cập bằng cách click Plant Summary Card hoặc row table ở Màn 1.

── Topbar ───────────────────────────────────────────────────────

  Trái: nút "← Quay lại" (text-secondary, 12px) + breadcrumb
        "Dashboard / Đà Nẵng" (heading-md)
  Phải: dropdown [Tất cả công đoạn ▾]  [Tháng này ▾]

── KPI Row (4 cards) ────────────────────────────────────────────

┌───────────────┬───────────────┬───────────────┬───────────────┐
│ Tổng material │ Coverage      │ Thiếu data    │ Tổng máy      │
│ 1.820         │ 84%           │ 291           │ 32            │
│ Đà Nẵng       │ ████████░░    │ cần bổ sung   │ 4 công đoạn   │
└───────────────┴───────────────┴───────────────┴───────────────┘

Card "Coverage" có mini progress bar (height 4px) ngay dưới số %.

── 2 Charts ngang ───────────────────────────────────────────────

Card trái — "Coverage theo công đoạn — Đà Nẵng":
  Horizontal bar chart.
  4 bars: Kéo / Xoắn / Giáp / Bọc
  Mỗi bar: màu theo công đoạn, hiện % ở cuối bar (12px).
  Height wrapper: 180px

Card phải — "Top 10 máy — Actual speed":
  Horizontal bar chart (sorted giảm dần theo actual_speed).
  Bar màu đơn: #2563eb.
  Label trục Y: tên máy (font-size 11px, truncate nếu dài).
  Hiện giá trị m/min ở cuối mỗi bar.
  Height wrapper: (10 × 32 + 60)px = 380px.

── Table chi tiết máy theo công đoạn ────────────────────────────

4 section, mỗi section = 1 công đoạn, có thể collapse/expand:

Section header (click để toggle):
  [▼] Kéo  ·  5 máy  ·  coverage 88%       [chip Kéo]

Table columns trong mỗi section:
  Máy (machine_type) | design_speed | actual_speed | Hiệu suất % |
  output_km_per_shift | output_kg_per_shift | Material count | Status

"Hiệu suất %" = actual_speed / design_speed × 100:
  ≥ 90% → badge green "Tốt"
  70–89% → badge amber "Trung bình"
  < 70% → badge red "Thấp"

"Material count" = số material đang chạy trên máy đó.

Row hover: cursor pointer → navigate đến Search page với filter nhà máy + máy đó.

── Bottom — Missing data mini-list ──────────────────────────────

Card nhỏ cuối trang:
Title: "Material thiếu dữ liệu — Đà Nẵng (291)"
Hiển thị 5 item đầu dạng list ngang:
  [53000035 · Xoắn] [56000090 · Bọc] [52000115 · Kéo] ... + "Xem tất cả →"
"Xem tất cả →" navigate đến Missing Data Records đã filter theo nhà máy này.

════════════════════════════════════════
COMPONENTS CẦN BUILD THÊM (trang Components)
════════════════════════════════════════

│ Component             │ Variants / States                          │
├───────────────────────┼────────────────────────────────────────────┤
│ KpiCard               │ neutral / success / warning / danger / info│
│                       │ + variant có mini progress bar             │
│ PlantSummaryCard      │ default / hover / 3 màu theo nhà máy       │
│ ChartCard             │ wrapper chuẩn cho mọi chart                │
│ ProgressBarInline     │ size sm (4px) / md (8px), 3 màu plant      │
│ SectionCollapse       │ expanded / collapsed                       │
│ EfficiencyBadge       │ Tốt (green) / Trung bình (amber) / Thấp    │
│ BreadcrumbNav         │ 1 level / 2 level                          │
│ ProcessChip           │ Kéo/Xoắn/Giáp/Bọc — đã có, dùng lại       │

════════════════════════════════════════
LAYOUT RULES
════════════════════════════════════════

Page padding: 20px top, 24px left/right.
Gap giữa các row: 20px.
Gap giữa card trong cùng row: 16px.
Chart card padding bên trong: 16px.
Table row height: 44px (chuẩn, đồng nhất với Phase 1-2).
Tất cả chart height cố định trên wrapper div, KHÔNG trên canvas.
Responsive breakpoint: ≥1280px = full layout, 768-1279px = 2 cột charts,
  <768px = 1 cột (mobile không ưu tiên cho phase này).

Frame Figma:
  "dashboard/overview"     — 1440 × auto
  "dashboard/plant-detail" — 1440 × auto
  Prototype: click PlantSummaryCard → navigate plant-detail
             click "← Quay lại" → navigate overview