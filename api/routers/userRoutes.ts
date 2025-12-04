import { Router } from "express";
import { getAllUsers, getUserAppointments, updateUserRole, deleteUser } from "../controllers/userController";
import { authMiddleware, requireAdmin, requireSuperAdmin } from "../middleware/authMiddleware";

const router = Router();

// GET /api/users — admin only
router.get("/", authMiddleware, requireAdmin, getAllUsers);

// Tous les RDV d'un utilisateur donné
router.get("/:id/appointments", authMiddleware, requireAdmin, getUserAppointments);

router.patch("/:id", authMiddleware, requireAdmin, updateUserRole);

router.delete("/:id", authMiddleware, requireSuperAdmin, deleteUser);

export default router;
