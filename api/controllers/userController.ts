import type { Request, Response, NextFunction } from "express";
import { prisma } from "../src/prisma";
import type { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "@prisma/client";

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

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const clientAppointmentsRaw = await prisma.appointment.findMany({
      where: { userId: id },
      orderBy: { startAt: "desc" },
      include: {
        service: true,
        practitioner: true,
      },
    });

    const practitionerAppointmentsRaw = await prisma.appointment.findMany({
      where: { practitionerId: id },
      orderBy: { startAt: "desc" },
      include: {
        service: true,
        user: true,
      },
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

    return res.json({
      user,
      clientAppointments,
      practitionerAppointments,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body as { role?: UserRole };

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    if (!role) {
      return res.status(400).json({ message: "Rôle manquant." });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    if (req.user?.role === UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier un autre administrateur.",
      });
    }

    if (
      req.user?.role === UserRole.ADMIN &&
      targetUser.role === UserRole.SUPERADMIN
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier un SUPERADMIN.",
      });
    }

    const isChangingAdminState =
      targetUser.role === UserRole.ADMIN || role === UserRole.ADMIN;

    if (isChangingAdminState && req.user?.role !== UserRole.SUPERADMIN) {
      return res.status(403).json({
        message: "Seul le SUPERADMIN peut gérer les administrateurs.",
      });
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

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    const authUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPERADMIN ||
      user.isAdmin
    ) {
      return res.status(400).json({
        message: "Impossible de supprimer un compte administrateur.",
      });
    }

    if (authUserId && authUserId === user.id) {
      return res.status(400).json({
        message: "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    return res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    return next(error);
  }
}
