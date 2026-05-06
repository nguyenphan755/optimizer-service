import { Router } from 'express';
import { getPool } from '../db/client';
import {
  getDashboardOverview,
  getMachinesByProcess,
  getCoverageByProcess,
  getPlantSummaries,
  getSpeedComparisonByProcess,
  getScatterCapabilityPoints,
  getParetoMissingByPlant,
  getTopMaterialsByActualSpeed,
  findPlantByQuery,
  getPlantDetailKpis,
  getPlantCoverageByProcess,
  getPlantTopMachines,
  getPlantMachinesAggregated,
  getPlantMissingMaterialSamples,
  getMachineActiveByPlant,
  getPlantAvgSpeeds,
} from '../db/queries/dashboardStats';

export const dashboardRouter = Router();

/** GET /api/v1/dashboard/plant-detail?plant=Đà+Nẵng|DN|Cadivi+Đà+Nẵng */
dashboardRouter.get('/plant-detail', async (req, res, next) => {
  try {
    const plantQ = String(req.query.plant ?? '').trim();
    if (!plantQ) {
      res.status(400).json({ error: 'Thiếu tham số plant', code: 'VALIDATION_ERROR' });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const pl = await findPlantByQuery(client, plantQ);
      if (!pl) {
        res.status(404).json({ error: 'Không tìm thấy nhà máy', code: 'NOT_FOUND' });
        return;
      }
      const kpis = await getPlantDetailKpis(client, pl.id);
      const totalMat = Math.max(1, kpis.total_materials);
      const materialsMissing = Math.max(0, totalMat - kpis.materials_with_data);
      const coveragePercent = Math.min(100, Math.round((100 * kpis.materials_with_data) / totalMat));

      const covProc = await getPlantCoverageByProcess(client, pl.id);
      const topMach = await getPlantTopMachines(client, pl.id, 10);
      const aggs = await getPlantMachinesAggregated(client, pl.id);
      const missingSamples = await getPlantMissingMaterialSamples(client, pl.id, 40);

      const machinesByProcess: Record<
        string,
        Array<{
          machine: string;
          designSpeed: number;
          actualSpeed: number;
          efficiency: number;
          outputKm: number;
          outputKg: number;
          materialCount: number;
          status: 'complete' | 'missing';
        }>
      > = {};

      for (const row of aggs) {
        if (!machinesByProcess[row.process_name]) {
          machinesByProcess[row.process_name] = [];
        }
        const eff =
          row.avg_design > 0 ? Math.min(100, Math.round((100 * row.avg_actual) / row.avg_design)) : 0;
        const complete =
          row.material_count > 0 && row.avg_design > 0 && row.avg_actual > 0;
        machinesByProcess[row.process_name].push({
          machine: row.machine_type,
          designSpeed: Math.round(row.avg_design * 100) / 100,
          actualSpeed: Math.round(row.avg_actual * 100) / 100,
          efficiency: eff,
          outputKm: Math.round(row.avg_out_km * 100) / 100,
          outputKg: Math.round(row.avg_out_kg * 100) / 100,
          materialCount: row.material_count,
          status: complete ? 'complete' : 'missing',
        });
      }

      res.json({
        plant: { code: pl.code, name: pl.name },
        total_materials: kpis.total_materials,
        materials_with_data: kpis.materials_with_data,
        materials_missing: materialsMissing,
        coverage_percent: coveragePercent,
        machine_count: kpis.machine_count,
        process_count: kpis.process_count,
        coverage_by_process: covProc.map((c) => ({
          process: c.process_name,
          coverage: c.coverage_percent,
        })),
        top_machines: topMach.map((t) => ({
          machine: t.machine_type,
          actualSpeed: Math.round(t.actual_speed * 100) / 100,
          process: t.process_name,
        })),
        machines_by_process: machinesByProcess,
        missing_materials: missingSamples.map((m) => ({
          code: m.material_code,
          process: m.process_name,
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /api/v1/dashboard/capacity-report — KPI + biểu đồ báo cáo năng lực (Postgres) */
dashboardRouter.get('/capacity-report', async (_req, res, next) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const overview = await getDashboardOverview(client);
      const plantSummaries = await getPlantSummaries(client);
      const machineAct = await getMachineActiveByPlant(client);
      const speedByPlant = await getPlantAvgSpeeds(client);

      const totalMat = Math.max(1, overview.total_materials);

      const machineByPlant = machineAct.map((m) => {
        const inactive = Math.max(0, m.total - m.with_data);
        return {
          plant: m.plant_name,
          machines: m.total,
          active: m.with_data,
          inactive,
        };
      });

      const speedRows = speedByPlant.map((s) => {
        const util =
          s.avg_design > 0 ? Math.min(100, Math.round((100 * s.avg_actual) / s.avg_design)) : 0;
        return {
          plant: s.plant_name,
          design: Math.round(s.avg_design * 10) / 10,
          actual: Math.round(s.avg_actual * 10) / 10,
          utilization: util,
          max_actual: Math.round(s.max_actual * 10) / 10,
          max_output_km: Math.round(s.max_output_km * 100) / 100,
          max_output_kg: Math.round(s.max_output_kg * 100) / 100,
        };
      });

      const missingByPlant = plantSummaries.map((p) => {
        const missing = Math.max(0, totalMat - p.materials_with_data);
        const pct = Math.round((10000 * missing) / totalMat) / 100;
        return {
          plant: p.plant_name,
          missing,
          total: totalMat,
          percentage: pct,
        };
      });

      const totalActive = machineAct.reduce((s, x) => s + x.with_data, 0);
      const totalInactive = machineAct.reduce((s, x) => s + Math.max(0, x.total - x.with_data), 0);
      const avgUtil =
        speedRows.length > 0
          ? Math.round(speedRows.reduce((s, x) => s + x.utilization, 0) / speedRows.length)
          : 0;
      const sumDesign = speedRows.reduce((s, x) => s + x.design, 0);
      const sumActual = speedRows.reduce((s, x) => s + x.actual, 0);

      res.json({
        kpis: {
          total_machines: overview.total_machines,
          machines_with_capability_rows: totalActive,
          machines_without_capabilities: totalInactive,
          avg_design_speed_sum_by_plant: Math.round(sumDesign * 10) / 10,
          avg_actual_speed_sum_by_plant: Math.round(sumActual * 10) / 10,
          avg_utilization_percent: avgUtil,
          total_capability_rows: plantSummaries.reduce((s, p) => s + p.capability_rows, 0),
        },
        machine_by_plant: machineByPlant,
        speed_by_plant: speedRows,
        missing_by_plant: missingByPlant,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /api/v1/dashboard/overview */
dashboardRouter.get('/overview', async (_req, res, next) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const overview = await getDashboardOverview(client);
      const machinesByProcess = await getMachinesByProcess(client);
      const coverageByProcess = await getCoverageByProcess(client);
      const plantSummaries = await getPlantSummaries(client);
      const speedComparison = await getSpeedComparisonByProcess(client);
      const scatterPoints = await getScatterCapabilityPoints(client, 2000);
      const paretoRows = await getParetoMissingByPlant(client);
      const topMaterials = await getTopMaterialsByActualSpeed(client, 20);

      const materialsMissing = Math.max(
        0,
        overview.total_materials - overview.materials_with_capability
      );

      const totalMat = Math.max(1, overview.total_materials);
      const paretoTotal = paretoRows.reduce((s, x) => s + x.count, 0);
      let cum = 0;
      const pareto_by_plant = paretoRows.map((p) => {
        cum += p.count;
        return {
          plant: p.plant_name,
          count: p.count,
          cumulative:
            paretoTotal > 0 ? Math.round((100 * cum) / paretoTotal) : 0,
        };
      });

      res.json({
        kpis: {
          total_materials: overview.total_materials,
          materials_with_capability: overview.materials_with_capability,
          materials_complete: overview.materials_complete,
          materials_missing: materialsMissing,
          total_machines: overview.total_machines,
          missing_reports: overview.missing_reports,
          import_jobs_active: overview.import_jobs_active,
        },
        machines_by_process: machinesByProcess.map((r) => ({
          process: r.process_name,
          process_code: r.process_code,
          count: r.machine_count,
        })),
        coverage_by_process: coverageByProcess.map((c) => ({
          process: c.process_name,
          process_code: c.process_code,
          total: c.total_materials,
          has_data: c.with_data,
          missing: Math.max(0, c.total_materials - c.with_data),
        })),
        plant_summaries: plantSummaries.map((p) => ({
          plant: p.plant_name,
          plant_code: p.plant_code,
          machines: p.machine_count,
          capability_rows: p.capability_rows,
          materials_with_data: p.materials_with_data,
          coverage_percent: Math.min(
            100,
            Math.round((100 * p.materials_with_data) / totalMat)
          ),
          process_count: p.process_count,
        })),
        speed_comparison: speedComparison.map((s) => ({
          process: s.process_name,
          avg_design: s.avg_design,
          avg_actual: s.avg_actual,
        })),
        scatter_points: scatterPoints.map((s) => ({
          plant: s.plant_name,
          process: s.process_name,
          process_code: s.process_code,
          design: s.design_speed,
          actual: s.actual_speed,
          material_code: s.material_code,
        })),
        pareto_by_plant,
        top_materials: topMaterials.map((t) => ({
          code: t.material_code,
          description: t.material_description,
          process: t.process_name,
          plant: t.plant_name,
          machine: t.machine_type,
          design_speed: t.design_speed,
          actual_speed: t.actual_speed,
          output_km: t.output_km,
          status: t.status,
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});
