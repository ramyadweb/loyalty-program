import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db } from "../../config/db.js";
import { tokenBlacklist } from "../../db/schema.js";
import {
  registerUser,
  loginAdmin,
  loginUser,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetUserPassword,
} from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import { createAuditLog } from "../audit/audit.service.js";

// ─── 1. User Registration ───────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const newUser = await registerUser(validationResult.data);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval.",
      data: newUser,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Email is already registered"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── 2. Admin Login ─────────────────────────────────────────────────────────

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await loginAdmin(validationResult.data);

    // Record LOGIN audit log for successful admin login
    await createAuditLog({
      userId: result.user.id,
      actorId: result.user.id,
      actorEmail: result.user.email,
      activityType: "LOGIN",
      ipAddress: req.ip || null,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";

    if (message.includes("Invalid email or password")) {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (message.includes("Access denied") || message.includes("inactive or blocked")) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    console.error("Admin Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── 3. User Login ──────────────────────────────────────────────────────────

export const userLogin = async (req: Request, res: Response) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await loginUser(validationResult.data);

    // Record LOGIN audit log for successful user login
    await createAuditLog({
      userId: result.user.id,
      actorId: result.user.id,
      actorEmail: result.user.email,
      activityType: "LOGIN",
      ipAddress: req.ip || null,
    });

    return res.status(200).json({
      success: true,
      message: "User login successful",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";

    if (message.includes("Invalid email or password")) {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (
      message.includes("awaiting admin approval") ||
      message.includes("rejected") ||
      message.includes("deactivated or blocked") ||
      message.includes("Access denied")
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    console.error("User Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── 4. Forgot Password (Request OTP) ───────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await requestPasswordReset(validationResult.data);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset request failed.";

    if (message.includes("No account found")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Password reset request failed.",
    });
  }
};

// ─── 5. Verify OTP ──────────────────────────────────────────────────────────

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const validationResult = verifyOtpSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await verifyPasswordResetOtp(validationResult.data);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Use the reset token to complete your password reset.",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTP verification failed.";

    if (message.includes("Too many failed attempts")) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    if (message.includes("Invalid OTP") || message.includes("expired") || message.includes("No pending OTP")) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── 6. Reset Password ──────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await resetUserPassword(validationResult.data);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed.";

    if (
      message.includes("Invalid") ||
      message.includes("expired") ||
      message.includes("required") ||
      message.includes("match")
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message.includes("User account not found") || message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── 7. Authenticated User Profile (Token Verification) ─────────────────────

export const getMe = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated profile retrieved successfully",
    data: {
      user: req.user,
    },
  });
};

// ─── 8. Logout ──────────────────────────────────────────────────────────────


export const logout = async (req: Request, res: Response) => {
  try {
    // Step 1: Check authenticated user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to log out.",
      });
    }

    // Step 2: Extract Bearer token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing.",
      });
    }

    // Step 3: Decode token to get expiration time
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded || !decoded.exp) {
      return res.status(400).json({
        success: false,
        message: "Invalid token expiration.",
      });
    }

    // Step 4: Generate SHA-256 hash
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    // Step 5: Calculate token expiration date
    const expiresAt = new Date(decoded.exp * 1000);

    // Step 6: Save token hash in PostgreSQL
    await db.insert(tokenBlacklist).values({
      userId: req.user.id,
      tokenHash,
      expiresAt,
    });

    // Step 7: Create logout audit record
    await createAuditLog({
      userId: req.user.id,
      actorId: req.user.id,
      actorEmail: req.user.email,
      activityType: "LOGOUT",
      ipAddress: req.ip || null,
    });

    // Step 8: Return success response
    return res.status(200).json({
      success: true,
      message: "Logout successful. Token invalidated.",
    });

  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error during logout.",
    });
  }
};
