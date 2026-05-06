# 📊 LUỒNG XỬ LÝ DỮ LIỆU IMPORT - CADIVI PRODUCTION CAPACITY SYSTEM

## 🎯 Tổng quan

Khi bạn upload file `cadivi_master_production_data_figma.csv` (32,910 records), hệ thống sẽ xử lý qua **6 bước** như sau:

---

## 📝 BƯỚC 1: UPLOAD FILE

### Frontend (React)
```tsx
// User clicks "Browse Files"
<input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />

// File được chọn
const selectedFile = e.target.files?.[0];
// → File: cadivi_master_production_data_figma.csv (378 KB)
```

### Thông tin file
- **Tên**: `cadivi_master_production_data_figma.csv`
- **Kích thước**: 378 KB
- **Số dòng**: 32,911 (1 header + 32,910 data rows)
- **Format**: CSV với 10 columns

---

## ⚙️ BƯỚC 2: PARSE & READ CSV

### Frontend
```tsx
// Đọc file thành text
const text = await file.text();

// Parse CSV content
const result = parseCSV(text);
```

### CSV Parser (`csv-parser.ts`)
```typescript
export function parseCSV(csvContent: string): ImportResult {
  // 1. Split file thành lines
  const lines = csvContent.split('\n');

  // 2. Extract header (line 1)
  const header = lines[0];
  // → "No.,Material Code,Material Description,Design Speed,..."

  // 3. Extract data rows (lines 2 onwards)
  const dataLines = lines.slice(1);
  // → 32,910 rows

  // 4. Parse từng row thành object
  dataLines.forEach((line, index) => {
    const values = line.split(',');

    const rawRow = {
      no: values[0],
      materialCode: values[1],           // "52000106"
      materialDescription: values[2],    // "Cm 0.67"
      designSpeed: values[3],            // "1200"
      actualSpeedMp: values[4],          // "600"
      actualSpeedMs: values[5],          // "10.00"
      outputKmShift: values[6],          // "234.00"
      outputKgShift: values[7],          // "733.43"
      factory: values[8],                // "đà nẵng"
      machineType: values[9]             // "DAP 250/17"
    };

    // 5. Validate row → Bước 3
  });
}
```

**Output**: Array of 32,910 raw row objects

---

## ✅ BƯỚC 3: VALIDATION & NORMALIZATION

### Validation Rules

#### 1. **Required Fields Check**
```typescript
if (!row.materialCode || row.materialCode.trim() === '') {
  errors.push({
    rowNumber: 2,  // CSV row số 2
    field: 'Material Code',
    value: '',
    error: 'Material Code is required'
  });
}
```

#### 2. **Number Validation**
```typescript
function parseNumber(value: string): number | null {
  // Remove commas: "1,200" → "1200"
  const normalized = value.replace(/,/g, '');

  // Parse to float
  const parsed = parseFloat(normalized);

  if (isNaN(parsed)) return null; // Invalid
  return parsed;                  // Valid
}

// Example:
// "600" → 600 ✅
// "10.00" → 10.0 ✅
// "abc" → null ❌
```

#### 3. **Factory Name Normalization**
```typescript
const FACTORY_MAPPING = {
  'đà nẵng': 'Cadivi Đà Nẵng',
  'Đà Nẵng': 'Cadivi Đà Nẵng',
  'da nang': 'Cadivi Đà Nẵng',
  'long thành': 'Cadivi Long Thành',
  'tân á': 'Cadivi Tân Á',
  'bắc ninh': 'Cadivi Bắc Ninh',
};

function normalizeFactoryName(rawFactory: string): string {
  const trimmed = rawFactory.trim();
  return FACTORY_MAPPING[trimmed] || trimmed;
}

// Example:
// "đà nẵng" → "Cadivi Đà Nẵng" ✅
// "Đà Nẵng" → "Cadivi Đà Nẵng" ✅
```

### Validation Output

**Mỗi row sau validation sẽ thuộc 1 trong 2 loại:**

#### ✅ Valid Record
```typescript
{
  materialCode: "52000106",
  materialDescription: "Cm 0.67",
  designSpeed: 1200,
  actualSpeedMp: 600,
  actualSpeedMs: 10.0,
  outputKmShift: 234.0,
  outputKgShift: 733.43,
  factory: "Cadivi Đà Nẵng",      // ← Normalized!
  machineType: "DAP 250/17",
  rowNumber: 2
}
```

#### ❌ Invalid Record (with errors)
```typescript
{
  rowNumber: 156,
  field: 'Actual Speed (m/s)',
  value: 'abc',
  error: 'Invalid number format'
}
```

---

## 📊 BƯỚC 4: SUMMARY CALCULATION

