import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// Stockage en mémoire (pas de disque)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format non supporté. Utilisez JPG, PNG ou WebP."));
    }
  },
});

type RequestWithFile = Request & { file?: { buffer: Buffer; mimetype: string; originalname: string; size: number } };

router.post(
  "/image",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  async (req: RequestWithFile, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "Aucun fichier reçu." });
        return;
      }

      // Upload vers Cloudinary depuis le buffer mémoire
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "pureeclat/services", resource_type: "image" },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Upload échoué."));
            else resolve(result as { secure_url: string });
          }
        );
        stream.end(req.file!.buffer);
      });

      res.json({ url: result.secure_url });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
