import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthUser {
  id: number;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

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

    const role = decoded.role;

    req.user = {
      id: decoded.userId,
      role,
      isAdmin:
        role === UserRole.ADMIN ||
        role === UserRole.SUPERADMIN ||
        !!decoded.isAdmin,
      isSuperAdmin: role === UserRole.SUPERADMIN,
    };

    return next();
  } catch (error) {
    console.error("JWT error:", error);
    return res
      .status(401)
      .json({ message: "Token invalide ou expiré." });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || (!req.user.isAdmin && req.user.role !== UserRole.ADMIN)) {
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
  if (!req.user || req.user.role !== UserRole.SUPERADMIN) {
    return res
      .status(403)
      .json({ message: "Accès réservé au SUPERADMIN." });
  }
  return next();
}
