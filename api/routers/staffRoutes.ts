import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getPlanning, createStaffAppointment, updateStaffAppointment, deleteStaffAppointment, getStaffServices, searchClients, getStats } from "../controllers/staffController";

const router = Router();

router.get("/planning", authMiddleware, getPlanning);
router.get("/stats", authMiddleware, getStats);
router.post("/appointments", authMiddleware, createStaffAppointment);
router.put("/appointments/:id", authMiddleware, updateStaffAppointment);
router.delete("/appointments/:id", authMiddleware, deleteStaffAppointment);
router.get("/services", authMiddleware, getStaffServices);
router.get("/clients/search", authMiddleware, searchClients);

export default router;
