import { z } from "zod";

// User Registration Validation
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must contain at least 3 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .max(255, "Email cannot exceed 255 characters"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Login Validation (Admin & User)
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Forgot Password - Request OTP Validation
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Verify OTP Validation
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// Reset Password Validation
export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required").optional(),
    resetToken: z.string().trim().min(1, "Reset token is required").optional(),
    email: z.string().trim().email("Please enter a valid email address").optional(),

    newPassword: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string().min(1, "Please confirm your password").optional(),
  })
  .refine(
    (data) => Boolean(data.token || data.resetToken),
    {
      message: "Reset token is required",
      path: ["token"],
    }
  )
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
