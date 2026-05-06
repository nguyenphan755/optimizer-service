import { z } from 'zod';

export const loginBodySchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(500),
});

export const passwordChangeBodySchema = z.object({
  current_password: z.string().min(1).max(500),
  new_password: z.string().min(8).max(500),
});

/** Admin tạo user MES (không đăng ký công khai). */
export const mesUserCreateBodySchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(8).max(500),
  role: z.enum(['admin', 'user']).optional().default('user'),
  plant_code: z.union([z.string().min(1).max(20), z.literal('')]).optional(),
  display_name: z.union([z.string().max(150), z.literal('')]).optional(),
});

/** Admin unlock user cần xác thực lớp 2 bằng mật khẩu admin hiện tại. */
export const mesUserUnlockBodySchema = z.object({
  admin_password: z.string().min(1).max(500),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type PasswordChangeBody = z.infer<typeof passwordChangeBodySchema>;
export type MesUserCreateBody = z.infer<typeof mesUserCreateBodySchema>;
export type MesUserUnlockBody = z.infer<typeof mesUserUnlockBodySchema>;
