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
      select: {
        id: true,
        startAt: true,
        status: true,
        notes: true,
        practitionerId: true,
        customServiceName: true,
        customPriceCents: true,
        customDurationMinutes: true,
        service: { select: { id: true, name: true, durationMinutes: true, priceCents: true } },
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
        .map((a) => {
          const duration = a.customDurationMinutes ?? a.service?.durationMinutes ?? 60;
          return {
            id: a.id,
            startAt: a.startAt.toISOString(),
            endAt: new Date(a.startAt.getTime() + duration * 60_000).toISOString(),
            status: a.status,
            notes: a.notes ?? null,
            service: a.service ?? null,
            customServiceName: a.customServiceName ?? null,
            customPriceCents: a.customPriceCents ?? null,
            customDurationMinutes: a.customDurationMinutes ?? null,
            client: a.user,
          };
        }),
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
      customServiceName,
      customPriceCents,
      customDurationMinutes,
      startAt,
      clientFirstName,
      clientLastName,
      clientPhone,
      clientEmail,
      notes,
    } = req.body as {
      practitionerId: number;
      serviceId?: number;
      customServiceName?: string;
      customPriceCents?: number;
      customDurationMinutes?: number;
      startAt: string;
      clientFirstName: string;
      clientLastName: string;
      clientPhone: string;
      clientEmail?: string;
      notes?: string;
    };

    if (!practitionerId || !startAt || !clientFirstName || !clientLastName || !clientPhone) {
      throw new AppError(400, "Champs requis manquants.");
    }
    if (!serviceId && !customServiceName) {
      throw new AppError(400, "Un soin (catalogue ou personnalisé) est requis.");
    }

    let service: { durationMinutes: number | null } | null = null;
    if (serviceId) {
      service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) throw new AppError(404, "Soin introuvable.");
    }

    const practitioner = await prisma.user.findUnique({ where: { id: practitionerId } });
    if (!practitioner || practitioner.role !== UserRole.ESTHETICIENNE) {
      throw new AppError(404, "Esthéticienne introuvable.");
    }

    const startDate = new Date(startAt);
    const durationMinutes = customDurationMinutes ?? service?.durationMinutes ?? 60;
    const durationMs = durationMinutes * 60_000;
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
        serviceId: serviceId ?? null,
        customServiceName: customServiceName ?? null,
        customPriceCents: customPriceCents ?? null,
        customDurationMinutes: customDurationMinutes ?? null,
        startAt: startDate,
        notes: notes ?? null,
        status: AppointmentStatus.BOOKED,
      },
      include: {
        service: { select: { name: true, durationMinutes: true, priceCents: true } },
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
    const { serviceId, customServiceName, customPriceCents, customDurationMinutes, startAt, notes } = req.body as {
      serviceId?: number | null;
      customServiceName?: string | null;
      customPriceCents?: number | null;
      customDurationMinutes?: number | null;
      startAt?: string;
      notes?: string;
    };

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Rendez-vous introuvable.");

    const newStartAt = startAt ? new Date(startAt) : existing.startAt;

    // Résoudre la durée selon la nouvelle valeur ou l'existante
    const resolvedServiceId = serviceId !== undefined ? serviceId : existing.serviceId;
    const resolvedCustomDuration = customDurationMinutes !== undefined ? customDurationMinutes : existing.customDurationMinutes;

    let durationMinutes = resolvedCustomDuration ?? 60;
    if (resolvedServiceId) {
      const service = await prisma.service.findUnique({ where: { id: resolvedServiceId } });
      if (!service) throw new AppError(404, "Soin introuvable.");
      durationMinutes = resolvedCustomDuration ?? service.durationMinutes ?? 60;
    }
    const durationMs = durationMinutes * 60_000;
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
        serviceId: resolvedServiceId ?? null,
        customServiceName: customServiceName !== undefined ? customServiceName : existing.customServiceName,
        customPriceCents: customPriceCents !== undefined ? customPriceCents : existing.customPriceCents,
        customDurationMinutes: resolvedCustomDuration ?? null,
        startAt: newStartAt,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        service: { select: { name: true, durationMinutes: true, priceCents: true } },
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

// GET /api/staff/clients/search?q=
export const searchClients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);

    const q = ((req.query.q as string) ?? "").trim();
    if (q.length < 1) {
      res.json({ clients: [] });
      return;
    }

    const digits = q.replace(/\D/g, "");
    // Pour 1-2 caractères : startsWith (prénom ou nom commence par)
    // Pour 3+ caractères : contains (recherche partielle dans tout le nom)
    const useStartsWith = q.length <= 2;

    const clients = await prisma.user.findMany({
      where: {
        role: UserRole.CLIENT,
        isActive: true,
        OR: [
          {
            firstName: useStartsWith
              ? { startsWith: q, mode: "insensitive" }
              : { contains: q, mode: "insensitive" },
          },
          {
            lastName: useStartsWith
              ? { startsWith: q, mode: "insensitive" }
              : { contains: q, mode: "insensitive" },
          },
          ...(digits.length >= 4
            ? [{ phone: { contains: digits, mode: "insensitive" as const } }]
            : []),
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
      take: 8,
      orderBy: { lastName: "asc" },
    });

    // Filtrer les comptes walk-in (email fake) sauf si pas d'autres résultats
    const real = clients.filter((c) => !c.email.endsWith("@walkin.pureeclat.fr"));
    res.json({ clients: real.length > 0 ? real : clients });
  } catch (err) {
    next(err);
  }
};

