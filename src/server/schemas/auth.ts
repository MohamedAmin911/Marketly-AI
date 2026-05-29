import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  remember: z.boolean().optional().default(true),
});

export const signupRequestSchema = z.object({
  company: z.string().trim().min(2).max(120),
  email: z.string().email().max(254).toLowerCase(),
  name: z.string().trim().min(2).max(140),
  password: z.string().min(10).max(128).regex(/[a-z]/, "Password must include a lowercase letter.").regex(/[A-Z]/, "Password must include an uppercase letter.").regex(/[0-9]/, "Password must include a number."),
  remember: z.boolean().optional().default(true),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
});

export const resetPasswordRequestSchema = z.object({
  password: z.string().min(10).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
  token: z.string().min(32).max(256),
});

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(32).optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
