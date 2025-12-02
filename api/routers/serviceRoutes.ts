
import { Router } from "express";
import { getAllServices, getServiceBySlug } from "../controllers/serviceController";

const router = Router();

//récupérer tous les services
router.get("/", getAllServices);

//récupérer un service par son slug
router.get("/:slug", getServiceBySlug);

export default router;
