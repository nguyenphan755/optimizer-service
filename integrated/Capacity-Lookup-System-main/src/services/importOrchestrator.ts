import * as fs from 'fs';
import * as path from 'path';
import type { PoolClient } from 'pg';
import { getPool, withTransaction } from '../db/client';
import { listProcessSteps } from '../db/queries/processSteps';
import { listPlants } from '../db/queries/plants';
import {
  createImportJob,
  updateJobValidating,
  updateJobAfterValidation,
  bulkInsertImportErrors,
  bulkInsertImportConflicts,
  setJobProcessing,
  updateJobProgress,
  finishJob,
  getJobById,
  type ImportJobRow,
} from '../db/queries/importJobs';
import { insertMachine } from '../db/queries/machines';
import { insertMaterial } from '../db/queries/materials';
import { insertCapability, updateCapabilityByKeys } from '../db/queries/productionCapabilities';
import { parseWorkbook } from './excelParser';
import { validateParsedRow } from './rowValidator';
import { PlantLookupCache } from './factoryNormalizer';
import { detectConflicts } from './conflictDetector';
import type { ValidatedImportRow } from '../types/masterData';
import type { ImportStatus } from '../types/masterData';

const BATCH = 500;

export function validatedPayloadPath(uploadDir: string, jobId: number): string {
  return path.join(uploadDir, `job_${jobId}_validated.json`);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface ImportInitResult {
  job_id: number;
  status: ImportStatus;
  total_rows: number;
  error_rows: number;
  conflict_rows: number;
  errors_preview: Array<{
    sheet: string;
    row: number;
    material_code: string | null;
    column: string;
    raw_value: unknown;
    message: string;
  }>;
}

async function persistValidationErrors(
  client: PoolClient,
  jobId: number,
  flat: Array<{
    sheet: string;
    row: number;
    material_code: string | null;
    column: string;
    raw_value: unknown;
    message: string;
  }>
): Promise<void> {
  const dbRows = flat.map((e) => ({
    sheet_name: e.sheet,
    row_number: e.row,
    material_code: e.material_code,
    column_name: e.column,
    raw_value: e.raw_value === null || e.raw_value === undefined ? null : String(e.raw_value),
    error_message: e.message,
  }));
  await bulkInsertImportErrors(client, jobId, dbRows);
}

export async function runImportValidationPhase(params: {
  buffer: Buffer;
  originalFilename: string;
  uploadDir: string;
}): Promise<ImportInitResult> {
  const t0 = Date.now();
  ensureDir(params.uploadDir);
  const stamp = Date.now();
  const safeName = params.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedName = `${stamp}_${safeName}`;
  const filePath = path.join(params.uploadDir, storedName);
  fs.writeFileSync(filePath, params.buffer);

  const pool = getPool();
  const client = await pool.connect();
  let jobId = 0;
  try {
    const processSteps = await listProcessSteps(client);
    const plants = await listPlants(client);
    const plantCache = new PlantLookupCache(plants);

    jobId = await createImportJob(client, params.originalFilename, filePath);
    await updateJobValidating(client, jobId);

    const parsed = parseWorkbook(params.buffer, processSteps);
    const totalRows = parsed.rows.length;

    const validationErrors: ImportInitResult['errors_preview'] = [];
    const allErrorDetails: ImportInitResult['errors_preview'] = [];
    const validRows: ValidatedImportRow[] = [];

    for (const row of parsed.rows) {
      const res = validateParsedRow(row, plantCache, jobId);
      if (!res.ok) {
        for (const e of res.errors) {
          const item = {
            sheet: e.sheet,
            row: e.row,
            material_code: e.material_code,
            column: e.column,
            raw_value: e.raw_value,
            message: e.message,
          };
          allErrorDetails.push(item);
          if (validationErrors.length < 50) validationErrors.push(item);
        }
      } else {
        validRows.push(res.row);
      }
    }

    if (allErrorDetails.length > 0) {
      await persistValidationErrors(client, jobId, allErrorDetails);
    }

    const { conflicts, rows: rowsWithFlags } = await detectConflicts(client, validRows);

    if (conflicts.length > 0) {
      await bulkInsertImportConflicts(
        client,
        conflicts.map((c) => ({
          job_id: jobId,
          sheet_name: c.sheet_name,
          row_number: c.row_number,
          material_code: c.material_code,
          factory_name: c.factory_name,
          machine_type: c.machine_type,
          existing_design_speed: c.existing_design_speed,
          existing_actual_speed: c.existing_actual_speed,
          existing_output_km: c.existing_output_km,
          incoming_design_speed: c.incoming_design_speed,
          incoming_actual_speed: c.incoming_actual_speed,
          incoming_output_km: c.incoming_output_km,
        }))
      );
    }

    const status: ImportStatus =
      conflicts.length > 0 ? 'awaiting_conflict_resolution' : 'processing';

    await updateJobAfterValidation(client, jobId, {
      total_rows: totalRows,
      error_rows: allErrorDetails.length,
      conflict_rows: conflicts.length,
      status,
    });

    fs.writeFileSync(
      validatedPayloadPath(params.uploadDir, jobId),
      JSON.stringify(rowsWithFlags),
      'utf8'
    );

    const duration = Date.now() - t0;
    const sheetStats: Record<string, { parsed: number; valid: number }> = {};
    for (const r of parsed.rows) {
      sheetStats[r.sheet_name] = sheetStats[r.sheet_name] || { parsed: 0, valid: 0 };
      sheetStats[r.sheet_name].parsed++;
    }
    for (const r of validRows) {
      sheetStats[r.sheet_name] = sheetStats[r.sheet_name] || { parsed: 0, valid: 0 };
      sheetStats[r.sheet_name].valid++;
    }
    console.log(
      JSON.stringify({
        event: 'import_validate',
        job_id: jobId,
        sheets: sheetStats,
        rows_parsed: totalRows,
        rows_valid: validRows.length,
        rows_error: allErrorDetails.length,
        conflicts_found: conflicts.length,
        duration_ms: duration,
      })
    );

    if (conflicts.length === 0) {
      setImmediate(() => {
        void processImportJob(jobId, params.uploadDir, null).catch((err) => {
          console.error('processImportJob failed', jobId, err);
        });
      });
    }

    return {
      job_id: jobId,
      status,
      total_rows: totalRows,
      error_rows: allErrorDetails.length,
      conflict_rows: conflicts.length,
      errors_preview: validationErrors,
    };
  } finally {
    client.release();
  }
}

export async function resolveConflictsAndProcess(
  jobId: number,
  uploadDir: string,
  action: 'overwrite' | 'skip'
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await setJobProcessing(client, jobId, action);
  } finally {
    client.release();
  }

  setImmediate(() => {
    void processImportJob(jobId, uploadDir, action).catch((err) => {
      console.error('processImportJob failed', jobId, err);
    });
  });
}

