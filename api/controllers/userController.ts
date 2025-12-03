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
