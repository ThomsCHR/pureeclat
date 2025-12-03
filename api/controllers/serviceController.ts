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

// Création d'un nouveau soin (réservé admin)
export const createService = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      priceCents,
      durationMinutes,
      categoryId,
      shortDescription,
      description,
      imageUrl,
    } = req.body as {
      name?: string;
      slug?: string;
      priceCents?: number | null;
      durationMinutes?: number | null;
      categoryId?: number;
      shortDescription?: string | null;
      description?: string | null;
      imageUrl?: string | null;
    };

    // ⚠️ ICI on vérifie bien categoryId (PAS categorySlug)
    if (!name || !categoryId) {
      return res
        .status(400)
        .json({ message: "Le nom du soin et la catégorie sont obligatoires." });
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(400).json({ message: "Catégorie introuvable." });
    }

    // Slug de base : soit slug envoyé, soit généré à partir du nom
    const baseSlug =
      slug ||
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    let finalSlug = baseSlug || "soin";
    let i = 1;

    // S'assurer que le slug est unique
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.service.findUnique({
        where: { slug: finalSlug },
      });
      if (!existing) break;
      finalSlug = `${baseSlug}-${i++}`;
    }

    // Positionner le soin à la fin de sa catégorie
    const maxOrder = await prisma.service.aggregate({
      where: { categoryId: category.id },
      _max: { orderInCategory: true },
    });

    const orderInCategory = (maxOrder._max.orderInCategory ?? 0) + 1;

    const newService = await prisma.service.create({
      data: {
        name,
        slug: finalSlug,
        priceCents: priceCents ?? null,
        durationMinutes: durationMinutes ?? null,
        shortDescription: shortDescription ?? null,
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        categoryId: category.id,
        orderInCategory,
      },
      include: {
        category: true,
        options: true,
      },
    });

    return res.status(201).json(newService);
  } catch (error) {
    console.error("Erreur createService:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔥 Suppression DEFINITIVE d'un soin (admin uniquement)
export const deleteService = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID de soin invalide." });
    }

    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Soin introuvable." });
    }

    // On fait tout dans une transaction
    await prisma.$transaction(async (tx) => {
      // 1) supprimer tous les rendez-vous liés à ce soin
      await tx.appointment.deleteMany({
        where: { serviceId: id },
      });

      // 2) supprimer toutes les options de ce soin
      await tx.serviceOption.deleteMany({
        where: { serviceId: id },
      });

      // 3) supprimer le soin lui-même
      await tx.service.delete({
        where: { id },
      });
    });

    return res.json({ message: "Soin supprimé avec succès." });
  } catch (error) {
    console.error("Erreur deleteService:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};


// 🔄 Mise à jour d'un soin (admin uniquement)
export const updateService = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID de soin invalide." });
    }

    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Soin introuvable." });
    }

    const {
      name,
      slug,
      priceCents,
      durationMinutes,
      categoryId,
      shortDescription,
      description,
      imageUrl,
      isActive,
    } = req.body as {
      name?: string;
      slug?: string;
      priceCents?: number | null;
      durationMinutes?: number | null;
      categoryId?: number;
      shortDescription?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      isActive?: boolean;
    };

    const updateData: any = {};

    // --- GESTION CATEGORIE ---
    let finalCategoryId = existing.categoryId;

    if (typeof categoryId === "number") {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(400).json({ message: "Catégorie introuvable." });
      }

      finalCategoryId = category.id;
      updateData.categoryId = finalCategoryId;
    }

    // --- GESTION SLUG ---
    // 1) on part du slug actuel
    let finalSlug = existing.slug;

    // Helper pour normaliser un slug
    const makeSlug = (raw: string) =>
      raw
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // 2) Priorité au slug envoyé dans le body, s'il est non vide
    if (typeof slug === "string" && slug.trim() !== "") {
      const baseSlug = makeSlug(slug);
      finalSlug = baseSlug || existing.slug;
    } else if (typeof name === "string" && name.trim() !== "") {
      // 3) Si pas de slug envoyé mais le nom change : on peut regénérer le slug
      const baseSlug = makeSlug(name);
      finalSlug = baseSlug || existing.slug;
    }

    // 4) Vérifier l'unicité du slug (hors soin actuel)
    if (finalSlug !== existing.slug) {
      let candidate = finalSlug;
      let i = 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const conflict = await prisma.service.findUnique({
          where: { slug: candidate },
        });

        if (!conflict || conflict.id === existing.id) {
          // soit pas de conflit, soit c'est ce même soin
          finalSlug = candidate;
          break;
        }

        candidate = `${finalSlug}-${i++}`;
      }

      updateData.slug = finalSlug;
    }

    // --- AUTRES CHAMPS SIMPLES ---

    if (typeof name === "string") {
      updateData.name = name;
    }

    if ("priceCents" in req.body) {
      updateData.priceCents = priceCents ?? null;
    }

    if ("durationMinutes" in req.body) {
      updateData.durationMinutes = durationMinutes ?? null;
    }

    if ("shortDescription" in req.body) {
      updateData.shortDescription = shortDescription ?? null;
    }

    if ("description" in req.body) {
      updateData.description = description ?? null;
    }

    if ("imageUrl" in req.body) {
      updateData.imageUrl = imageUrl ?? null;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    // Si la catégorie change, on peut choisir de repositionner le soin
    if (updateData.categoryId && updateData.categoryId !== existing.categoryId) {
      const maxOrder = await prisma.service.aggregate({
        where: { categoryId: updateData.categoryId },
        _max: { orderInCategory: true },
      });

      const newOrderInCategory = (maxOrder._max.orderInCategory ?? 0) + 1;
      updateData.orderInCategory = newOrderInCategory;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        options: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Erreur updateService:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};