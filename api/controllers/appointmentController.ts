import type { Response } from "express";
import {
  PrismaClient,
  AppointmentStatus,
  UserRole,
  type Appointment,
  type Service,
  type ServiceOption,
  type User,
} from "@prisma/client";
import type { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Type d'un rendez-vous avec ses relations incluses
type AppointmentWithRelations = Appointment & {
  service: Service;
  serviceOption: ServiceOption | null;
  practitioner: User;
};

/**
 * GET /api/appointments/me
 * Retourne les rendez-vous de l'utilisateur connecté (client)
 */
export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const userId = req.user.id;
    const now = new Date();

    const appointments: AppointmentWithRelations[] =
      await prisma.appointment.findMany({
        where: { userId },
        include: {
          service: true,
          serviceOption: true,
          practitioner: true,
        },
        orderBy: { startAt: "asc" },
      });

    const mapped = appointments.map((rdv) => {
      let status: "upcoming" | "past" | "cancelled";

      if (rdv.status === AppointmentStatus.CANCELLED) {
        status = "cancelled";
      } else if (rdv.startAt < now) {
        status = "past";
      } else {
        status = "upcoming";
      }

      return {
        id: rdv.id,
        date: rdv.startAt,
        treatment: rdv.serviceOption
          ? `${rdv.service.name} - ${rdv.serviceOption.name}`
          : rdv.service.name,
        practitioner: rdv.practitioner
          ? `${rdv.practitioner.firstName} ${rdv.practitioner.lastName}`
          : undefined,
        location: "Cabinet Pure Éclat",
        status,
      };
    });

    return res.json({ appointments: mapped });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des rendez-vous." });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const appointmentId = Number(req.params.id);

    if (Number.isNaN(appointmentId)) {
      return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }

    // On récupère le RDV
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous introuvable." });
    }

    const isOwner = appointment.userId === req.user.id;
    const isAdmin = req.user.isAdmin === true;

    // ❌ Si ni propriétaire ni admin → interdit
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à annuler ce rendez-vous.",
      });
    }

    const now = new Date();
    if (appointment.startAt < now) {
      return res.status(400).json({
        message: "Vous ne pouvez plus annuler un rendez-vous passé.",
      });
    }

    // On annule
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });

    return res.json({
      message: isAdmin
        ? "Rendez-vous annulé par l'administrateur."
        : "Rendez-vous annulé.",
      appointment: updated,
    });
  } catch (error) {
    console.error("cancelAppointment error:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'annulation du rendez-vous." });
  }
};

/**
 * GET /api/availability?serviceId=1&date=2025-12-02
 * Renvoie les créneaux disponibles par esthéticienne pour un service et une date
 */
export const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const serviceId = Number(req.query.serviceId);
    const dateStr = req.query.date as string | undefined;

    if (!serviceId || !dateStr) {
      return res
        .status(400)
        .json({ message: "serviceId et date sont requis." });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ message: "Soin introuvable." });
    }

    const durationMinutes = service.durationMinutes ?? 60;
    const slotDurationMs = durationMinutes * 60 * 1000;

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const practitioners = await prisma.user.findMany({
      where: {
        role: UserRole.ESTHETICIENNE,
        isActive: true,
      },
      orderBy: { lastName: "asc" },
    });

    if (practitioners.length === 0) {
      return res.json({ practitioners: [] });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId: { in: practitioners.map((p) => p.id) },
        startAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
    });

    const workStartHour = 9;
    const workEndHour = 18;

    const result = practitioners.map((p) => {
      const practitionerAppointments = appointments.filter(
        (a) => a.practitionerId === p.id
      );

      const slots: { start: string; end: string }[] = [];

      const workStart = new Date(dayStart);
      workStart.setUTCHours(workStartHour, 0, 0, 0);

      const workEnd = new Date(dayStart);
      workEnd.setUTCHours(workEndHour, 0, 0, 0);

      let current = workStart;

      while (current < workEnd) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDurationMs);
        if (slotEnd > workEnd) break;

        const overlaps = practitionerAppointments.some((rdv) => {
          const rdvStart = rdv.startAt;
          const rdvEnd = new Date(rdv.startAt.getTime() + slotDurationMs);
          return rdvStart < slotEnd && rdvEnd > slotStart;
        });

        if (!overlaps) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }

        current = new Date(current.getTime() + slotDurationMs);
      }

      return {
        practitionerId: p.id,
        practitionerName: `${p.firstName} ${p.lastName}`,
        slots,
      };
    });

    return res.json({ practitioners: result });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors du calcul des disponibilités." });
  }
};

