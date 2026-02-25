import type { Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "../src/prisma";
import { AppError } from "../middleware/errorMiddleware";
import type { AuthRequest } from "../middleware/authMiddleware";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function createPaymentIntent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { serviceId } = req.body as { serviceId?: number };

    if (!serviceId) throw new AppError(400, "serviceId est requis.");

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new AppError(404, "Soin introuvable.");
    if (!service.priceCents) throw new AppError(400, "Ce soin n'a pas de prix défini.");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: service.priceCents,
      currency: "eur",
      metadata: {
        serviceId: String(service.id),
        userId: String(req.user?.id ?? 0),
      },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return next(error);
  }
}
