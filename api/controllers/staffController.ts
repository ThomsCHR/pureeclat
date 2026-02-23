import type { Response, NextFunction } from "express";
import { PrismaClient, UserRole, AppointmentStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/authMiddleware";
import { AppError } from "../middleware/errorMiddleware";
import argon2 from "argon2";

const prisma = new PrismaClient();

const STAFF_ROLES: string[] = [
  UserRole.ESTHETICIENNE,
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
];

function requireStaff(req: AuthRequest) {
  if (!req.user || !STAFF_ROLES.includes(req.user.role)) {
    throw new AppError(403, "Accès réservé au personnel.");
  }
}

// GET /api/staff/planning?date=YYYY-MM-DD&institute=paris16
export const getPlanning = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);

    const dateStr = req.query.date as string | undefined;
    const institute = req.query.institute as string | undefined;

    if (!dateStr) throw new AppError(400, "Le paramètre date est requis.");

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const practitioners = await prisma.user.findMany({
      where: {
        role: UserRole.ESTHETICIENNE,
        isActive: true,
        ...(institute ? { institute } : {}),
      },
      orderBy: { lastName: "asc" },
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId: { in: practitioners.map((p) => p.id) },
        startAt: { gte: dayStart, lte: dayEnd },
        status: { not: AppointmentStatus.CANCELLED },
      },
      include: {
        service: { select: { id: true, name: true, durationMinutes: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
      orderBy: { startAt: "asc" },
    });

    const result = practitioners.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      institute: p.institute,
      appointments: appointments
        .filter((a) => a.practitionerId === p.id)
        .map((a) => ({
          id: a.id,
          startAt: a.startAt.toISOString(),
          endAt: new Date(
            a.startAt.getTime() + (a.service.durationMinutes ?? 60) * 60_000
          ).toISOString(),
          status: a.status,
          notes: a.notes ?? null,
          service: a.service,
          client: a.user,
        })),
    }));

    res.json({ date: dateStr, practitioners: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/staff/appointments
export const createStaffAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);

    const {
      practitionerId,
      serviceId,
      startAt,
      clientFirstName,
      clientLastName,
      clientPhone,
      clientEmail,
      notes,
    } = req.body as {
      practitionerId: number;
      serviceId: number;
      startAt: string;
      clientFirstName: string;
      clientLastName: string;
      clientPhone: string;
      clientEmail?: string;
      notes?: string;
    };

    if (!practitionerId || !serviceId || !startAt || !clientFirstName || !clientLastName || !clientPhone) {
      throw new AppError(400, "Champs requis manquants.");
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new AppError(404, "Soin introuvable.");

    const practitioner = await prisma.user.findUnique({ where: { id: practitionerId } });
    if (!practitioner || practitioner.role !== UserRole.ESTHETICIENNE) {
      throw new AppError(404, "Esthéticienne introuvable.");
    }

    const startDate = new Date(startAt);
    const durationMs = (service.durationMinutes ?? 60) * 60_000;
    const endDate = new Date(startDate.getTime() + durationMs);

    // Vérifier les chevauchements
    const overlap = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        status: { not: AppointmentStatus.CANCELLED },
        startAt: { lt: endDate },
        AND: [
          {
            startAt: {
              gte: new Date(startDate.getTime() - durationMs),
            },
          },
        ],
      },
    });
    if (overlap) throw new AppError(409, "Ce créneau est déjà réservé.");

    // Trouver ou créer le client
    let client = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: clientPhone },
          ...(clientEmail ? [{ email: clientEmail }] : []),
        ],
      },
    });

    if (!client) {
      const email = clientEmail ?? `${clientPhone.replace(/\s/g, "")}@walkin.pureeclat.fr`;
      const passwordHash = await argon2.hash(Math.random().toString(36) + Date.now());
      client = await prisma.user.create({
        data: {
          firstName: clientFirstName,
          lastName: clientLastName,
          phone: clientPhone,
          email,
          passwordHash,
          role: UserRole.CLIENT,
          isActive: true,
        },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: client.id,
        practitionerId,
        serviceId,
        startAt: startDate,
        notes: notes ?? null,
        status: AppointmentStatus.BOOKED,
      },
      include: {
        service: { select: { name: true, durationMinutes: true } },
        user: { select: { firstName: true, lastName: true, phone: true } },
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
};

// PUT /api/staff/appointments/:id
export const updateStaffAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);

    const id = Number(req.params.id);
    const { serviceId, startAt, notes } = req.body as {
      serviceId?: number;
      startAt?: string;
      notes?: string;
    };

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Rendez-vous introuvable.");

    const newServiceId = serviceId ?? existing.serviceId;
    const newStartAt = startAt ? new Date(startAt) : existing.startAt;

    const service = await prisma.service.findUnique({ where: { id: newServiceId } });
    if (!service) throw new AppError(404, "Soin introuvable.");

    const durationMs = (service.durationMinutes ?? 60) * 60_000;
    const newEndAt = new Date(newStartAt.getTime() + durationMs);

    // Vérifier chevauchements (en excluant le RDV courant)
    const overlap = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        practitionerId: existing.practitionerId,
        status: { not: AppointmentStatus.CANCELLED },
        startAt: { lt: newEndAt },
        AND: [{ startAt: { gte: new Date(newStartAt.getTime() - durationMs) } }],
      },
    });
    if (overlap) throw new AppError(409, "Ce créneau est déjà réservé.");

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        serviceId: newServiceId,
        startAt: newStartAt,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        service: { select: { name: true, durationMinutes: true } },
        user: { select: { firstName: true, lastName: true, phone: true } },
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/staff/appointments/:id
export const deleteStaffAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);

    const id = Number(req.params.id);
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Rendez-vous introuvable.");

    await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    res.json({ message: "Rendez-vous annulé." });
  } catch (err) {
    next(err);
  }
};

// GET /api/staff/services  (liste légère pour la modale)
export const getStaffServices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, durationMinutes: true, priceCents: true },
      orderBy: { name: "asc" },
    });
    res.json({ services });
  } catch (err) {
    next(err);
  }
};
