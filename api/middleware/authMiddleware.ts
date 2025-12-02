import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
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
      role: string;
    };

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    console.error("JWT error:", error);
    return res
      .status(401)
      .json({ message: "Token d'authentification invalide ou expiré." });
  }
}

// Option : middleware pour restreindre à un rôle
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Accès réservé à l'administrateur." });
  }

  return next();
}