// GET /api/staff/stats?date=YYYY-MM-DD&institute=xxx
export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    requireStaff(req);

    const dateStr = req.query.date as string | undefined;
    const institute = req.query.institute as string | undefined;

    if (!dateStr) throw new AppError(400, "Le paramètre date est requis.");

    const d = new Date(`${dateStr}T00:00:00.000Z`);

    // Semaine : lundi → dimanche
    const dow = d.getUTCDay(); // 0=dim, 1=lun, …, 6=sam
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - daysFromMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    // Mois : 1er → dernier jour
    const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const practitioners = await prisma.user.findMany({
      where: { role: UserRole.ESTHETICIENNE, isActive: true, ...(institute ? { institute } : {}) },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    });
    const practitionerIds = practitioners.map((p) => p.id);

    const apptSelect = {
      practitionerId: true,
      service: { select: { priceCents: true } },
    } as const;

    const [weekAppts, monthAppts] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          practitionerId: { in: practitionerIds },
          startAt: { gte: weekStart, lte: weekEnd },
          status: { not: AppointmentStatus.CANCELLED },
        },
        select: apptSelect,
      }),
      prisma.appointment.findMany({
        where: {
          practitionerId: { in: practitionerIds },
          startAt: { gte: monthStart, lte: monthEnd },
          status: { not: AppointmentStatus.CANCELLED },
        },
        select: apptSelect,
      }),
    ]);

    function groupByPract(appts: { practitionerId: number; service: { priceCents: number | null } }[]) {
      const map = new Map<number, { count: number; priceCents: number }>();
      for (const a of appts) {
        const cur = map.get(a.practitionerId) ?? { count: 0, priceCents: 0 };
        cur.count++;
        cur.priceCents += a.service.priceCents ?? 0;
        map.set(a.practitionerId, cur);
      }
      return practitioners.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        ...(map.get(p.id) ?? { count: 0, priceCents: 0 }),
      }));
    }

    res.json({
      week: {
        count: weekAppts.length,
        priceCents: weekAppts.reduce((sum, a) => sum + (a.service.priceCents ?? 0), 0),
        perPractitioner: groupByPract(weekAppts),
      },
      month: {
        count: monthAppts.length,
        priceCents: monthAppts.reduce((sum, a) => sum + (a.service.priceCents ?? 0), 0),
        perPractitioner: groupByPract(monthAppts),
      },
    });
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
