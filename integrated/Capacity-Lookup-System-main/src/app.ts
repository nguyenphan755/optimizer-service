import * as dotenv from 'dotenv';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { masterDataRouter } from './routes/masterData';
import { searchRouter } from './routes/search';
import { capabilityLegacyRouter } from './routes/capabilityLegacy';
import { missingDataRouter } from './routes/missingData';
import { resistanceRouter } from './routes/resistance';
import { dashboardRouter } from './routes/dashboard';
import { importJobsRouter } from './routes/importJobs';
import { authRouter } from './routes/auth';
import { mesUsersRouter } from './routes/mesUsers';
import { optionalMesAuth } from './middleware/authJwt';
import { auditLogMiddleware } from './middleware/auditLog';
import { errorHandlerMiddleware } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

/** CSP do Nginx phục vụ static; API chỉ JSON — tránh CSP chặt gây lỗi không cần thiết. */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

function getCorsOrigin(): boolean | string | string[] {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') {
    return true;
  }
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5100';
  if (corsOrigin.includes(',')) {
    return corsOrigin.split(',').map((o) => o.trim());
  }
  return corsOrigin;
}

app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(cookieParser());
app.use(optionalMesAuth);
app.use(express.json({ limit: '4mb' }));
app.use(auditLogMiddleware);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>MES CADIVI API</title></head>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;line-height:1.5">
<p>Đây là <strong>API backend</strong> (Express), không phải trang tra cứu.</p>
<p><strong>Giao diện web:</strong> build Vite + Nginx (xem <code>Apptruyvantocdo-main/nginx.conf</code>).</p>
<p>Kiểm tra API: <a href="/health">/health</a></p>
</body></html>`);
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

app.use('/api/', apiLimiter);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', mesUsersRouter);
app.use('/api/v1/master-data', masterDataRouter);
app.use('/api/v1/master-data', capabilityLegacyRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/missing-data', missingDataRouter);
app.use('/api/v1/resistance', resistanceRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/import-jobs', importJobsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandlerMiddleware);

app.listen(PORT, HOST, () => {
  const viaTailscale =
    HOST === '0.0.0.0'
      ? ' (có thể truy cập qua IP Tailscale/LAN trên cổng này)'
      : '';
  console.log(`MES CADIVI API listening on http://${HOST}:${PORT}${viaTailscale}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`  CORS:   development → cho phép mọi origin (credentials cho refresh cookie)`);
  }
});
