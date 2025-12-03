import type { Request, Response } from "express";
import { prisma } from "../src/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "1h";

function createToken(payload: { userId: number; role: string; isAdmin?: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
      },
    });

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
    console.error("Error in login:", error);
    return res
      .status(500)
      .json({ message: "Une erreur est survenue lors de la connexion." });
  }
}
