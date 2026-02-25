// ─── Instance Prisma (singleton) ──────────────────────────────────────────────
// On exporte une seule instance de PrismaClient pour tout le projet.
// Créer plusieurs instances serait inutile et consommerait plus de ressources.

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
