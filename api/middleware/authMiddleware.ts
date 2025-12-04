import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// mêmes valeurs que ton enum Prisma UserRole
export type UserRole = "CLIENT" | "ADMIN" | "ESTHETICIENNE" | "SUPERADMIN";

export interface AuthUser {
  id: number;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// Requête enrichie avec le user
export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token d'authentification manquant." });
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      role: UserRole;
      isAdmin?: boolean;
    };

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      // est admin si role ADMIN / SUPERADMIN ou flag isAdmin = true
      isAdmin:
        decoded.role === "ADMIN" ||
        decoded.role === "SUPERADMIN" ||
        !!decoded.isAdmin,
        isSuperAdmin: decoded.role === "SUPERADMIN",
    };

    return next();
  } catch (error) {
    console.error("JWT error:", error);
    return res
      .status(401)
      .json({ message: "Token d'authentification invalide ou expiré." });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (
    !req.user ||
    !(
      req.user.isAdmin ||
      req.user.role === "ADMIN" ||
      req.user.role === "SUPERADMIN"
    )
  ) {
    return res
      .status(403)
      .json({ message: "Accès réservé à l'administrateur." });
  }

  return next();
}

export function requireSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "SUPERADMIN") {
    return res
      .status(403)
      .json({ message: "Accès réservé au SUPERADMIN." });
  }
  return next();
}
