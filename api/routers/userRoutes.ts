import { Router } from "express";
import { createUser, getAllUsers, getUserAppointments, updateUserRole, updateUserInfo, deleteUser } from "../controllers/userController";
import { authMiddleware, requireAdmin, requireSuperAdmin } from "../middleware/authMiddleware";

const router = Router();

// GET /api/users — admin only
router.get("/", authMiddleware, requireAdmin, getAllUsers);

// POST /api/users — créer un client (admin)
router.post("/", authMiddleware, requireAdmin, createUser);

// Tous les RDV d'un utilisateur donné
router.get("/:id/appointments", authMiddleware, requireAdmin, getUserAppointments);

router.patch("/:id", authMiddleware, requireAdmin, updateUserRole);
router.put("/:id", authMiddleware, requireAdmin, updateUserInfo);

router.delete("/:id", authMiddleware, requireSuperAdmin, deleteUser);

export default router;