### ImportResult Object
```typescript
{
  success: true,              // true nếu không có lỗi
  totalRows: 32910,           // Tổng số rows
  validRows: 32850,           // Số rows hợp lệ
  invalidRows: 60,            // Số rows lỗi
  records: [...],             // Array of 32,850 ParsedProductionRecord
  errors: [...],              // Array of 60 ValidationError
  warnings: [                 // Warnings (nếu có)
    "CSV header format may not match expected format"
  ]
}
```

### Hiển thị Summary Cards
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Total Rows     │  Valid Records  │  Invalid Rec... │  Success Rate   │
│    32,910       │     32,850      │       60        │      99.8%      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 🔍 BƯỚC 5: PREVIEW & ERROR DISPLAY

### A. Preview Valid Records (First 50)

**Preview Table:**
```
┌──────────────┬───────────────┬─────────────────┬─────────────┬──────────┬─────────────┐
│ Material     │ Description   │ Factory         │ Machine     │ Speed    │ Output (kg) │
│ Code         │               │                 │ Type        │ (m/s)    │             │
├──────────────┼───────────────┼─────────────────┼─────────────┼──────────┼─────────────┤
│ 52000106     │ Cm 0.67       │ Cadivi Đà Nẵng  │ DAP 250/17  │ 10.00    │ 733.43      │
│ 52000108     │ Cm 0.85       │ Cadivi Đà Nẵng  │ 13-DHT      │ 11.00    │ 1298.49     │
│ 52000111     │ Cm 1.04       │ Cadivi Đà Nẵng  │ 13-DHT      │ 10.00    │ 1767.15     │
│ ...          │ ...           │ ...             │ ...         │ ...      │ ...         │
└──────────────┴───────────────┴─────────────────┴─────────────┴──────────┴─────────────┘
```

**Features:**
- Show first 50 records
- Scrollable table
- Color-coded factories
- Formatted numbers

### B. Error List (First 100)

**Error Table:**
```
┌────────┬────────────────────────┬──────────┬───────────────────────────┐
│ Row #  │ Field                  │ Value    │ Error                     │
├────────┼────────────────────────┼──────────┼───────────────────────────┤
│ 156    │ Actual Speed (m/s)     │ abc      │ Invalid number format     │
│ 234    │ Material Code          │ (empty)  │ Material Code is required │
│ 567    │ Factory                │ xyz      │ Factory is required       │
│ ...    │ ...                    │ ...      │ ...                       │
└────────┴────────────────────────┴──────────┴───────────────────────────┘
```

---

## 💾 BƯỚC 6: IMPORT TO DATABASE (Future - Backend API)

### Data Flow

```
Frontend (React)              Backend API                    PostgreSQL
    │                             │                              │
    │ POST /api/import            │                              │
    │ {                           │                              │
    │   records: [...32850]       │                              │
    │ }                           │                              │
    ├────────────────────────────>│                              │
    │                             │                              │
    │                             │ BEGIN TRANSACTION            │
    │                             ├─────────────────────────────>│
    │                             │                              │
    │                             │ INSERT INTO materials        │
    │                             │ VALUES (...)                 │
    │                             ├─────────────────────────────>│
    │                             │                              │
    │                             │ INSERT INTO production_...   │
    │                             │ VALUES (...)                 │
    │                             ├─────────────────────────────>│
    │                             │                              │
    │                             │ COMMIT                       │
    │                             ├─────────────────────────────>│
    │                             │                              │
    │ 200 OK                      │                              │
    │ { imported: 32850 }         │                              │
    │<────────────────────────────┤                              │
    │                             │                              │
```

### Database Tables (Proposed Schema)

