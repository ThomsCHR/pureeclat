import express from "express";
import 'dotenv/config';
import cors from "cors";
import serviceRoutes from "../routers/serviceRoutes";
import authRoutes from "../routers/authRoutes";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";



const app = express();
app.use(cors());

const PORT = 3000;

app.use(express.json());

app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
