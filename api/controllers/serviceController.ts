import { Request, Response} from 'express';
import { prisma } from "../src/prisma";

// Récupérer tous les services

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: true,
        options: true,
      },
      orderBy: [
        { category: { order: "asc" } },
        { orderInCategory: "asc" },
      ],
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur getAllServices:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer un service par son slug

export const getServiceBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        category: true,
        options: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Soin introuvable" });
    }

    res.json(service);
  } catch (error) {
    console.error("Erreur getServiceBySlug:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};