#### Table 1: `materials`
```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Table 2: `production_capacity`
```sql
CREATE TABLE production_capacity (
  id SERIAL PRIMARY KEY,
  material_id INTEGER REFERENCES materials(id),
  factory_id INTEGER REFERENCES factories(id),
  machine_type VARCHAR(100),
  design_speed DECIMAL(10,2),
  actual_speed_mp DECIMAL(10,2),
  actual_speed_ms DECIMAL(10,2),
  output_km_shift DECIMAL(10,2),
  output_kg_shift DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Table 3: `factories`
```sql
CREATE TABLE factories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20)
);

-- Pre-populated data
INSERT INTO factories (name, code) VALUES
  ('Cadivi Long Thành', 'LT'),
  ('Cadivi Tân Á', 'TA'),
  ('Cadivi Đà Nẵng', 'DN'),
  ('Cadivi Bắc Ninh', 'BN');
```

---

## 📈 BUSINESS LOGIC

### Duplicate Handling

**Scenario**: Cùng 1 material code có nhiều records với machines khác nhau

**Example từ CSV:**
```csv
52000106,Cm 0.67,...,đà nẵng,DAP 250/17
52000106,Cm 0.67,...,đà nẵng,WG17-2
52000106,Cm 0.67,...,đà nẵng,WG17-1
```

**Strategy**:
- ✅ **Cho phép** nhiều records cho cùng material + factory
- Mỗi record đại diện cho **1 machine type**
- Unique constraint: `(material_id, factory_id, machine_type)`

---

## 🔄 ERROR RECOVERY FLOW

### Nếu có lỗi validation:

```
1. User upload file
2. Hệ thống phát hiện 60 errors
3. Hiển thị error table với chi tiết
4. User có 2 options:

   Option A: Fix file Excel → Upload lại
   ┌─────────────────────────────────┐
   │ 1. Download error list          │
   │ 2. Sửa file Excel gốc           │
   │ 3. Upload Again                 │
   └─────────────────────────────────┘

   Option B: Import valid records only
   ┌─────────────────────────────────┐
   │ 1. Import 32,850 valid records  │
   │ 2. Skip 60 invalid records      │
   │ 3. Export error list for later  │
   └─────────────────────────────────┘
```

---

## 🎨 UI FLOW DIAGRAM

```
┌────────────────────────────────────────────────────────────────┐
│                     MASTER DATA SETUP SCREEN                   │
└────────────────────────────────────────────────────────────────┘

[1] Initial State
    ┌──────────────────────────────┐
    │  📤 Upload Master Data File  │
    │                              │
    │  [Browse Files]              │
    │                              │
    │  ⚠️  Required Columns:       │
    │  • Material Code             │
    │  • Design Speed              │
    │  • Factory, Machine Type     │
    └──────────────────────────────┘

[2] File Selected
    ┌──────────────────────────────┐
    │  📄 cadivi_master_...csv     │
    │  378 KB                      │
    │                              │
    │  [Process File] ←── Click    │
    └──────────────────────────────┘

[3] Processing... (2-3 seconds for 32K rows)
    ┌──────────────────────────────┐
    │  ⏳ Processing...            │
    │  Parsing CSV                 │
    │  Validating records          │
    └──────────────────────────────┘

[4] Results Displayed
    ┌───────────┬───────────┬───────────┬───────────┐
    │ Total     │ Valid     │ Invalid   │ Success   │
    │ 32,910    │ 32,850    │ 60        │ 99.8%     │
    └───────────┴───────────┴───────────┴───────────┘

    ⚠️  Warnings
    • CSV header format may not match expected

    ❌ Validation Errors (60)
    [Show/Hide Errors]

    ✅ Preview Valid Records
    [Table with first 50 records]

    [Upload Another]  [Export Valid]  [Import 32,850 to DB] ✅
```

---

## 🚀 NEXT STEPS

### Phase 1: Frontend Complete ✅
- ✅ CSV Parser with validation
- ✅ Factory name normalization
- ✅ Error handling
- ✅ Preview UI
- ✅ Summary statistics

### Phase 2: Backend Integration (Cursor + Postgres)
- [ ] Create REST API endpoints
- [ ] Database schema setup
- [ ] Import transaction logic
- [ ] Audit trail logging
- [ ] Error recovery mechanism

### Phase 3: Advanced Features
- [ ] Excel file support (.xlsx parsing)
- [ ] Batch import with progress bar
- [ ] Duplicate detection strategy
- [ ] Historical version tracking
- [ ] Export templates

---

## 📞 KẾT NỐI VỚI BACKEND

Khi backend (Cursor) đã setup Postgres schema, bạn sẽ thay thế:

```typescript
// Current (Mock)
const handleImport = () => {
  alert('Ready to import!');
};

// Future (Real API)
const handleImport = async () => {
  try {
    const response = await fetch('/api/production-capacity/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: importResult.records,
        source: file.name,
        importedBy: currentUser.email,
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    // { success: true, imported: 32850, duplicates: 5 }

    toast.success(`Imported ${result.imported} records!`);
  } catch (error) {
    toast.error('Import failed. Please try again.');
  }
};
```

---

## 📝 TÓM TẮT

**Khi bạn import file CSV 32,910 records:**

1. ✅ File được parse thành 32,910 objects
2. ✅ Mỗi row được validate (9 fields)
3. ✅ Factory names được normalize thành 4 tên chuẩn
4. ✅ Numbers được parse với comma handling
5. ✅ Errors được collect và display
6. ✅ Valid records được preview (first 50)
7. ✅ Ready to import to Postgres

**Thời gian xử lý**: ~2-3 seconds cho 32,910 rows (frontend only)
**Success rate expected**: 99%+ với file chuẩn format
**Next**: Connect to Backend API + Postgres
