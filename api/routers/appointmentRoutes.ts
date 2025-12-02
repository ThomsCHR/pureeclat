import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getMyAppointments,
  cancelAppointment,
  createAppointment,
  getMyPractitionerAppointments
} from "../controllers/appointmentController";

const router = Router();

router.get("/me", authMiddleware, getMyAppointments);
router.post("/", authMiddleware, createAppointment);
router.post("/:id/cancel", authMiddleware, cancelAppointment);
router.get("/practitioner/me", authMiddleware, getMyPractitionerAppointments);

export default router;
