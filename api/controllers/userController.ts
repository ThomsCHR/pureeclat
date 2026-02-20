import type { Request, Response, NextFunction } from "express";
import { prisma } from "../src/prisma";
import type { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "@prisma/client";
import { AppError } from "../middleware/errorMiddleware";

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

    const isChangingAdminState =
      targetUser.role === UserRole.ADMIN || role === UserRole.ADMIN;

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
