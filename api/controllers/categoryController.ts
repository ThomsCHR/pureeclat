import { Request, Response } from "express";
import { prisma } from "../src/prisma";


export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    res.json({ categories }); // 👈 important
  } catch (error) {
    console.error("Erreur getAllCategories:", error);
    res.status(500).json({ message: "Erreur serveur" }); // 👈 message pour coller au front
  }
};