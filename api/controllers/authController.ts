import type { Request, Response } from "express";
import { prisma } from "../src/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Resend } from "resend";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "1h";

// 👇 ici on regarde vraiment ce qui est chargé
console.log("RESEND_API_KEY loaded:", process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

// Génération du JWT
function createToken(payload: { userId: number; role: string; isAdmin?: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ---------------------------------------------
// POST /api/auth/register
// ---------------------------------------------
export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs obligatoires ne sont pas remplis.",
      });
    }

    // 🔍 Validation format email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Adresse e-mail invalide.",
      });
    }

    // 🔍 Vérifie si un compte existe déjà
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        message: "Un compte existe déjà avec cette adresse e-mail.",
      });
    }

    // 🔐 Hash du mot de passe
    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: "CLIENT",
        isActive: true,
      },
    });

    // ✉️ Email de bienvenue (best effort, ne bloque pas la création du compte)
    try {
      const { data, error } = await resend.emails.send({
        from: "PureÉclat <onboarding@resend.dev>", // domaine de test OK sans config
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

      if (error) {
        console.error("Erreur Resend:", error);
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email de bienvenue (throw):", err);
    }

    const token = createToken({
      userId: user.id,
      role: user.role,
      isAdmin: user.isAdmin,
    });

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
    console.error("Error in register:", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors de la création du compte.",
    });
  }
}

// ---------------------------------------------
// POST /api/auth/login
// ---------------------------------------------
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email et mot de passe sont requis." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ message: "Identifiants incorrects ou compte inactif." });
    }

    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    const token = createToken({
      userId: user.id,
      role: user.role,
      isAdmin: user.isAdmin,
    });

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
    console.error("Error in login:", error);
    return res
      .status(500)
      .json({ message: "Une erreur est survenue lors de la connexion." });
  }
}
