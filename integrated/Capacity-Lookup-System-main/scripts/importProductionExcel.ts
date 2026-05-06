/**
 * Import file Excel master production vào PostgreSQL (cùng pipeline với API).
 * Conflict → overwrite để ghi đè bản ghi trùng (material + plant + machine).
 *
 * Usage:
 *   npx ts-node scripts/importProductionExcel.ts [đường-dẫn-file.xlsx]
 *   EXCEL_PATH=... npx ts-node scripts/importProductionExcel.ts
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const defaultCandidates = [
    process.env.EXCEL_PATH,
    process.argv[2],
    path.join(process.env.USERPROFILE || '', 'Downloads', 'cadivi_master_production_data_20260403.xlsx'),
    'c:\\Users\\Admin\\Downloads\\cadivi_master_production_data_20260403.xlsx',
  ].filter(Boolean) as string[];

  let filePath: string | undefined;
  for (const p of defaultCandidates) {
    const abs = path.resolve(p);
    if (fs.existsSync(abs)) {
      filePath = abs;
      break;
    }
  }

  if (!filePath) {
    console.error(
      'Không tìm thấy file Excel. Truyền đường dẫn:\n' +
        '  npx ts-node scripts/importProductionExcel.ts "C:\\path\\file.xlsx"\n' +
        'Hoặc đặt EXCEL_PATH trong .env'
    );
    process.exit(1);
  }

  const {
    runImportValidationPhase,
    resolveConflictsAndProcess,
    waitForImportJobFinished,
  } = await import('../src/services/importOrchestrator');

  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  const buf = fs.readFileSync(filePath);

  console.log('Đang import:', filePath);
  const phase1 = await runImportValidationPhase({
    buffer: buf,
    originalFilename: path.basename(filePath),
    uploadDir,
  });

  console.log('Validate xong:', {
    job_id: phase1.job_id,
    status: phase1.status,
    total_rows: phase1.total_rows,
    error_rows: phase1.error_rows,
    conflict_rows: phase1.conflict_rows,
  });

  if (phase1.errors_preview.length > 0) {
    console.log('Một phần lỗi validation (preview):', phase1.errors_preview.slice(0, 10));
  }

  if (phase1.status === 'awaiting_conflict_resolution') {
    console.log('Có conflict — ghi đè (overwrite) và chạy import…');
    await resolveConflictsAndProcess(phase1.job_id, uploadDir, 'overwrite');
  }

  const final = await waitForImportJobFinished(phase1.job_id);
  console.log('Hoàn tất:', {
    job_id: final.id,
    status: final.status,
    success_rows: final.success_rows,
    error_rows: final.error_rows,
    conflict_rows: final.conflict_rows,
    finished_at: final.finished_at,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
