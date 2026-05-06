---
name: deploy-production-windows-pm2
description: Quy trình deploy production Windows 11 + PM2 cho app MES gồm backend Express và frontend Vite build static. Use when user asks deploy, restart service, PM2 production, rebuild app, hoặc vận hành localhost:3002 và localhost:5100.
---

# Deploy Production Windows + PM2

## Mục tiêu

- Chạy ổn định app production trên Windows bằng PM2.
- Tách 2 process:
  - API backend: `mes-cadivi` (port `3002`)
  - UI static: `app-truy-van-ui` (port `5100`)

## Cấu hình chuẩn hiện tại (theo cây thư mục mới)

- Backend env: `backend/.env`
  - `PORT=3002`
- Frontend env prod: `frontend/.env.production`
  - `VITE_API_BASE_URL=http://localhost:3002`
- Database migration scripts: `database/scripts/*.ts` (gọi qua script trong `backend/package.json`)

## Quy trình deploy đầy đủ

```bash
# 0) Vào root repo
cd App-truy-van-BTP-TP

# 1) Cài dependencies
npm --prefix backend install
npm --prefix frontend install

# 2) Build production
npm --prefix backend run build
npm --prefix frontend run build

# 3) Migrate DB (khuyến nghị trước khi start app)
npm --prefix backend run migrate
# (tuỳ chọn nếu DB mới)
# npm --prefix backend run seed:mes-admin

# 4) Start/restart PM2 từ root repo
pm2 delete mes-cadivi app-truy-van-ui
pm2 start backend/dist/src/app.js --name mes-cadivi --cwd backend --update-env
pm2 serve frontend/dist 5100 --name app-truy-van-ui --spa
pm2 save
pm2 status
```

## Lệnh vận hành hằng ngày

```bash
pm2 status
pm2 logs mes-cadivi --lines 100
pm2 logs app-truy-van-ui --lines 100
pm2 restart mes-cadivi
pm2 restart app-truy-van-ui
pm2 restart all
pm2 save
```

## Checklist verify sau deploy

- API health: `http://localhost:3002/health` -> `{"ok":true}`
- UI mở được: `http://localhost:5100`
- Login thành công và vào được màn dashboard
- Gọi API `/api/v1/auth/me` trả JSON đúng (không trả HTML)

## Sự cố thường gặp và cách xử lý

- `EADDRINUSE ... :3002`
  - Đã có process chiếm cổng, cần kill PID rồi restart PM2.
- PM2 báo `SyntaxError` với `npm.cmd`
  - Không start qua `npm.cmd` trên Windows kiểu sai.
  - Luôn start backend trực tiếp từ `dist/src/app.js`.
- Login được nhưng không vào app
  - Kiểm tra `VITE_API_BASE_URL` trong `.env.production` và build lại frontend.
- Frontend gọi API lỗi `ECONNREFUSED 127.0.0.1:3002`
  - Backend chưa lên hoặc PM2 process `mes-cadivi` lỗi.
  - Kiểm tra bằng:
    - `pm2 logs mes-cadivi --lines 200`
    - `http://localhost:3002/health`
- Migrate lỗi kết nối DB
  - Kiểm tra `backend/.env` (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD).
  - Nếu dùng docker local DB: `docker compose up -d`.

## Kết hợp với skill bảo mật

- Khi deploy production, luôn chạy cùng skill:
  - `bao-mat-he-thong-du-lieu`
- Đảm bảo:
  - `JWT_SECRET` và `JWT_REFRESH_SECRET` mạnh (>=32 ký tự, khác nhau)
  - migration lockout đã áp dụng (`db:migrate-009`)
  - policy khóa tài khoản và admin unlock lớp 2 hoạt động đúng.
 