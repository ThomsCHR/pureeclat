import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client"; // ✅ utilise l'enum Prisma

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

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
      role: UserRole; // ✅ typé Prisma
      isAdmin?: boolean;
    };

    const role = decoded.role;

    req.user = {
      id: decoded.userId,
      role,
      // un admin = ADMIN ou SUPERADMIN ou un flag isAdmin reçu
      isAdmin:
        role === UserRole.ADMIN ||
        role === UserRole.SUPERADMIN ||
        !!decoded.isAdmin,

      // superadmin uniquement si SUPERADMIN
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
