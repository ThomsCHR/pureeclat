import type { Request, Response, NextFunction } from "express";
import { prisma } from "../src/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Resend } from "resend";
import { AppError } from "../middleware/errorMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "1h";

console.log("RESEND_API_KEY loaded:", process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

function createToken(payload: { userId: number; role: string; isAdmin?: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      throw new AppError(400, "Tous les champs obligatoires ne sont pas remplis.");
    }

    if (!validator.isEmail(email)) throw new AppError(400, "Adresse e-mail invalide.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Un compte existe déjà avec cette adresse e-mail.");

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: { firstName, lastName, email, phone, passwordHash, role: "CLIENT", isActive: true },
    });

    try {
      const { data, error } = await resend.emails.send({
        from: "PureÉclat <onboarding@resend.dev>",
        to: [user.email],
        subject: "Bienvenue chez PureÉclat",
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#0f172a;">
            <h1 style="font-size:20px; margin-bottom:8px;">Bonjour ${user.firstName ?? ""} 👋</h1>
            <p style="font-size:14px; line-height:1.5;">
              Merci d'avoir créé votre compte chez <strong>PureÉclat</strong>.<br/>
              Vous pouvez dès maintenant réserver vos soins en ligne depuis votre espace client.
            </p>
            <p style="font-size:13px; margin-top:16px; color:#64748b;">
              À très bientôt,<br/>
              L'équipe PureÉclat
            </p>
          </div>
        `,
      });

      console.log("Resend email data:", data);
      console.log("Resend email error:", error);

      if (error) console.error("Erreur Resend:", error);
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email de bienvenue:", err);
    }

    const token = createToken({ userId: user.id, role: user.role, isAdmin: user.isAdmin });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) throw new AppError(400, "Email et mot de passe sont requis.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError(401, "Identifiants incorrects ou compte inactif.");

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) throw new AppError(401, "Identifiants incorrects.");

    const token = createToken({ userId: user.id, role: user.role, isAdmin: user.isAdmin });

    return res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return next(error);
  }
}
