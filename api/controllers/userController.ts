import type { Request, Response, NextFunction } from "express";
import { prisma } from "../src/prisma";
import argon2 from "argon2";
import crypto from "crypto";
import validator from "validator";
import { Resend } from "resend";
import type { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "@prisma/client";
import { AppError } from "../middleware/errorMiddleware";

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM = process.env.RESEND_FROM || "PureÉclat <onboarding@resend.dev>";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, phone, password } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      throw new AppError(400, "Prénom, nom et email sont obligatoires.");
    }

    if (!validator.isEmail(email)) throw new AppError(400, "Adresse e-mail invalide.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Un compte existe déjà avec cette adresse e-mail.");

    const rawPassword = password?.trim() || crypto.randomBytes(12).toString("hex");
    const passwordHash = await argon2.hash(rawPassword);

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isAdmin: true,
      },
    });

    try {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

      const setPasswordLink = `${CLIENT_URL}/reinitialisation-mot-de-passe?token=${token}`;

      await resend.emails.send({
        from: RESEND_FROM,
        to: [user.email],
        subject: "Votre compte PureÉclat a été créé",
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#0f172a;">
            <h1 style="font-size:20px; margin-bottom:8px;">Bonjour ${user.firstName} 👋</h1>
            <p style="font-size:14px; line-height:1.5;">
              Un compte a été créé pour vous sur <strong>PureÉclat</strong>.<br/>
              Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder à votre espace client.
              Ce lien est valable <strong>72 heures</strong>.
            </p>
            <a href="${setPasswordLink}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              Définir mon mot de passe
            </a>
            <p style="font-size:12px; color:#64748b;">
              Si vous n'attendiez pas cet email, vous pouvez l'ignorer.
            </p>
            <p style="font-size:13px; margin-top:16px; color:#64748b;">
              À très bientôt,<br/>L'équipe PureÉclat
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Erreur envoi email création compte:", emailErr);
    }

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
}

export async function getUserAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) throw new AppError(400, "ID utilisateur invalide.");

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    if (!user) throw new AppError(404, "Utilisateur introuvable.");

    const clientAppointmentsRaw = await prisma.appointment.findMany({
      where: { userId: id },
      orderBy: { startAt: "desc" },
      include: { service: true, practitioner: true },
    });

    const practitionerAppointmentsRaw = await prisma.appointment.findMany({
      where: { practitionerId: id },
      orderBy: { startAt: "desc" },
      include: { service: true, user: true },
    });

    const clientAppointments = clientAppointmentsRaw.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      status: a.status,
      serviceName: a.service.name,
      practitionerName: `${a.practitioner.firstName} ${a.practitioner.lastName}`,
    }));

    const practitionerAppointments = practitionerAppointmentsRaw.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      status: a.status,
      serviceName: a.service.name,
      clientName: `${a.user.firstName} ${a.user.lastName}`,
    }));

    return res.json({ user, clientAppointments, practitionerAppointments });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body as { role?: UserRole };

    if (Number.isNaN(id)) throw new AppError(400, "ID utilisateur invalide.");
    if (!role) throw new AppError(400, "Rôle manquant.");
    if (!Object.values(UserRole).includes(role)) throw new AppError(400, "Rôle invalide.");

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new AppError(404, "Utilisateur introuvable.");

    if (req.user?.role === UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
      throw new AppError(403, "Vous ne pouvez pas modifier un autre administrateur.");
    }

    if (req.user?.role === UserRole.ADMIN && targetUser.role === UserRole.SUPERADMIN) {
      throw new AppError(403, "Vous ne pouvez pas modifier un SUPERADMIN.");
    }

    const isChangingAdminState = targetUser.role === UserRole.ADMIN || role === UserRole.ADMIN;

    if (isChangingAdminState && req.user?.role !== UserRole.SUPERADMIN) {
      throw new AppError(403, "Seul le SUPERADMIN peut gérer les administrateurs.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role,
        isAdmin: role === UserRole.ADMIN || role === UserRole.SUPERADMIN,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isAdmin: true,
      },
    });

    return res.json({ user: updated });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserInfo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(400, "ID utilisateur invalide.");

    const { firstName, lastName, phone } = req.body as {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
    };

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AppError(404, "Utilisateur introuvable.");

    const data: { firstName?: string; lastName?: string; phone?: string | null } = {};
    if (typeof firstName === "string" && firstName.trim()) data.firstName = firstName.trim();
    if (typeof lastName === "string" && lastName.trim()) data.lastName = lastName.trim();
    if ("phone" in req.body) data.phone = phone?.trim() || null;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true },
    });

    return res.json({ user: updated });
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) throw new AppError(400, "ID utilisateur invalide.");

    const authUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isAdmin: true },
    });

    if (!user) throw new AppError(404, "Utilisateur introuvable.");

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN || user.isAdmin) {
      throw new AppError(400, "Impossible de supprimer un compte administrateur.");
    }

    if (authUserId && authUserId === user.id) {
      throw new AppError(400, "Vous ne pouvez pas supprimer votre propre compte.");
    }

    await prisma.user.delete({ where: { id: user.id } });

    return res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    return next(error);
  }
}