async function processImportJob(
  jobId: number,
  uploadDir: string,
  conflictAction: 'overwrite' | 'skip' | null
): Promise<void> {
  const pool = getPool();
  const c0 = await pool.connect();
  let validationErrorCount = 0;
  try {
    const j0 = await getJobById(c0, jobId);
    validationErrorCount = j0?.error_rows ?? 0;
  } finally {
    c0.release();
  }

  const payloadPath = validatedPayloadPath(uploadDir, jobId);

  let rows: ValidatedImportRow[];
  try {
    if (!fs.existsSync(payloadPath)) {
      const c = await pool.connect();
      try {
        await finishJob(c, jobId, 'failed', 0, validationErrorCount);
      } finally {
        c.release();
      }
      return;
    }
    rows = JSON.parse(fs.readFileSync(payloadPath, 'utf8')) as ValidatedImportRow[];
  } catch (e) {
    console.error('processImportJob payload error', jobId, e);
    const c = await pool.connect();
    try {
      await finishJob(c, jobId, 'failed', 0, validationErrorCount);
    } finally {
      c.release();
    }
    return;
  }

  let successRows = 0;
  let cumulativeBatchErrors = 0;
  let hadBatchFailure = false;

  try {
    for (let start = 0; start < rows.length; start += BATCH) {
      const chunk = rows.slice(start, start + BATCH);
      try {
        await withTransaction(async (client) => {
          for (const row of chunk) {
            if (row.is_conflict) {
              if (conflictAction === 'skip') {
                successRows++;
                continue;
              }
              if (conflictAction !== 'overwrite') {
                continue;
              }
            }

            const machineId = await insertMachine(
              client,
              row.plant_id,
              row.process_step_id,
              row.machine_type
            );
            const materialId = await insertMaterial(
              client,
              row.material_code,
              row.material_description,
              row.process_step_id
            );

            if (row.is_conflict && conflictAction === 'overwrite') {
              await updateCapabilityByKeys(client, {
                materialId,
                plantId: row.plant_id,
                machineId,
                designSpeed: row.design_speed,
                actualSpeed: row.actual_speed,
                outputKmPerShift: row.output_km_per_shift,
                outputKgPerShift: row.output_kg_per_shift,
              });
              successRows++;
            } else if (!row.is_conflict) {
              await insertCapability(client, {
                materialId,
                plantId: row.plant_id,
                machineId,
                processStepId: row.process_step_id,
                designSpeed: row.design_speed,
                actualSpeed: row.actual_speed,
                outputKmPerShift: row.output_km_per_shift,
                outputKgPerShift: row.output_kg_per_shift,
              });
              successRows++;
            }
          }
        });
      } catch (err) {
        hadBatchFailure = true;
        const msg = err instanceof Error ? err.message : String(err);
        const c2 = await pool.connect();
        try {
          const errRows = chunk.map((row) => ({
            sheet_name: row.sheet_name,
            row_number: row.row_number,
            material_code: row.material_code,
            column_name: null as string | null,
            raw_value: null as string | null,
            error_message: `Batch import failed: ${msg}`,
          }));
          await bulkInsertImportErrors(c2, jobId, errRows);
          cumulativeBatchErrors += chunk.length;
        } finally {
          c2.release();
        }
      }

      const c3 = await pool.connect();
      try {
        await updateJobProgress(
          c3,
          jobId,
          successRows,
          validationErrorCount + cumulativeBatchErrors
        );
      } finally {
        c3.release();
      }
    }

    const c4 = await pool.connect();
    try {
      const totalErr = validationErrorCount + cumulativeBatchErrors;
      let finalStatus: 'done' | 'partial_error' | 'failed' = 'done';
      if (hadBatchFailure && successRows === 0) finalStatus = 'failed';
      else if (hadBatchFailure || totalErr > 0) finalStatus = 'partial_error';

      await finishJob(c4, jobId, finalStatus, successRows, totalErr);
    } finally {
      c4.release();
    }
  } catch (e) {
    console.error('processImportJob fatal', jobId, e);
    const c5 = await pool.connect();
    try {
      await finishJob(
        c5,
        jobId,
        'failed',
        successRows,
        validationErrorCount + cumulativeBatchErrors
      );
    } finally {
      c5.release();
    }
  }
}

const TERMINAL_JOB_STATUSES = new Set(['done', 'partial_error', 'failed']);

/** Poll DB cho đến khi job import kết thúc (dùng sau setImmediate processImportJob). */
export async function waitForImportJobFinished(
  jobId: number,
  pollMs = 400
): Promise<ImportJobRow> {
  const pool = getPool();
  for (;;) {
    const c = await pool.connect();
    try {
      const j = await getJobById(c, jobId);
      if (!j) throw new Error(`Import job ${jobId} not found`);
      if (TERMINAL_JOB_STATUSES.has(j.status)) return j;
    } finally {
      c.release();
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}
