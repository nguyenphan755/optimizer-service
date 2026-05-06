# Figma ↔ Route ↔ Component ↔ API

**Figma (Phase 1–5):** [App truy vấn TOC DO](https://www.figma.com/design/WSWLVWBoKHgjvsoHWFtgjO/App-truy-van-TOC-DO)

**Chạy full-stack (development):**

1. Backend (PostgreSQL đã cấu hình trong `.env` của backend):  
   `cd integrated/Capacity-Lookup-System-main` → `npm install` → `npm run dev` (cổng trong `.env` backend, ví dụ **3002**).
2. Frontend (Vite):  
   `cd Apptruyvantocdo-main` (thư mục chứa `package.json` của UI) → `npm install` → `npm run dev` (**http://localhost:5100**).  
   Proxy Vite: `/api` → `http://127.0.0.1:${VITE_API_PORT}` (mặc định **3002**, file `.env` ở root app Figma).

**Biến môi trường (tuỳ chọn):** `VITE_API_BASE_URL` — để trống khi dùng proxy; set URL đầy đủ nếu build tĩnh gọi API host khác.

| Phase / Màn (sidebar `activeScreen`) | Frame Figma (tên gợi ý) | Component chính | API (prefix `/api/v1`) |
|----------------------------------------|------------------------|-------------------|-------------------------|
| Dashboard | Dashboard — Năng lực sản xuất | `DashboardOverviewScreen` | `GET /dashboard/overview` (+ mock charts còn lại từ `dashboard-mock-data`) |
| Phase 1 — Master / Báo cáo | Báo cáo Năng lực | `CapacityReportScreen` | *(chưa nối — chỉ mock)* |
| Phase 1 — Import master | Master Data Setup | `ImportBTPOrdersScreen` | `POST /master-data/import` (multipart `file`), nút **Gửi Excel lên API** |
| Phase 2 — Tra cứu | Tra cứu năng lực / Excel | `MaterialLookupScreen` | `GET /search/autocomplete`, `GET /search/material/:id/capability`, `GET /master-data/capability/lookup`, `POST /search/bulk-capability`, `GET /resistance/for-material/:id` |
| Phase 3 — Missing Data | Missing Data Management | `MissingDataScreen` | `GET /missing-data`, `POST /missing-data` (bảng API + drawer; mock khi API lỗi) |
| Phase 4 — Upload | Plant Data Upload | `PlantUploadScreen` | `POST /master-data/import`, `GET /import-jobs` |
| Phase 4 — Duyệt | Data Approval Dashboard | `ApprovalDashboardScreen` | `GET /import-jobs` (hàng đợi theo job import thật) |

**Hooks (React Query):**

| Hook | File | Mục đích |
|------|------|----------|
| `usePlants`, `useProcessSteps`, `useImportMasterExcel`, `useImportJobStatus` | `src/app/hooks/useMasterData.ts` | Master data + import Excel |
| `useSearchAutocomplete`, `useMaterialCapability`, `useCapabilityLookupByCode` | `src/app/hooks/useCapacity.ts` | Tra cứu năng lực |
| `useMissingDataList`, `useReportMissingCapability` | `src/app/hooks/useMissingData.ts` | Missing data |
| `useImportJobsList` | `src/app/hooks/useUploads.ts` | Lịch sử / hàng đợi import |
| `useDashboardOverview` | `src/app/hooks/useDashboard.ts` | KPI dashboard |

**Backend mở rộng trong repo:** `GET /missing-data`, `GET /dashboard/overview`, `GET /import-jobs` (file `integrated/Capacity-Lookup-System-main`).
