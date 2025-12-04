// controllers/userController.ts
import type { Request, Response } from "express";
import { prisma } from "../src/prisma";
import type { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "@prisma/client";

// ---------------------------------------------
// GET /api/users
// ---------------------------------------------
export async function getAllUsers(req: Request, res: Response) {
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
    console.error("Error in getAllUsers:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors du chargement des utilisateurs." });
  }
}

/**
 * GET /api/users/:id/appointments
 * Tous les RDV liés à un utilisateur (en tant que client & praticienne)
 * Admin uniquement
 */
export async function getUserAppointments(req: Request, res: Response) {
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

    // RDV où la personne est cliente
    const clientAppointmentsRaw = await prisma.appointment.findMany({
      where: { userId: id },
      orderBy: { startAt: "desc" },
      include: {
        service: true,
        practitioner: true,
      },
    });

    // RDV où la personne est praticienne
    const practitionerAppointmentsRaw = await prisma.appointment.findMany({
      where: { practitionerId: id },
      orderBy: { startAt: "desc" },
      include: {
        service: true,
        user: true, // client
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
    console.error("Error in getUserAppointments:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors du chargement des rendez-vous." });
  }
}

// ---------------------------------------------
// PATCH /api/users/:id — modifier le rôle
// ---------------------------------------------
export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body as { role?: UserRole };

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    if (!role) {
      return res.status(400).json({ message: "Rôle manquant." });
    }

    // sécurité typée : vérifier que le rôle est bien dans l'enum Prisma
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // --- 🔒 RÈGLES DE SÉCURITÉ ---

    // 1️⃣ Un ADMIN ne peut PAS modifier un ADMIN
    if (req.user?.role === UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier un autre administrateur.",
      });
    }

    // 2️⃣ Un ADMIN ne peut PAS modifier un SUPERADMIN
    if (
      req.user?.role === UserRole.ADMIN &&
      targetUser.role === UserRole.SUPERADMIN
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier un SUPERADMIN.",
      });
    }

    // 3️⃣ Seul SUPERADMIN peut promouvoir/déclasser un ADMIN
    const isChangingAdminState =
      targetUser.role === UserRole.ADMIN || role === UserRole.ADMIN;

    if (isChangingAdminState && req.user?.role !== UserRole.SUPERADMIN) {
      return res.status(403).json({
        message: "Seul le SUPERADMIN peut gérer les administrateurs.",
      });
    }

    // --- Mise à jour autorisée ---
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
    console.error("Error in updateUserRole:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

// ---------------------------------------------
// DELETE /api/users/:id — supprimer un utilisateur (non admin)
// ---------------------------------------------
export async function deleteUser(req: AuthRequest, res: Response) {
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

    // 🔒 sécurité : on ne supprime pas les admins (ADMIN ou SUPERADMIN)
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPERADMIN ||
      user.isAdmin
    ) {
      return res.status(400).json({
        message: "Impossible de supprimer un compte administrateur.",
      });
    }

    // 🔒 option : ne pas permettre de se supprimer soi-même
    if (authUserId && authUserId === user.id) {
      return res.status(400).json({
        message: "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    // grâce aux onDelete: Cascade, ça supprime aussi ses RDV + tokens
    await prisma.user.delete({
      where: { id: user.id },
    });

    return res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la suppression de l'utilisateur." });
  }
}
