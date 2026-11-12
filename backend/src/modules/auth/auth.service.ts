import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and, or, desc } from "drizzle-orm";

import { db } from "../../config/db.js";
import { users, passwordResets } from "../../db/schema.js";
import { sendPasswordResetEmail, sendOtpEmail } from "../../config/mail.js";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
} from "./auth.validation.js";
import type { JwtUserPayload } from "./auth.types.js";

const getJwtSecret = () =>
  process.env.JWT_SECRET || "loyalty_super_secret_jwt_key_2026_finance_rewards";

const getJwtExpiry = () => process.env.JWT_EXPIRY || "7d";

// ─── 1. User Registration ───────────────────────────────────────────────────

export const registerUser = async (data: RegisterInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Check whether email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email is already registered");
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 3. Insert new user into database with role "user" and status "pending"
  const [newUser] = await db
    .insert(users)
    .values({
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      status: "pending",
      isActive: true,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    });

  return newUser;
};

// ─── 2. Admin Login ─────────────────────────────────────────────────────────

export const loginAdmin = async (data: LoginInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Check whether account exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // 2. Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password.");
  }

  // 3. Verify admin role
  if (user.role !== "admin") {
    throw new Error("Access denied. Only administrators can sign in through this portal.");
  }

  // 4. Verify account is active and not blocked
  if (!user.isActive || user.status === "blocked") {
    throw new Error("Administrator account is inactive or blocked. Please contact system support.");
  }

  // 5. Generate JWT token
  const payload: JwtUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const token = jwt.sign(
    payload as object,
    getJwtSecret() as jwt.Secret,
    {
      expiresIn: getJwtExpiry(),
    } as jwt.SignOptions
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    token,
  };
};

// ─── 3. User Login ──────────────────────────────────────────────────────────

export const loginUser = async (data: LoginInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Check whether account exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // 2. Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password.");
  }

  // 3. Verify user role
  if (user.role !== "user") {
    throw new Error("Access denied. Please use the administrative login portal.");
  }

  // 4. Check approval status
  if (user.status === "pending") {
    throw new Error("Your account is awaiting admin approval.");
  }

  if (user.status === "rejected") {
    throw new Error("Your account registration has been rejected. Please contact support.");
  }

  if (user.status === "blocked" || !user.isActive) {
    throw new Error("Your account has been deactivated or blocked. Please contact support.");
  }

  // 5. Generate JWT token for approved user
  const payload: JwtUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const token = jwt.sign(
    payload as object,
    getJwtSecret() as jwt.Secret,
    {
      expiresIn: getJwtExpiry(),
    } as jwt.SignOptions
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    token,
  };
};

// ─── 4. Request Password Reset (Send Email with Reset Link) ───────────────────

export const requestPasswordReset = async (data: ForgotPasswordInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Generic message prevents account enumeration
  const genericSuccessMessage =
    "If your email address is registered with us, a password reset link has been sent to your inbox.";

  // 1. Check whether user account exists
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    // Return generic message without revealing that the user doesn't exist
    return {
      message: genericSuccessMessage,
    };
  }

  // 2. Invalidate previous pending reset requests for this email
  await db
    .delete(passwordResets)
    .where(eq(passwordResets.email, normalizedEmail));

  // 3. Generate a secure, 32-byte cryptographic random token (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString("hex");

  // 4. Hash the token using SHA-256 for secure database storage
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 5. Set expiration time to 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // 6. Store hashed token in PostgreSQL
  await db.insert(passwordResets).values({
    email: normalizedEmail,
    otpHash: tokenHash, // satisfies existing NOT NULL constraint
    resetToken: tokenHash,
    isVerified: false,
    attempts: 0,
    expiresAt,
  });

  // 7. Construct password reset URL pointing to the React frontend
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  // 8. Send password reset email via Nodemailer & Gmail SMTP
  const emailSent = await sendPasswordResetEmail(
    normalizedEmail,
    resetLink,
    user.name
  );

  if (!emailSent) {
    throw new Error("Failed to send password reset email.");
  }

  return {
    message: genericSuccessMessage,
  };
};

// ─── 5. Verify OTP ──────────────────────────────────────────────────────────

export const verifyPasswordResetOtp = async (data: VerifyOtpInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Fetch latest pending OTP record for this email
  const [record] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.email, normalizedEmail),
        eq(passwordResets.isVerified, false)
      )
    )
    .orderBy(desc(passwordResets.createdAt))
    .limit(1);

  if (!record) {
    throw new Error("No pending OTP request found for this email. Please request a new OTP.");
  }

  // 2. Check expiration
  if (new Date() > record.expiresAt) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  // 3. Brute-force protection: check attempt count
  if (record.attempts >= 5) {
    await db.delete(passwordResets).where(eq(passwordResets.id, record.id));
    throw new Error("Too many failed attempts. This OTP has been invalidated. Please request a new one.");
  }

  // 4. Compare OTP against stored hash
  const isMatch = await bcrypt.compare(data.otp, record.otpHash);

  if (!isMatch) {
    // Increment attempts
    await db
      .update(passwordResets)
      .set({ attempts: record.attempts + 1 })
      .where(eq(passwordResets.id, record.id));

    const remaining = 4 - record.attempts;
    throw new Error(
      remaining > 0
        ? `Invalid OTP. You have ${remaining} attempt(s) remaining.`
        : "Invalid OTP. Maximum attempts reached."
    );
  }

  // 5. Generate secure random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 6. Mark OTP as verified and store resetToken
  await db
    .update(passwordResets)
    .set({
      isVerified: true,
      resetToken,
      attempts: 0,
    })
    .where(eq(passwordResets.id, record.id));

  return {
    resetToken,
  };
};

// ─── 6. Reset Password ──────────────────────────────────────────────────────

export const resetUserPassword = async (data: ResetPasswordInput) => {
  const rawToken = (data.token || data.resetToken)?.trim();

  if (!rawToken) {
    throw new Error("Reset token is required.");
  }

  // 1. Hash the incoming token with SHA-256 to compare with stored hash
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 2. Query reset record by hashed token (or raw token for backward compatibility)
  const [record] = await db
    .select()
    .from(passwordResets)
    .where(
      or(
        eq(passwordResets.resetToken, tokenHash),
        eq(passwordResets.resetToken, rawToken)
      )
    )
    .orderBy(desc(passwordResets.createdAt))
    .limit(1);

  if (!record) {
    throw new Error("Invalid or expired password reset link. Please request a new one.");
  }

  // 3. Check if the reset window has expired
  if (new Date() > record.expiresAt) {
    await db.delete(passwordResets).where(eq(passwordResets.id, record.id));
    throw new Error("Password reset link has expired. Please request a new one.");
  }

  // 4. Find the matching user in PostgreSQL
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, record.email))
    .limit(1);

  if (!user) {
    throw new Error("User account associated with this token was not found.");
  }

  // 5. Hash new password using bcrypt
  const newHashedPassword = await bcrypt.hash(data.newPassword, 10);

  // 6. Update user password in PostgreSQL
  await db
    .update(users)
    .set({
      password: newHashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // 7. Invalidate reset token immediately (single-use)
  await db
    .delete(passwordResets)
    .where(eq(passwordResets.email, record.email));

  return {
    message: "Password has been reset successfully. You can now log in with your new password.",
  };
};
