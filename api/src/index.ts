// ─── Point d'entrée du serveur Express ────────────────────────────────────────
// Ce fichier configure l'application : CORS, middlewares, routes, et démarre
// le serveur sur le port défini.

import 'dotenv/config';
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

// Importation de toutes les routes
import authRoutes        from "../routers/authRoutes";
import serviceRoutes     from "../routers/serviceRoutes";
import appointmentRoutes from "../routers/appointmentRoutes";
import availabilityRoutes from "../routers/availabilityRoutes";
import categoryRoutes    from "../routers/categoryRoutes";
import userRoutes        from "../routers/userRoutes";
import staffRoutes       from "../routers/staffRoutes";
import uploadRoutes      from "../routers/uploadRoutes";

// Middlewares personnalisés
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";
import { errorHandler }                 from "../middleware/errorMiddleware";

// ─── Création de l'app ─────────────────────────────────────────────────────────

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
// On autorise uniquement les origines listées dans la variable d'environnement
// ALLOWED_ORIGINS (séparées par des virgules). Par défaut : localhost:5173 (Vite).
// credentials: true est obligatoire pour que les cookies HttpOnly fonctionnent.

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // permet l'envoi/réception de cookies cross-origin
}));

// ─── Middlewares globaux ────────────────────────────────────────────────────────
// cookieParser : lit les cookies de la requête et les met dans req.cookies
// express.json : parse le body JSON des requêtes POST/PUT/PATCH

app.use(cookieParser());
app.use(express.json());

// ─── Fichiers statiques ────────────────────────────────────────────────────────
// Les images uploadées sont servies directement via /uploads/nom-du-fichier

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Routes API ───────────────────────────────────────────────────────────────

app.use("/api/auth",         authRoutes);
app.use("/api/services",     serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/categories",   categoryRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/staff",        staffRoutes);
app.use("/api/uploads",      uploadRoutes);

// ─── Routes utilitaires ────────────────────────────────────────────────────────

// Infos sur l'utilisateur connecté (via cookie)
app.get("/api/me", authMiddleware, (req, res) => {
  // @ts-ignore
  res.json({ user: req.user });
});

// Route de test pour la zone admin (non utilisée en prod, utile pour déboguer)
app.get("/api/admin/secret", authMiddleware, requireAdmin, (_req, res) => {
  res.json({ message: "Zone admin - accès autorisé" });
});

// Vérification que le serveur est bien démarré (utilisé par les health checks)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Gestionnaire d'erreurs global ─────────────────────────────────────────────
// Doit être enregistré EN DERNIER pour capturer toutes les erreurs des routes

app.use(errorHandler);

// ─── Démarrage du serveur ──────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
