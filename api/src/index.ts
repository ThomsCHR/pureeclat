import 'dotenv/config';
import express from "express";
import path from "path";
import cors from "cors";
import serviceRoutes from "../routers/serviceRoutes";
import authRoutes from "../routers/authRoutes";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";
import appointmentRoutes from "../routers/appointmentRoutes";
import availabilityRoutes from "../routers/availabilityRoutes";
import categoryRoutes from "../routers/categoryRoutes";
import userRoutes from "../routers/userRoutes";
import staffRoutes from "../routers/staffRoutes";
import uploadRoutes from "../routers/uploadRoutes";
import { errorHandler } from "../middleware/errorMiddleware";



const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Fichiers uploadés servis en statique
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/api/me", authMiddleware, (req, res) => {
  // @ts-ignore (ou mieux : typage avec AuthRequest)
  res.json({ user: req.user });
});
app.get("/api/admin/secret", authMiddleware, requireAdmin, (_req, res) => {
  res.json({ message: "Zone admin - accès autorisé" });
});



app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
