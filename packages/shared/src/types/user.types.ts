import { z } from 'zod';

/**
 * User entity type
 */
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User without sensitive fields
 */
export type UserSafe = Omit<User, 'password'>;

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export type LoginDto = z.infer<typeof loginSchema>;

/**
 * Auth response
 */
export interface AuthResponse {
  user: UserSafe;
  accessToken: string;
}

/**
 * JWT payload
 */
export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
