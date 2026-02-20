import { Request, Response, NextFunction } from "express";
import { prisma } from "../src/prisma";

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};
