import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { DiagramDocumentSchema } from "@diagrammer/shared";
import { DiagramMapper } from "../services/DiagramMapper.js";
import { ZodError } from "zod";

export const exportRouter = Router();

exportRouter.post("/vsdx", async (req: Request, res: Response, next: NextFunction) => {
  let doc;
  try {
    doc = DiagramDocumentSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ error: "Invalid DiagramDocument", issues: err.issues });
      return;
    }
    next(err);
    return;
  }

  let buffer: Buffer;
  try {
    buffer = await DiagramMapper.toVsdx(doc);
  } catch (err) {
    next(err);
    return;
  }

  const filename = `${doc.meta.title.replace(/[^a-z0-9_\-]/gi, "_") || "diagram"}.vsdx`;
  res.setHeader("Content-Type", "application/vnd.ms-visio.drawing");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
});
