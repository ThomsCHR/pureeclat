import type { Request, Response } from "express";
import { prisma } from "../src/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "1h";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// 🚀 Transporter Nodemailer (config via .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function createToken(payload: { userId: number; role: string; isAdmin?: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Envoi de l'email de vérification
async function sendVerificationEmail(user: { id: number; email: string; firstName: string }) {
  // 1. Générer un token aléatoire
  const token = crypto.randomBytes(32).toString("hex");

  // 2. Enregistrer le token en BDD avec expiration (24h)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // 3. Construire le lien de vérification
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  // 4. Envoyer l'email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? '"Pure Éclat" <no-reply@pure-eclat.com>',
    to: user.email,
    subject: "Vérifiez votre adresse email",
    html: `
      <p>Bonjour ${user.firstName},</p>
      <p>Merci pour votre inscription sur Pure Éclat.</p>
      <p>Pour confirmer votre adresse email, cliquez sur le lien ci-dessous&nbsp;:</p>
      <p><a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">Vérifier mon adresse email</a></p>
      <p>Ce lien est valable pendant 24 heures.</p>
      <p>À très vite,<br/>L'équipe Pure Éclat</p>
    `,
  });
}

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs obligatoires ne sont pas remplis.",
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        message: "Un compte existe déjà avec cette adresse e-mail.",
      });
    }

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
        // emailVerifiedAt: null par défaut (champ nullable dans Prisma)
      },
    });

    // 🔐 envoyer l'email de vérification (sans bloquer la réponse)
    try {
      await sendVerificationEmail({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email de vérification:", err);
      // On ne bloque pas la création du compte pour ça
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
        emailVerified: !!user.emailVerifiedAt, // false à la création
      },
      message:
        "Compte créé. Un email de vérification vous a été envoyé. Pensez à vérifier vos spams.",
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors de la création du compte.",
    });
  }
}

// POST /api/auth/login
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
        emailVerified: !!user.emailVerifiedAt,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res
      .status(500)
      .json({ message: "Une erreur est survenue lors de la connexion." });
  }
}

// GET /api/auth/verify-email?token=xxx
export async function verifyEmail(req: Request, res: Response) {
  try {
    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token de vérification manquant." });
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return res
        .status(400)
        .json({ message: "Lien de vérification invalide ou déjà utilisé." });
    }

    if (record.expiresAt < new Date()) {
      // On peut supprimer le token expiré
      await prisma.emailVerificationToken.delete({
        where: { id: record.id },
      });

      return res
        .status(400)
        .json({ message: "Ce lien de vérification a expiré." });
    }

    // Mettre à jour l'utilisateur comme "email vérifié"
    await prisma.user.update({
      where: { id: record.userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    });

    // Supprimer tous les tokens de vérif pour cet utilisateur
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    });

    // Option 1 : JSON
    return res.json({
      message: "Votre adresse email a été vérifiée avec succès.",
    });

    // Option 2 (si tu préfères rediriger vers le front) :
    // return res.redirect(`${FRONTEND_URL}/email-verified`);
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    return res
      .status(500)
      .json({ message: "Une erreur est survenue lors de la vérification." });
  }
}
