// CSV Parser & Validator for Production Data Import

export interface RawCSVRow {
  no: string;
  materialCode: string;
  materialDescription: string;
  designSpeed: string;
  actualSpeedMp: string;
  actualSpeedMs: string;
  outputKmShift: string;
  outputKgShift: string;
  factory: string;
  machineType: string;
}

export interface ParsedProductionRecord {
  materialCode: string;
  materialDescription: string;
  designSpeed: number;
  actualSpeedMp: number;
  actualSpeedMs: number;
  outputKmShift: number;
  outputKgShift: number;
  factory: string;
  machineType: string;
  rowNumber: number;
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  value: string;
  error: string;
  materialCode?: string;
  materialDescription?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  records: ParsedProductionRecord[];
  errors: ValidationError[];
  warnings: string[];
}

// Factory name mapping
const FACTORY_MAPPING: Record<string, string> = {
  'đà nẵng': 'Cadivi Đà Nẵng',
  'Đà Nẵng': 'Cadivi Đà Nẵng',
  'da nang': 'Cadivi Đà Nẵng',
  'DA NANG': 'Cadivi Đà Nẵng',
  'long thành': 'Cadivi Long Thành',
  'Long Thành': 'Cadivi Long Thành',
  'LONG THANH': 'Cadivi Long Thành',
  'long thanh': 'Cadivi Long Thành',
  'tân á': 'Cadivi Tân Á',
  'Tân Á': 'Cadivi Tân Á',
  'tan a': 'Cadivi Tân Á',
  'TAN A': 'Cadivi Tân Á',
  'bắc ninh': 'Cadivi Bắc Ninh',
  'Bắc Ninh': 'Cadivi Bắc Ninh',
  'bac ninh': 'Cadivi Bắc Ninh',
  'BAC NINH': 'Cadivi Bắc Ninh',
};

function normalizeFactoryName(rawFactory: string): string {
  const trimmed = rawFactory.trim();
  return FACTORY_MAPPING[trimmed] || trimmed;
}

function parseNumber(value: string, fieldName: string): number | null {
  if (!value || value.trim() === '') return null;

  // Remove commas and normalize decimal separators
  const normalized = value.replace(/,/g, '');
  const parsed = parseFloat(normalized);

  if (isNaN(parsed)) return null;
  return parsed;
}

function validateRow(row: RawCSVRow, rowNumber: number): {
  isValid: boolean;
  record?: ParsedProductionRecord;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const materialCode = row.materialCode?.trim?.() ?? row.materialCode ?? "";
  const materialDescription = row.materialDescription?.trim?.() ?? row.materialDescription ?? "";

  // Validate Material Code (required)
  if (!row.materialCode || row.materialCode.trim() === '') {
    errors.push({
      rowNumber,
      field: 'Material Code',
      value: row.materialCode,
      error: 'Material Code is required',
      materialCode,
      materialDescription,
    });
  }

  // Validate Material Description (required)
  if (!row.materialDescription || row.materialDescription.trim() === '') {
    errors.push({
      rowNumber,
      field: 'Material Description',
      value: row.materialDescription,
      error: 'Material Description is required',
      materialCode,
      materialDescription,
    });
  }

  // Parse and validate numbers
  const designSpeed = parseNumber(row.designSpeed, 'Design Speed');
  const actualSpeedMp = parseNumber(row.actualSpeedMp, 'Actual Speed (m/p)');
  const actualSpeedMs = parseNumber(row.actualSpeedMs, 'Actual Speed (m/s)');
  const outputKmShift = parseNumber(row.outputKmShift, 'Output (km/shift)');
  const outputKgShift = parseNumber(row.outputKgShift, 'Output (kg/shift)');

  if (designSpeed === null) {
    errors.push({
      rowNumber,
      field: 'Design Speed',
      value: row.designSpeed,
      error: 'Invalid number format',
      materialCode,
      materialDescription,
    });
  }

  if (actualSpeedMp === null) {
    errors.push({
      rowNumber,
      field: 'Actual Speed (m/p)',
      value: row.actualSpeedMp,
      error: 'Invalid number format',
      materialCode,
      materialDescription,
    });
  }

  if (actualSpeedMs === null) {
    errors.push({
      rowNumber,
      field: 'Actual Speed (m/s)',
      value: row.actualSpeedMs,
      error: 'Invalid number format',
      materialCode,
      materialDescription,
    });
  }

  // Validate Factory (required)
  if (!row.factory || row.factory.trim() === '') {
    errors.push({
      rowNumber,
      field: 'Factory',
      value: row.factory,
      error: 'Factory is required',
      materialCode,
      materialDescription,
    });
  }

  // Validate Machine Type (required)
  if (!row.machineType || row.machineType.trim() === '') {
    errors.push({
      rowNumber,
      field: 'Machine Type',
      value: row.machineType,
      error: 'Machine Type is required',
      materialCode,
      materialDescription,
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Create valid record
  const record: ParsedProductionRecord = {
    materialCode: row.materialCode.trim(),
    materialDescription: row.materialDescription.trim(),
    designSpeed: designSpeed!,
    actualSpeedMp: actualSpeedMp!,
    actualSpeedMs: actualSpeedMs!,
    outputKmShift: outputKmShift || 0,
    outputKgShift: outputKgShift || 0,
    factory: normalizeFactoryName(row.factory),
    machineType: row.machineType.trim(),
    rowNumber
  };

  return { isValid: true, record, errors: [] };
}

export function parseCSV(csvContent: string): ImportResult {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 2) {
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
        error: 'CSV file is empty or invalid'
      }],
      warnings: []
    };
  }

  const header = lines[0];
  const dataLines = lines.slice(1);

  const records: ParsedProductionRecord[] = [];
  const allErrors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check header format
  const expectedHeaders = ['No.', 'Material Code', 'Material Description', 'Design Speed'];
  if (!expectedHeaders.every(h => header.includes(h))) {
    warnings.push('CSV header format may not match expected format. Please verify column order.');
  }

  dataLines.forEach((line, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
    const values = line.split(',');

    if (values.length < 10) {
      allErrors.push({
        rowNumber,
        field: 'Row',
        value: line.substring(0, 50),
        error: `Insufficient columns (expected 10, got ${values.length})`,
      });
      return;
    }

    const rawRow: RawCSVRow = {
      no: values[0],
      materialCode: values[1],
      materialDescription: values[2],
      designSpeed: values[3],
      actualSpeedMp: values[4],
      actualSpeedMs: values[5],
      outputKmShift: values[6],
      outputKgShift: values[7],
      factory: values[8],
      machineType: values[9]
    };

    const validation = validateRow(rawRow, rowNumber);

    if (validation.isValid && validation.record) {
      records.push(validation.record);
    } else {
      allErrors.push(...validation.errors);
    }
  });

  return {
    success: allErrors.length === 0,
    totalRows: dataLines.length,
    validRows: records.length,
    invalidRows: allErrors.length,
    records,
    errors: allErrors,
    warnings
  };
}
