import { Request, Response, NextFunction } from 'express';

/**
 * Không gửi stack trace cho client. Production chỉ message chung.
 */
export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ message });
}
