import { Router } from "express";
import { createPaymentIntent } from "../controllers/paymentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/create-intent", authMiddleware, createPaymentIntent);

export default router;
