// CSV Parser for Resistance Data

export interface ResistanceRecord {
  materialCode: string;
  observedAt: string; // ISO datetime
  plantCode: string; // "DN", "LT", "TA", "BN"
  loaiSp: string; // "Ccc", "Acc", etc.
  ca: number | null;
  dienTroMax: number;
  dienTroTt: number;
  tyLeDienTroPct: number;
}

export interface ResistanceImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  records: ResistanceRecord[];
  errors: Array<{
    rowNumber: number;
    field: string;
    value: string;
    error: string;
  }>;
  warnings: string[];
}

export function parseResistanceCSV(csvText: string): ResistanceImportResult {
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      records: [],
      errors: [{
        rowNumber: 0,
        field: 'File',
        value: '',
        error: 'File is empty'
      }],
      warnings: []
    };
  }

  const header = lines[0].split(',').map(h => h.trim());
  const dataLines = lines.slice(1);

  const records: ResistanceRecord[] = [];
  const errors: ResistanceImportResult['errors'] = [];
  const warnings: string[] = [];

  // Expected columns (flexible matching)
  const requiredFields = {
    materialCode: ['material code', 'material_code', 'ma vat lieu', 'mã vật liệu', 'materialcode'],
    observedAt: ['observed_at', 'thoi diem', 'thời điểm', 'datetime', 'timestamp'],
    plantCode: ['plant_code', 'plant', 'nha may', 'nhà máy', 'factory'],
    loaiSp: ['loai_sp', 'loai sp', 'loại sp', 'product_type'],
    ca: ['ca', 'shift', 'ca lam viec'],
    dienTroMax: ['dien_tro_max', 'dien tro max', 'điện trở max', 'r_max', 'resistance_max'],
    dienTroTt: ['dien_tro_tt', 'dien tro tt', 'điện trở tt', 'r_tt', 'resistance_actual'],
    tyLeDienTroPct: ['ty_le_dien_tro_pct', 'ty le %', 'tỷ lệ %', 'ratio', 'percentage']
  };

  // Find column indices
  const columnMap: Record<string, number> = {};
  for (const [field, variants] of Object.entries(requiredFields)) {
    const index = header.findIndex(h =>
      variants.some(v => h.toLowerCase().includes(v))
    );
    if (index === -1) {
      errors.push({
        rowNumber: 0,
        field,
        value: '',
        error: `Required column not found: ${field} (expected one of: ${variants.join(', ')})`
      });
    } else {
      columnMap[field] = index;
    }
  }

  // If critical columns are missing, return early
  if (Object.keys(columnMap).length < 5) {
    return {
      success: false,
      totalRows: dataLines.length,
      validRows: 0,
      invalidRows: dataLines.length,
      records: [],
      errors,
      warnings: ['Too many required columns are missing']
    };
  }

  // Parse data rows
  dataLines.forEach((line, idx) => {
    const rowNumber = idx + 2; // +2 because header is row 1
    const values = line.split(',').map(v => v.trim());

    const rowErrors: typeof errors = [];

    // Extract values
    const materialCode = values[columnMap.materialCode] || '';
    const observedAt = values[columnMap.observedAt] || '';
    const plantCode = values[columnMap.plantCode] || '';
    const loaiSp = values[columnMap.loaiSp] || '';
    const caStr = values[columnMap.ca] || '';
    const dienTroMaxStr = values[columnMap.dienTroMax] || '';
    const dienTroTtStr = values[columnMap.dienTroTt] || '';
    const tyLePctStr = values[columnMap.tyLeDienTroPct] || '';

    // Validate material code
    if (!materialCode) {
      rowErrors.push({
        rowNumber,
        field: 'Material Code',
        value: materialCode,
        error: 'Material code is required'
      });
    }

    // Validate plant code
    const validPlants = ['DN', 'LT', 'TA', 'BN'];
    if (!validPlants.includes(plantCode.toUpperCase())) {
      rowErrors.push({
        rowNumber,
        field: 'Plant Code',
        value: plantCode,
        error: `Plant code must be one of: ${validPlants.join(', ')}`
      });
    }

    // Parse numbers
    const ca = caStr ? parseInt(caStr) : null;
    const dienTroMax = parseFloat(dienTroMaxStr);
    const dienTroTt = parseFloat(dienTroTtStr);
    const tyLeDienTroPct = parseFloat(tyLePctStr);

    if (isNaN(dienTroMax)) {
      rowErrors.push({
        rowNumber,
        field: 'Điện trở Max',
        value: dienTroMaxStr,
        error: 'Must be a valid number'
      });
    }

    if (isNaN(dienTroTt)) {
      rowErrors.push({
        rowNumber,
        field: 'Điện trở TT',
        value: dienTroTtStr,
        error: 'Must be a valid number'
      });
    }

    if (isNaN(tyLeDienTroPct)) {
      rowErrors.push({
        rowNumber,
        field: 'Tỷ lệ %',
        value: tyLePctStr,
        error: 'Must be a valid number'
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      records.push({
        materialCode,
        observedAt,
        plantCode: plantCode.toUpperCase(),
        loaiSp,
        ca,
        dienTroMax,
        dienTroTt,
        tyLeDienTroPct
      });
    }
  });

  const validRows = records.length;
  const invalidRows = dataLines.length - validRows;

  return {
    success: errors.length === 0,
    totalRows: dataLines.length,
    validRows,
    invalidRows,
    records,
    errors,
    warnings
  };
}
