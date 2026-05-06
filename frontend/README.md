# App truy vấn TOC DO

Bundle UI (Figma) + API thật. Figma: https://www.figma.com/design/WSWLVWBoKHgjvsoHWFtgjO/App-truy-van-TOC-DO

## Backend & PostgreSQL

Mã nguồn API nằm trong **`integrated/Capacity-Lookup-System-main`** và đã được **đồng bộ từ** thư mục backend CADIVI (`App truy van toc do BTP TP CADIVI`) — cùng schema, script migrate, `db/`, v.v.

- **Kết nối Postgres:** backend dùng `pg` với biến trong file **`.env`** (đã copy từ bản CADIVI; file này **không** commit). Trùng `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` với máy bạn đang chạy OK — **cùng `DB_NAME` nghĩa là kế thừa toàn bộ dữ liệu** đã có trong Postgres đó (không tách DB mới trừ khi bạn chủ đích).
- API lắng nghe **`PORT`** trong `integrated/.../.env` (hiện tại thường **3002**). UI: file **`.env`** ở thư mục app này có `VITE_API_PORT` — proxy `/api` → `http://127.0.0.1:${VITE_API_PORT}`.

### Đồng bộ lại sau khi sửa backend CADIVI

Từ thư mục gốc `Apptruyvantocdo-main` (có `package.json` workspace):

```powershell
npm run sync:backend
```

Script chạy `scripts/sync-backend-from-cadivi.ps1` (robocopy + copy `.env`). Sau đó cần **merge lại** `src/routes/resistance.ts` nếu route `POST /resistance/import` bị ghi đè — hiện repo đã giữ route import Excel điện trở.

## Chạy full-stack (dev)

**Cách 1 — một lệnh (API + UI):**

```bash
npm run dev:all
```

**Cách 2 — hai terminal:**

1. `npm run dev:api` — backend (thư mục `integrated/Capacity-Lookup-System-main`, cổng trong `.env`).
2. `npm run dev` — frontend Vite (cổng 5100 hoặc 5101 nếu bận).

Chi tiết route ↔ API: xem `FIGMA_API_MAPPING.md`.

## Production (Nginx + build)

- `npm run build` — bundle tối ưu (Terser, không sourcemap, bỏ `console`/`debugger`). Biến an toàn cho client: chỉ `VITE_*` trong `.env.production` (không secret).
- `nginx.conf` (cùng thư mục app): static `dist/` + proxy `/api/` → Express; security headers.
- Backend: `npm run db:migrate-007`, `NODE_ENV=production`, `JWT_SECRET` + `JWT_REFRESH_SECRET` (mỗi secret ≥ 32 ký tự, khác nhau), `CORS_ORIGIN` trùng origin UI.
