-- PostgreSQL least-privilege role for CADIVI MES app (chạy tay bởi DBA)
-- Đổi mật khẩu và tên database theo môi trường.
--
-- Sau đó backend dùng DATABASE_URL hoặc DB_USER=cadivi_app (không dùng superuser).

-- CREATE USER cadivi_app WITH PASSWORD 'strong_random_password';
-- GRANT CONNECT ON DATABASE your_database_name TO cadivi_app;
-- GRANT USAGE ON SCHEMA public TO cadivi_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cadivi_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cadivi_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cadivi_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cadivi_app;

-- Không cấp quyền trên catalog nhạy cảm (superuser tự có; role app không cần đọc pg_shadow).
