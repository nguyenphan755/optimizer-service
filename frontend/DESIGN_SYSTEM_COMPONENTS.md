# Design System Components - Data-Dense Dashboard Pattern

Đã tạo các shared components theo nguyên tắc UI/UX tối ưu cho data-dense dashboard.

## 🎯 Components Đã Tạo

### 1. **SideDrawer** (`/src/app/components/ui/side-drawer.tsx`)
- **Mục đích**: Drill-down chi tiết mà không cần chuyển trang
- **Features**:
  - Backdrop overlay
  - Configurable width (sm/md/lg/xl)
  - Sticky header & footer
  - Scrollable content
  - Close & Maximize buttons
- **Usage**: Click row → mở drawer → xem chi tiết + tabs

### 2. **TableCard** (`/src/app/components/ui/table-card.tsx`)
- **Mục đích**: Standardized table wrapper với filters & pagination
- **Features**:
  - Sticky header option
  - Built-in filter area
  - Configurable max-height with internal scroll
  - Header actions (export, settings)
  - Footer for pagination
- **Usage**: Wrap bất kỳ `<Table>` nào

### 3. **FilterBar** (`/src/app/components/ui/filter-bar.tsx`)
- **Mục đích**: Consistent filter controls
- **Features**:
  - Horizontal layout với gap spacing
  - Sticky option
  - Gray background để phân biệt với content
- **Usage**: Chứa Search, Select, Buttons cho filtering

### 4. **PageHeader** (`/src/app/components/ui/page-header.tsx`)
- **Mục đích**: Consistent page headers
- **Features**:
  - Title + description + subtitle
  - Actions area (buttons)
  - Sticky option
- **Usage**: Top của mỗi screen

## ✅ Demo Implementation: Missing Data Screen

Đã refactor hoàn toàn **Missing Data Screen** để showcase pattern:

### Layout Structure:
```
PageHeader (sticky)
  ├─ Title: "Missing Data Management"
  ├─ Description & subtitle
  └─ Actions: Export buttons

KPI Cards (4 cards)
  ├─ Total Missing
  ├─ Pending
  ├─ In Progress
  └─ Completed

Plant Statistics Card
  └─ 4 plants với color-coded badges

TableCard
  ├─ FilterBar (sticky)
  │   ├─ Search input
  │   ├─ Plant filter
  │   └─ Status filter
  └─ Table với sticky header
      └─ Clickable rows → Opens SideDrawer

SideDrawer (drill-down)
  ├─ Header: Material Code + Name
  ├─ Tabs:
  │   ├─ Info: Chi tiết request
  │   ├─ Plants: Đối chiếu nhà máy khác
  │   └─ History: Timeline lịch sử
  └─ Actions: Assign, Download template
```

### Key Features Implemented:

1. **Zero Horizontal Scroll**:
   - Table columns được tối ưu width
   - Chi tiết nhiều → mở drawer thay vì nhiều cột

2. **Minimal Vertical Scroll**:
   - Sticky header & filters
   - KPI cards ở top để nhìn overview nhanh
   - Table có max-height với internal scroll

3. **Drill-Down Pattern**:
   - Click row → SideDrawer opens
   - 3 tabs: Info, Plants comparison, History
   - Không cần chuyển trang mới

4. **Data-Dense nhưng Clean**:
   - Badges color-coded
   - Icons cho visual cues
   - Spacing chuẩn 4/8px
   - Typography hierarchy rõ ràng

## 🚀 Next Steps: Áp dụng vào các screens khác

### Priority Order:
1. ✅ **Missing Data** (Done - as demo)
2. **Master Data Import** - Large table với drill-down validation errors
3. **Approval Dashboard** - Split view: Queue list + Detail preview
4. **Capacity Report** - Charts drill-down to detailed data
5. **Plant Upload** - Upload history table với drawer chi tiết
6. **Material Lookup** - Search results với drawer machine details

### Pattern để áp dụng:

