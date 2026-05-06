import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Usage: npx ts-node scripts/testImport.ts ./path/to/file.xlsx');
    process.exit(1);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), path.basename(filePath));

  const importUrl = `${BASE}/api/v1/master-data/import`;
  const res = await fetch(importUrl, {
    method: 'POST',
    // node-fetch + form-data
    body: form as unknown as import('node-fetch').RequestInit['body'],
    headers: form.getHeaders() as import('node-fetch').HeadersInit,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('Import failed', res.status, text);
    process.exit(1);
  }

  const body = JSON.parse(text) as { job_id: number; status: string };
  console.log('job_id:', body.job_id, 'status:', body.status);

  const statusUrl = `${BASE}/api/v1/master-data/import/${body.job_id}/status`;

  for (;;) {
    await sleep(2000);
    const s = await fetch(statusUrl);
    const stext = await s.text();
    if (!s.ok) {
      console.error('Status failed', s.status, stext);
      process.exit(1);
    }
    const j = JSON.parse(stext) as { status: string; success_rows?: number; error_rows?: number };
    console.log('poll:', j.status, j);
    if (
      j.status === 'done' ||
      j.status === 'partial_error' ||
      j.status === 'failed'
    ) {
      break;
    }
    if (j.status === 'awaiting_conflict_resolution') {
      console.log('Cần POST resolve-conflicts (overwrite|skip) trước khi import chạy tiếp.');
      break;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
