
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";

import type { JwtUserPayload } from "../modules/auth/auth.types.js";
import { db } from "../config/db.js";
import { tokenBlacklist } from "../db/schema.js";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required. Format: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  const secret =
    process.env.JWT_SECRET || "loyalty_super_secret_jwt_key_2026";

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing.",
    });
  }

  // Step 1: Verify JWT
  let decoded: JwtUserPayload;

  try {
    decoded = jwt.verify(token, secret) as JwtUserPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or malformed token.",
    });
  }

  // Step 2: Generate SHA-256 token hash
  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  // Step 3: Check whether token is blacklisted
  try {
    const [blacklistedToken] = await db
      .select({ id: tokenBlacklist.id })
      .from(tokenBlacklist)
      .where(eq(tokenBlacklist.tokenHash, tokenHash))
      .limit(1);

    if (blacklistedToken) {
      return res.status(401).json({
        success: false,
        message: "You have logged out. Please log in again.",
      });
    }

    // Step 4: Allow authenticated request
    req.user = decoded;

    return next();
  } catch (error) {
    console.error("Token blacklist verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication token.",
    });
  }
};