#### A. List/Table Screens:
```tsx
<PageHeader />
<KPI Cards />
<TableCard
  filters={<FilterBar>...</FilterBar>}
>
  <Table>
    <TableRow onClick={() => openDrawer(record)}>
      ...
    </TableRow>
  </Table>
</TableCard>
<SideDrawer>
  <Tabs>...</Tabs>
</SideDrawer>
```

#### B. Dashboard Screens:
```tsx
<PageHeader />
<div className="grid grid-cols-2 gap-6">
  <Card>Chart with click drill-down</Card>
  <Card>Summary stats</Card>
</div>
<TableCard>Supporting data table</TableCard>
```

#### C. Form/Upload Screens:
```tsx
<PageHeader />
<Card>Upload form</Card>
<TableCard>Upload history với click → drawer details</TableCard>
```

## 📐 Design System Principles

### Spacing Scale:
- `gap-2` (8px): Tight spacing trong badges/tags
- `gap-3` (12px): Default spacing trong FilterBar
- `gap-4` (16px): Spacing giữa cards
- `gap-6` (24px): Spacing giữa sections lớn

### Colors:
- Success: `#10b981` (green)
- Warning: `#f59e0b` (orange)
- Error: `#ef4444` (red)
- Info: `#3b82f6` (blue)
- Primary: `#1e3a8a` (dark blue)

### Typography:
- Page title: `text-2xl font-bold`
- Card title: `text-base font-semibold`
- Table header: `text-sm font-medium`
- Body: `text-sm`
- Caption: `text-xs text-muted-foreground`

### Sticky Elements:
```tsx
className="sticky top-0 z-10 bg-white dark:bg-gray-900"
```

### Hover States:
```tsx
className="hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer"
```

## 🎨 Component Variants

### SideDrawer Sizes:
- `sm` (384px): Quick info
- `md` (512px): Standard details
- `lg` (768px): Rich content with tabs
- `xl` (1024px): Full comparison views

### TableCard Heights:
- Default: `calc(100vh - 400px)`
- Custom: Pass `maxHeight` prop

## 📝 Usage Examples

### Basic Table with Drawer:
```tsx
const [selectedItem, setSelectedItem] = useState(null);
const [drawerOpen, setDrawerOpen] = useState(false);

<TableCard
  title="Data Table"
  filters={
    <FilterBar>
      <Input placeholder="Search..." />
      <Select>...</Select>
    </FilterBar>
  }
>
  <Table>
    <TableRow onClick={() => {
      setSelectedItem(item);
      setDrawerOpen(true);
    }}>
      ...
    </TableRow>
  </Table>
</TableCard>

<SideDrawer
  isOpen={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  title={selectedItem?.name}
>
  <Tabs>...</Tabs>
</SideDrawer>
```

### Sticky Page Header:
```tsx
<PageHeader
  sticky
  title="Page Title"
  description="Page description"
  actions={
    <>
      <Button>Action 1</Button>
      <Button>Action 2</Button>
    </>
  }
/>
```

## 🔄 Migration Checklist

Khi refactor một screen:

- [ ] Replace `<div>` header → `<PageHeader>`
- [ ] Wrap filters → `<FilterBar>`
- [ ] Wrap table → `<TableCard>`
- [ ] Add `onClick` handler to rows
- [ ] Create `<SideDrawer>` component
- [ ] Add `<Tabs>` for multiple views in drawer
- [ ] Test sticky behaviors
- [ ] Check spacing consistency
- [ ] Verify color usage
- [ ] Test dark mode

## 💡 Best Practices

1. **Always use shared components** thay vì custom layout
2. **Click row = open drawer** cho chi tiết
3. **Sticky header** cho screens có scroll dài
4. **Max 3 tabs** trong drawer
5. **Color-coded badges** cho status
6. **Icons** cho visual hierarchy
7. **Spacing scale** phải nhất quán
8. **Mobile**: Drawer full width on mobile (future)
