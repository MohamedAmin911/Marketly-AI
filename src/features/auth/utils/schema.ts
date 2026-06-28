import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Use a valid work email."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean(),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Add your name."),
  company: z.string().min(2, "Add your company name."),
  password: z.string().min(10, "Password must be at least 10 characters.").regex(/[a-z]/, "Add a lowercase letter.").regex(/[A-Z]/, "Add an uppercase letter.").regex(/[0-9]/, "Add a number."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Use a valid work email."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(10, "Password must be at least 10 characters.").regex(/[a-z]/, "Add a lowercase letter.").regex(/[A-Z]/, "Add an uppercase letter.").regex(/[0-9]/, "Add a number."),
  token: z.string().min(32, "Reset token is missing or invalid."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
