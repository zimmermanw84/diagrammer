import { Router } from "express";

export const exportRouter = Router();

// Placeholder — implemented in T12
exportRouter.post("/vsdx", (_req, res) => {
  res.status(501).json({ error: "Not implemented — see T12" });
});
