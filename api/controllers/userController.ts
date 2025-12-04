// controllers/userController.ts
import type { Request, Response } from "express";
import { prisma } from "../src/prisma";

// GET /api/users
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

// MODIFY
export async function updateUserRole(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body as {
      role?: "CLIENT" | "ADMIN" | "ESTHETICIENNE";
    };

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    if (!role) {
      return res.status(400).json({ message: "Rôle manquant." });
    }

    if (!["CLIENT", "ADMIN", "ESTHETICIENNE"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    // 🔎 Récupérer l’utilisateur ciblé
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isAdmin: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // 🚫 Interdiction : on ne modifie jamais le rôle d’un admin
    if (targetUser.role === "ADMIN" || targetUser.isAdmin) {
      return res.status(403).json({
        message: "Impossible de modifier le rôle d’un administrateur.",
      });
    }

    // ✅ Mise à jour
    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        isAdmin: role === "ADMIN",
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

    return res.json({ user });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de l'utilisateur." });
  }
}


// DELETE
export async function deleteUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    // optionnel : empêcher un admin de se supprimer lui-même
    const authUserId = (req as any).user?.id as number | undefined;

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

    // 🔒 sécurité : on ne supprime pas les admins
    if (user.role === "ADMIN" || user.isAdmin) {
      return res
        .status(400)
        .json({ message: "Impossible de supprimer un compte administrateur." });
    }

    // 🔒 option : ne pas permettre de se supprimer soi-même
    if (authUserId && authUserId === user.id) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    // grâce aux onDelete: Cascade, ça virera aussi ses RDV + tokens
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
