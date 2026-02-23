import type { Request, Response, NextFunction, CookieOptions } from "express";
import { prisma } from "../src/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import validator from "validator";
import { Resend } from "resend";
import { AppError } from "../middleware/errorMiddleware";
import type { AuthRequest } from "../middleware/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "1h";
const RESEND_FROM = process.env.RESEND_FROM || "PureÉclat <onboarding@resend.dev>";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const resend = new Resend(process.env.RESEND_API_KEY);

function createToken(payload: { userId: number; role: string; isAdmin?: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 60 * 60 * 1000, // 1 heure
};

function setAuthCookie(res: Response, token: string) {
  res.cookie("authToken", token, COOKIE_OPTIONS);
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
        from: RESEND_FROM,
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
    setAuthCookie(res, token);

    return res.status(201).json({
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
    setAuthCookie(res, token);

    return res.json({
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

export function logout(_req: Request, res: Response) {
  res.clearCookie("authToken", COOKIE_OPTIONS);
  return res.json({ message: "Déconnecté avec succès." });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isAdmin: true,
      },
    });

    if (!user) throw new AppError(404, "Utilisateur introuvable.");

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError(400, "L'adresse e-mail est requise.");

    // Réponse générique pour ne pas révéler si l'email existe
    const genericResponse = res.json({
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
    });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return genericResponse;

    // Supprimer les anciens tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetLink = `${CLIENT_URL}/reinitialisation-mot-de-passe?token=${token}`;

    await resend.emails.send({
      from: RESEND_FROM,
      to: [user.email],
      subject: "Réinitialisation de votre mot de passe — PureÉclat",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#0f172a;">
          <h1 style="font-size:20px; margin-bottom:8px;">Réinitialisation de votre mot de passe</h1>
          <p style="font-size:14px; line-height:1.5;">
            Bonjour ${user.firstName},<br/>
            Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous.
            Ce lien est valable <strong>1 heure</strong>.
          </p>
          <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
            Réinitialiser mon mot de passe
          </a>
          <p style="font-size:12px; color:#64748b;">
            Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.
          </p>
          <p style="font-size:13px; margin-top:16px; color:#64748b;">
            L'équipe PureÉclat
          </p>
        </div>
      `,
    });

    return genericResponse;
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new AppError(400, "Token et nouveau mot de passe requis.");
    if (password.length < 8) throw new AppError(400, "Le mot de passe doit contenir au moins 8 caractères.");

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new AppError(400, "Ce lien est invalide ou a expiré. Veuillez refaire une demande.");
    }

    const passwordHash = await argon2.hash(password);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    return next(error);
  }
}
