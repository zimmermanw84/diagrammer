import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { DiagramDocumentSchema } from "@diagrammer/shared";
import { DiagramImporter } from "../services/DiagramImporter.js";
import { ZodError } from "zod";

export const importRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "application/vnd.ms-visio.drawing" ||
      file.originalname.endsWith(".vsdx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .vsdx files are accepted"));
    }
  },
});

importRouter.post(
  "/vsdx",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      res.status(422).json({ error: "No file uploaded — expected a .vsdx file in the 'file' field" });
      return;
    }

    let doc;
    try {
      doc = await DiagramImporter.fromVsdx(req.file.buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse .vsdx file";
      res.status(422).json({ error: msg });
      return;
    }

    try {
      DiagramDocumentSchema.parse(doc);
    } catch (err) {
      if (err instanceof ZodError) {
        next(new Error(`DiagramImporter produced invalid document: ${err.message}`));
        return;
      }
      next(err);
      return;
    }

    res.json(doc);
  },
);