/**
 * POST /api/appointments
 * Body: { serviceId, practitionerId, startAt, serviceOptionId? }
 * Crée un rendez-vous pour l'utilisateur connecté
 */
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const { serviceId, practitionerId, startAt, serviceOptionId } = req.body;

    if (!serviceId || !practitionerId || !startAt) {
      return res.status(400).json({
        message:
          "serviceId, practitionerId et startAt sont requis pour créer un rendez-vous.",
      });
    }

    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Date de début invalide." });
    }

    const now = new Date();
    if (startDate < now) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas réserver dans le passé." });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      return res.status(404).json({ message: "Soin introuvable." });
    }

    const durationMinutes = service.durationMinutes ?? 60;
    const durationMs = durationMinutes * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);

    const practitioner = await prisma.user.findUnique({
      where: { id: Number(practitionerId) },
    });

    if (!practitioner || practitioner.role !== UserRole.ESTHETICIENNE) {
      return res
        .status(400)
        .json({ message: "Praticienne invalide ou introuvable." });
    }

    let option: ServiceOption | null = null;
    if (serviceOptionId) {
      option = await prisma.serviceOption.findUnique({
        where: { id: Number(serviceOptionId) },
      });

      if (!option || option.serviceId !== service.id) {
        return res
          .status(400)
          .json({ message: "Option de soin invalide pour ce service." });
      }
    }

    const overlapping = await prisma.appointment.findFirst({
      where: {
        practitionerId: practitioner.id,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
        startAt: {
          lt: endDate,
          gt: new Date(startDate.getTime() - durationMs),
        },
      },
    });

    if (overlapping) {
      return res.status(400).json({
        message:
          "Ce créneau n'est plus disponible. Merci de choisir un autre horaire.",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        startAt: startDate,
        userId: req.user.id,
        practitionerId: practitioner.id,
        serviceId: service.id,
        serviceOptionId: option ? option.id : null,
        status: AppointmentStatus.BOOKED,
      },
      include: {
        service: true,
        serviceOption: true,
        practitioner: true,
      },
    });

    return res.status(201).json({
      message: "Rendez-vous créé avec succès.",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la création du rendez-vous." });
  }
};
export const getMyPractitionerAppointments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    if (req.user.role !== "ESTHETICIENNE") {
      return res.status(403).json({
        message: "Accès réservé aux esthéticiennes.",
      });
    }

    const practitionerId = req.user.id;
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: { practitionerId },
      include: {
        service: true,
        serviceOption: true,
        user: true, // client
      },
      orderBy: { startAt: "asc" },
    });

    const mapped = appointments.map((rdv) => {
      let status: "upcoming" | "past" | "cancelled";

      if (rdv.status === AppointmentStatus.CANCELLED) {
        status = "cancelled";
      } else if (rdv.startAt < now) {
        status = "past";
      } else {
        status = "upcoming";
      }

      return {
        id: rdv.id,
        date: rdv.startAt,
        treatment: rdv.serviceOption
          ? `${rdv.service.name} - ${rdv.serviceOption.name}`
          : rdv.service.name,
        clientName: `${rdv.user.firstName} ${rdv.user.lastName}`,
        status,
      };
    });

    return res.json({ appointments: mapped });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:
        "Erreur lors de la récupération des rendez-vous de vos clientes.",
    });
  }
};