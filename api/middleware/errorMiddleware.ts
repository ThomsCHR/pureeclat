// ─── Gestion centralisée des erreurs ──────────────────────────────────────────
// Ce fichier contient :
//  1. AppError : une classe d'erreur avec un code HTTP (ex: 404, 403, 400)
//  2. errorHandler : le middleware Express qui attrape toutes les erreurs
//     et renvoie une réponse JSON propre au client.

import type { Request, Response, NextFunction } from "express";

// ─── AppError ──────────────────────────────────────────────────────────────────
// Utilisation : throw new AppError(404, "Utilisateur introuvable.")
// Cela permet de sortir proprement d'une fonction async avec un code HTTP précis.

export class AppError extends Error {
  constructor(
    public statusCode: number, // code HTTP (400, 401, 403, 404, 409, 500...)
    message: string             // message lisible par le client
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── errorHandler ─────────────────────────────────────────────────────────────
// Express reconnaît un middleware d'erreur grâce à ses 4 paramètres (err, req, res, next).
// Il doit être enregistré en DERNIER dans index.ts via app.use(errorHandler).

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Si c'est une erreur qu'on a volontairement lancée (AppError),
  // on renvoie son code HTTP et son message directement.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Sinon c'est une erreur inattendue (bug) → on logue et on renvoie un 500 générique.
  console.error("[Erreur serveur]", err);
  return res.status(500).json({ message: "Une erreur interne est survenue." });
}
