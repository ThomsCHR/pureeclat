import { Router } from "express";
import { getAvailability } from "../controllers/appointmentController";

const router = Router();

router.get("/", getAvailability);

export default router;
