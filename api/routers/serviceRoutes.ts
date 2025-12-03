
import { Router } from "express";
import { getAllServices, getServiceBySlug, createService, deleteService } from "../controllers/serviceController";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";
import { create } from "domain";

const router = Router();

//récupérer tous les services
router.get("/", getAllServices);


router.post("/", authMiddleware, requireAdmin, createService);
router.delete("/:id", authMiddleware, requireAdmin, deleteService);


//récupérer un service par son slug

router.get("/:slug", getServiceBySlug);



export default router;
